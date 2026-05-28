package com.mall.inventory.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.mall.inventory.entity.InventoryLog;

public interface InventoryService {
    void record(Long productId, Long orderId, String operationType, Integer change, String reason, Integer before, Integer after, Long operatorId);

    Page<InventoryLog> listLogs(Long productId, int page, int size);
}
