package com.mall.admin.controller;

import com.mall.common.response.ResponseResult;
import com.mall.order.entity.Order;
import com.mall.order.service.OrderService;
import com.mall.product.entity.Product;
import com.mall.product.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/api/dashboard")
public class DashboardController {

@Autowired
    private OrderService orderService;

    @Autowired
    private ProductService productService;

    @Autowired
    private com.mall.user.service.UserService userService;

    @GetMapping("/stats")
    public ResponseResult getStats() {
        Map<String, Object> stats = new HashMap<>();

        // Total orders
        long totalOrders = orderService.count();
        stats.put("totalOrders", totalOrders);

        // Today's orders
        List<Order> allOrders = orderService.list();
        long todayOrders = allOrders.stream()
                .filter(o -> o.getCreateTime() != null &&
                        o.getCreateTime().toLocalDate().equals(java.time.LocalDate.now()))
                .count();
        stats.put("todayOrders", todayOrders);

        // Total revenue (from paid orders)
        BigDecimal totalRevenue = allOrders.stream()
                .filter(o -> o.getStatus() != null && o.getStatus() >= 1 && o.getStatus() != 4)
                .map(o -> o.getTotalAmount() != null ? o.getTotalAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        stats.put("totalRevenue", totalRevenue);

        // Total products
        long totalProducts = productService.count();
        stats.put("totalProducts", totalProducts);

        // Low stock warnings
        List<Product> products = productService.list();
        long lowStockCount = products.stream()
                .filter(p -> p.getSellableStock() != null && p.getSellableStock() <= (p.getLowStockWarning() != null ? p.getLowStockWarning() : 20))
                .count();
        stats.put("lowStockCount", lowStockCount);

// Online products
        long onlineProducts = products.stream()
                .filter(p -> p.getIsOnline() != null && p.getIsOnline() == 1)
                .count();
        stats.put("onlineProducts", onlineProducts);

        // Total users
        long totalUsers = userService.count();
        stats.put("totalUsers", totalUsers);

        // Order status counts
        Map<String, Long> orderStatusCounts = new HashMap<>();
        for (int s = 0; s <= 5; s++) {
            final int status = s;
            orderStatusCounts.put(String.valueOf(status),
                    allOrders.stream().filter(o -> o.getStatus() != null && o.getStatus() == status).count());
        }
        stats.put("orderStatusCounts", orderStatusCounts);

        return ResponseResult.success(stats);
    }
}
