package com.mall.inventory.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.mall.inventory.entity.InventoryLog;
import com.mall.inventory.service.InventoryService;
import com.mall.common.response.ResponseResult;
import com.mall.product.entity.Product;
import com.mall.product.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin/api")
public class InventoryController {

    @Autowired
    private InventoryService inventoryService;

    @Autowired
    private ProductService productService;

    @GetMapping("/inventory-logs")
    public ResponseResult listLogs(@RequestParam(required = false) Long productId,
                                   @RequestParam(defaultValue = "1") int page,
                                   @RequestParam(defaultValue = "20") int size) {
        Page<InventoryLog> pager = inventoryService.listLogs(productId, page, size);
        // 批量填充productName
        java.util.Set<Long> pids = pager.getRecords().stream()
                .map(InventoryLog::getProductId).collect(Collectors.toSet());
        if (!pids.isEmpty()) {
            Map<Long, String> nameMap = productService.listByIds(pids).stream()
                    .collect(Collectors.toMap(Product::getId, Product::getProductName));
            pager.getRecords().forEach(log -> log.setProductName(nameMap.get(log.getProductId())));
        }
        return ResponseResult.success(pager);
    }
}
