package com.mall.order.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.mall.order.entity.Order;

import java.util.Map;

public interface OrderService extends IService<Order> {
    Order createOrder(Long userId, java.util.List<Map<String, Object>> items);
    boolean confirmOrder(Long orderId);
    boolean cancelOrder(Long orderId);
    boolean shipOrder(Long orderId);
    boolean refundOrder(Long orderId);
    Page<Order> listUserOrders(Long userId, Integer status, int page, int size);
    Page<Order> listAdminOrders(Integer status, String orderNo, int page, int size);
    Order getOrderDetail(Long orderId);
}
