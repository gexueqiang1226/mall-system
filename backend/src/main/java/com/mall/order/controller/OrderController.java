package com.mall.order.controller;

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

    @PostMapping("/api/orders")
    public ResponseResult createOrder(@RequestBody Map<String, Object> body) {
        Long userId = body.get("userId") == null ? null : ((Number) body.get("userId")).longValue();
        List<Map<String, Object>> items = (List<Map<String, Object>>) body.get("items");
        if (userId == null || items == null || items.isEmpty()) {
            return ResponseResult.fail(400, "invalid request");
        }
        Order order = orderService.createOrder(userId, items);
        if (order == null) return ResponseResult.fail(409, "库存不足或创建订单失败");
        return ResponseResult.success(order);
    }

    @PostMapping("/api/orders/{id}/pay-confirm")
    public ResponseResult payConfirm(@PathVariable Long id) {
        boolean ok = orderService.confirmOrder(id);
        if (!ok) return ResponseResult.fail(500, "确认订单失败");
        return ResponseResult.success("ok");
    }

    @PostMapping("/api/orders/{id}/cancel")
    public ResponseResult cancel(@PathVariable Long id) {
        boolean ok = orderService.cancelOrder(id);
        if (!ok) return ResponseResult.fail(500, "取消订单失败");
        return ResponseResult.success("ok");
    }
}
