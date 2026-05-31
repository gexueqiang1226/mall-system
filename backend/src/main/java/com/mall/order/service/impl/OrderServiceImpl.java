package com.mall.order.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.mall.inventory.redis.RedisStockManager;
import com.mall.inventory.service.InventoryService;
import com.mall.order.entity.Order;
import com.mall.order.entity.OrderItem;
import com.mall.order.mapper.OrderItemMapper;
import com.mall.order.mapper.OrderMapper;
import com.mall.order.service.OrderService;
import com.mall.product.entity.Product;
import com.mall.product.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class OrderServiceImpl extends ServiceImpl<OrderMapper, Order> implements OrderService {

    @Autowired
    private RedisStockManager redisStockManager;

    @Autowired
    private ProductService productService;

    @Autowired
    private InventoryService inventoryService;

    @Autowired
    private OrderItemMapper orderItemMapper;

    private final AtomicLong orderNoSeq = new AtomicLong(0);

    private String generateOrderNo() {
        String date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        long seq = orderNoSeq.incrementAndGet() % 10000;
        return "ORD" + date + String.format("%04d", seq);
    }

    @Override
    @Transactional
    public Order createOrder(Long userId, List<Map<String, Object>> items) {
        List<Long> pids = new ArrayList<>();
        List<Integer> qtys = new ArrayList<>();
        for (Map<String, Object> it : items) {
            pids.add(((Number) it.get("productId")).longValue());
            qtys.add(((Number) it.get("quantity")).intValue());
        }

        boolean locked = redisStockManager.lockMultiple(pids, qtys);
        if (!locked) return null;

        for (int i = 0; i < pids.size(); i++) {
            Long pid = pids.get(i);
            Integer qty = qtys.get(i);
            Product p = productService.getById(pid);
            int before = p.getSellableStock() == null ? 0 : p.getSellableStock();
            int after = before - qty;
            inventoryService.record(pid, null, "lock", qty, "order lock", before, after, userId);
        }

        try {
            BigDecimal totalAmount = BigDecimal.ZERO;
            List<OrderItem> orderItems = new ArrayList<>();

            for (int i = 0; i < pids.size(); i++) {
                Long pid = pids.get(i);
                Integer qty = qtys.get(i);
                Product p = productService.getById(pid);
                BigDecimal price = p.getSalePrice() != null ? p.getSalePrice() : BigDecimal.ZERO;
                BigDecimal itemTotal = price.multiply(BigDecimal.valueOf(qty));
                totalAmount = totalAmount.add(itemTotal);

                OrderItem oi = OrderItem.builder()
                        .productId(pid)
                        .productName(p.getProductName())
                        .quantity(qty)
                        .price(price)
                        .totalAmount(itemTotal)
                        .createTime(LocalDateTime.now())
                        .build();
                orderItems.add(oi);
            }

            Order order = Order.builder()
                    .orderNo(generateOrderNo())
                    .userId(userId)
                    .totalAmount(totalAmount)
                    .payAmount(totalAmount)
                    .shippingAmount(BigDecimal.ZERO)
                    .discountAmount(BigDecimal.ZERO)
                    .status(0)
                    .createTime(LocalDateTime.now())
                    .updateTime(LocalDateTime.now())
                    .build();
            this.save(order);

            for (OrderItem oi : orderItems) {
                oi.setOrderId(order.getId());
                orderItemMapper.insert(oi);
            }

            order.setOrderItems(orderItems);
            return order;
        } catch (Exception ex) {
            for (int i = 0; i < pids.size(); i++) {
                try { redisStockManager.unlockStock(pids.get(i), qtys.get(i)); } catch (Exception e) {}
            }
            return null;
        }
    }

@Override
    @Transactional
    public boolean confirmOrder(Long orderId) {
        Order order = this.getById(orderId);
        if (order == null) return false;
        if (order.getStatus() != null && order.getStatus() >= 1) return true;

        try {
            List<OrderItem> items = orderItemMapper.selectList(
                    new QueryWrapper<OrderItem>().eq("order_id", orderId));
            for (OrderItem item : items) {
                Long pid = item.getProductId();
                Integer qty = item.getQuantity();
                boolean ok = redisStockManager.confirmStock(pid, qty);
                if (!ok) return false;

                Product p = productService.getById(pid);
                int lockedBefore = p.getLockedStock() == null ? 0 : p.getLockedStock();
                p.setLockedStock(Math.max(0, lockedBefore - qty));
                p.setSoldCount((p.getSoldCount() == null ? 0 : p.getSoldCount()) + qty);
                int sellableBefore = p.getSellableStock() == null ? 0 : p.getSellableStock();
                int sellableAfter = Math.max(0, sellableBefore - qty);
                p.setSellableStock(sellableAfter);
                productService.updateById(p);

                inventoryService.record(pid, orderId, "confirm", qty, "order paid", lockedBefore, p.getLockedStock(), order.getUserId());
            }
            order.setStatus(1);
            order.setPaymentTime(LocalDateTime.now());
            order.setUpdateTime(LocalDateTime.now());
            this.updateById(order);
            return true;
        } catch (Exception ex) {
            return false;
        }
    }

    @Override
    @Transactional
    public boolean cancelOrder(Long orderId) {
        Order order = this.getById(orderId);
        if (order == null) return false;
        if (order.getStatus() != null && order.getStatus() == 4) return true;

        try {
            List<OrderItem> items = orderItemMapper.selectList(
                    new QueryWrapper<OrderItem>().eq("order_id", orderId));
            for (OrderItem item : items) {
                Long pid = item.getProductId();
                Integer qty = item.getQuantity();
                redisStockManager.unlockStock(pid, qty);

                Product p = productService.getById(pid);
                int lockedBefore = p.getLockedStock() == null ? 0 : p.getLockedStock();
                p.setLockedStock(Math.max(0, lockedBefore - qty));
                productService.updateById(p);

                inventoryService.record(pid, orderId, "unlock", qty, "order cancel", lockedBefore, p.getLockedStock(), order.getUserId());
            }
            order.setStatus(4);
            order.setUpdateTime(LocalDateTime.now());
            this.updateById(order);
            return true;
        } catch (Exception ex) {
            return false;
        }
    }

    @Override
    @Transactional
    public boolean shipOrder(Long orderId) {
        Order order = this.getById(orderId);
        if (order == null) return false;
        if (order.getStatus() == null || order.getStatus() != 1) return false;
        order.setStatus(2);
        order.setShippingTime(LocalDateTime.now());
        order.setUpdateTime(LocalDateTime.now());
        this.updateById(order);
        return true;
    }

    @Override
    @Transactional
    public boolean refundOrder(Long orderId) {
        Order order = this.getById(orderId);
        if (order == null) return false;
        if (order.getStatus() == null || order.getStatus() < 1) return false;

        List<OrderItem> items = orderItemMapper.selectList(
                new QueryWrapper<OrderItem>().eq("order_id", orderId));
        for (OrderItem item : items) {
            Long pid = item.getProductId();
            Integer qty = item.getQuantity();
            Product p = productService.getById(pid);
            int stockBefore = p.getSellableStock() == null ? 0 : p.getSellableStock();
            p.setSellableStock(stockBefore + qty);
            productService.updateById(p);
            inventoryService.record(pid, orderId, "refund", qty, "order refund", stockBefore, p.getSellableStock(), order.getUserId());
        }

        order.setStatus(5);
        order.setUpdateTime(LocalDateTime.now());
        this.updateById(order);
        return true;
    }

    @Override
    public Page<Order> listUserOrders(Long userId, Integer status, int page, int size) {
        QueryWrapper<Order> wrapper = new QueryWrapper<Order>()
                .eq("user_id", userId)
                .eq(status != null, "status", status)
                .orderByDesc("create_time");
        return this.page(new Page<>(page, size), wrapper);
    }

    @Override
    public Page<Order> listAdminOrders(Integer status, String orderNo, int page, int size) {
        QueryWrapper<Order> wrapper = new QueryWrapper<Order>()
                .eq(status != null, "status", status)
                .like(orderNo != null && !orderNo.isEmpty(), "order_no", orderNo)
                .orderByDesc("create_time");
        Page<Order> pager = this.page(new Page<>(page, size), wrapper);
        // 加载每条订单的商品明细
        for (Order order : pager.getRecords()) {
            List<OrderItem> items = orderItemMapper.selectList(
                    new QueryWrapper<OrderItem>().eq("order_id", order.getId()));
            order.setOrderItems(items);
        }
        return pager;
    }

    @Override
    public Order getOrderDetail(Long orderId) {
        Order order = this.getById(orderId);
        if (order != null) {
            List<OrderItem> items = orderItemMapper.selectList(
                    new QueryWrapper<OrderItem>().eq("order_id", orderId));
            order.setOrderItems(items);
        }
        return order;
    }
}
