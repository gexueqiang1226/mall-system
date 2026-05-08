package com.mall.order.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.mall.order.entity.Order;

import java.util.List;
import java.util.Map;

public interface OrderService extends IService<Order> {
    Order createOrder(Long userId, List<Map<String, Object>> items);
    boolean confirmOrder(Long orderId);
    boolean cancelOrder(Long orderId);
}
