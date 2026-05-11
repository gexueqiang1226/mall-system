package com.mall.payment.controller;

import com.mall.common.response.ResponseResult;
import com.mall.order.entity.Order;
import com.mall.order.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    @Autowired
    private OrderService orderService;

    private final ConcurrentHashMap<String, Map<String, Object>> paymentRecords = new ConcurrentHashMap<>();

    @PostMapping("/create")
    public ResponseResult createPayment(@RequestBody Map<String, Object> body) {
        Long orderId = body.get("orderId") == null ? null : ((Number) body.get("orderId")).longValue();
        String paymentMethod = (String) body.getOrDefault("paymentMethod", "mock");

        if (orderId == null) {
            return ResponseResult.fail(400, "订单ID不能为空");
        }

        Order order = orderService.getById(orderId);
        if (order == null) {
            return ResponseResult.fail(404, "订单不存在");
        }

        if (order.getStatus() != null && order.getStatus() != 0) {
            return ResponseResult.fail(400, "订单状态不允许支付");
        }

        String paymentNo = "PAY" + UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase();

        Map<String, Object> payment = new HashMap<>();
        payment.put("paymentNo", paymentNo);
        payment.put("orderId", orderId);
        payment.put("amount", order.getTotalAmount());
        payment.put("paymentMethod", paymentMethod);
        payment.put("status", "pending");
        payment.put("createTime", LocalDateTime.now().toString());

        paymentRecords.put(paymentNo, payment);

        Map<String, Object> data = new HashMap<>();
        data.put("paymentNo", paymentNo);
        data.put("amount", order.getTotalAmount());
        data.put("status", "pending");

        return ResponseResult.success(data);
    }

    @PostMapping("/{paymentNo}/callback")
    public ResponseResult paymentCallback(@PathVariable String paymentNo) {
        Map<String, Object> payment = paymentRecords.get(paymentNo);
        if (payment == null) {
            return ResponseResult.fail(404, "支付单不存在");
        }

        if ("success".equals(payment.get("status"))) {
            return ResponseResult.success("已支付，请勿重复操作");
        }

        Long orderId = (Long) payment.get("orderId");

        boolean ok = orderService.confirmOrder(orderId);
        if (!ok) {
            return ResponseResult.fail(500, "支付确认失败");
        }

        payment.put("status", "success");
        payment.put("payTime", LocalDateTime.now().toString());

        Order order = orderService.getById(orderId);
        if (order != null) {
            order.setPaymentMethod((String) payment.get("paymentMethod"));
            orderService.updateById(order);
        }

        Map<String, Object> data = new HashMap<>();
        data.put("paymentNo", paymentNo);
        data.put("status", "success");
        data.put("orderId", orderId);

        return ResponseResult.success(data);
    }

    @GetMapping("/{paymentNo}")
    public ResponseResult getPayment(@PathVariable String paymentNo) {
        Map<String, Object> payment = paymentRecords.get(paymentNo);
        if (payment == null) {
            return ResponseResult.fail(404, "支付单不存在");
        }
        return ResponseResult.success(payment);
    }
}
