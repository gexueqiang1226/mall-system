package com.mall.inventory.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.mall.inventory.entity.InventoryLog;
import com.mall.inventory.service.InventoryService;
import com.mall.common.response.ResponseResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/api")
public class InventoryController {

    @Autowired
    private InventoryService inventoryService;

    @GetMapping("/inventory-logs")
    public ResponseResult listLogs(@RequestParam(required = false) Long productId,
                                   @RequestParam(defaultValue = "1") int page,
                                   @RequestParam(defaultValue = "20") int size) {
        Page<InventoryLog> pager = inventoryService.listLogs(productId, page, size);
        return ResponseResult.success(pager);
    }
}
