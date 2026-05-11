package com.mall.order.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.mall.common.response.ResponseResult;
import com.mall.order.entity.Order;
import com.mall.order.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping
public class OrderController {

    @Autowired
    private OrderService orderService;

    // === C端接口 ===

    @PostMapping("/api/orders")
    public ResponseResult createOrder(@RequestBody Map<String, Object> body) {
        Long userId = body.get("userId") == null ? null : ((Number) body.get("userId")).longValue();
        List<Map<String, Object>> items = (List<Map<String, Object>>) body.get("items");
        if (userId == null || items == null || items.isEmpty()) {
            return ResponseResult.fail(400, "参数不完整");
        }
        Order order = orderService.createOrder(userId, items);
        if (order == null) return ResponseResult.fail(409, "库存不足或创建订单失败");
        return ResponseResult.success(order);
    }

    @GetMapping("/api/orders/{id}")
    public ResponseResult getOrder(@PathVariable Long id) {
        Order order = orderService.getOrderDetail(id);
        if (order == null) return ResponseResult.fail(404, "订单不存在");
        return ResponseResult.success(order);
    }

    @GetMapping("/api/orders")
    public ResponseResult listUserOrders(
            @RequestParam Long userId,
            @RequestParam(required = false) Integer status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<Order> pager = orderService.listUserOrders(userId, status, page, size);
        return ResponseResult.success(pager);
    }

    @PostMapping("/api/orders/{id}/pay-confirm")
    public ResponseResult payConfirm(@PathVariable Long id) {
        boolean ok = orderService.confirmOrder(id);
        if (!ok) return ResponseResult.fail(500, "确认订单失败");
        return ResponseResult.success("支付成功");
    }

    @PostMapping("/api/orders/{id}/cancel")
    public ResponseResult cancel(@PathVariable Long id) {
        boolean ok = orderService.cancelOrder(id);
        if (!ok) return ResponseResult.fail(500, "取消订单失败");
        return ResponseResult.success("取消成功");
    }

    @PostMapping("/api/orders/{id}/receive")
    public ResponseResult receive(@PathVariable Long id) {
        Order order = orderService.getById(id);
        if (order == null) return ResponseResult.fail(404, "订单不存在");
        if (order.getStatus() == null || order.getStatus() != 2) {
            return ResponseResult.fail(400, "订单状态不允许确认收货");
        }
        order.setStatus(3);
        order.setReceiveTime(java.time.LocalDateTime.now());
        order.setUpdateTime(java.time.LocalDateTime.now());
        orderService.updateById(order);
        return ResponseResult.success("确认收货成功");
    }

    // === Admin 管理端接口 ===

    @GetMapping("/admin/api/orders")
    public ResponseResult listAdminOrders(
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) String orderNo,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<Order> pager = orderService.listAdminOrders(status, orderNo, page, size);
        return ResponseResult.success(pager);
    }

    @GetMapping("/admin/api/orders/{id}")
    public ResponseResult getAdminOrder(@PathVariable Long id) {
        Order order = orderService.getOrderDetail(id);
        if (order == null) return ResponseResult.fail(404, "订单不存在");
        return ResponseResult.success(order);
    }

    @PutMapping("/admin/api/orders/{id}/ship")
    public ResponseResult ship(@PathVariable Long id) {
        boolean ok = orderService.shipOrder(id);
        if (!ok) return ResponseResult.fail(500, "发货失败，请检查订单状态");
        return ResponseResult.success("发货成功");
    }

    @PutMapping("/admin/api/orders/{id}/refund")
    public ResponseResult refund(@PathVariable Long id) {
        boolean ok = orderService.refundOrder(id);
        if (!ok) return ResponseResult.fail(500, "退货失败");
        return ResponseResult.success("退货成功");
    }
}
