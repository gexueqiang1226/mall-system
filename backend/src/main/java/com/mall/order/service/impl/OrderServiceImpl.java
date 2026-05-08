package com.mall.order.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mall.inventory.redis.RedisStockManager;
import com.mall.inventory.service.InventoryService;
import com.mall.order.entity.Order;
import com.mall.order.mapper.OrderMapper;
import com.mall.order.service.OrderService;
import com.mall.product.entity.Product;
import com.mall.product.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class OrderServiceImpl extends ServiceImpl<OrderMapper, Order> implements OrderService {

    @Autowired
    private RedisStockManager redisStockManager;

    @Autowired
    private ProductService productService;

    @Autowired
    private InventoryService inventoryService;

    private final ObjectMapper mapper = new ObjectMapper();

    @Override
    @Transactional
    public Order createOrder(Long userId, List<Map<String, Object>> items) {
        // items: list of {productId:Long, quantity:int}
        List<Long> pids = new ArrayList<>();
        List<Integer> qtys = new ArrayList<>();
        for (Map<String, Object> it : items) {
            pids.add(((Number) it.get("productId")).longValue());
            qtys.add(((Number) it.get("quantity")).intValue());
        }

        boolean locked = redisStockManager.lockMultiple(pids, qtys);
        if (!locked) return null;

        // record inventory log (lock) with DB snapshot
        for (int i = 0; i < pids.size(); i++) {
            Long pid = pids.get(i);
            Integer qty = qtys.get(i);
            Product p = productService.getById(pid);
            int before = p.getSellableStock() == null ? 0 : p.getSellableStock();
            int after = before - qty;
            inventoryService.record(pid, null, "lock", qty, "order lock", before, after, userId);
        }

        try {
            Order order = Order.builder()
                    .userId(userId)
                    .itemsJson(mapper.writeValueAsString(items))
                    .status(0)
                    .createTime(LocalDateTime.now())
                    .build();
            this.save(order);
            return order;
        } catch (Exception ex) {
            // rollback redis locks
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
        if (order.getStatus() != null && order.getStatus() == 1) return true; // already paid

        try {
            List<Map<String, Object>> items = mapper.readValue(order.getItemsJson(), new TypeReference<List<Map<String, Object>>>(){});
            for (Map<String, Object> it : items) {
                Long pid = ((Number) it.get("productId")).longValue();
                Integer qty = ((Number) it.get("quantity")).intValue();
                boolean ok = redisStockManager.confirmStock(pid, qty);
                if (!ok) {
                    // inconsistent state
                    return false;
                }
                // update DB: decrease lockedStock and increase soldCount
                Product p = productService.getById(pid);
                int before = p.getSellableStock() == null ? 0 : p.getSellableStock();
                int lockedBefore = p.getLockedStock() == null ? 0 : p.getLockedStock();
                p.setLockedStock(Math.max(0, lockedBefore - qty));
                p.setSoldCount((p.getSoldCount() == null ? 0 : p.getSoldCount()) + qty);
                productService.updateById(p);

                inventoryService.record(pid, orderId, "confirm", qty, "order paid", lockedBefore, p.getLockedStock(), order.getUserId());
            }
            order.setStatus(1);
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
        if (order.getStatus() != null && order.getStatus() == 2) return true; // already canceled

        try {
            List<Map<String, Object>> items = mapper.readValue(order.getItemsJson(), new TypeReference<List<Map<String, Object>>>(){});
            for (Map<String, Object> it : items) {
                Long pid = ((Number) it.get("productId")).longValue();
                Integer qty = ((Number) it.get("quantity")).intValue();
                boolean ok = redisStockManager.unlockStock(pid, qty);
                if (!ok) {
                    // still try to continue
                }
                // update DB lockedStock if needed
                Product p = productService.getById(pid);
                int lockedBefore = p.getLockedStock() == null ? 0 : p.getLockedStock();
                p.setLockedStock(Math.max(0, lockedBefore - qty));
                productService.updateById(p);
                inventoryService.record(pid, orderId, "unlock", qty, "order cancel", lockedBefore, p.getLockedStock(), order.getUserId());
            }
            order.setStatus(2);
            this.updateById(order);
            return true;
        } catch (Exception ex) {
            return false;
        }
    }
}
