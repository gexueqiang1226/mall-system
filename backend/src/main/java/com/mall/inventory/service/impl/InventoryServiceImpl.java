package com.mall.inventory.service.impl;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.mall.inventory.entity.InventoryLog;
import com.mall.inventory.mapper.InventoryLogMapper;
import com.mall.inventory.service.InventoryService;
import org.springframework.stereotype.Service;

@Service
public class InventoryServiceImpl extends ServiceImpl<InventoryLogMapper, InventoryLog> implements InventoryService {

    @Override
    public void record(Long productId, Long orderId, String operationType, Integer change, String reason, Integer before, Integer after, Long operatorId) {
        InventoryLog log = InventoryLog.builder()
                .productId(productId)
                .orderId(orderId)
                .operationType(operationType)
                .quantityChange(change)
                .reason(reason)
                .stockBefore(before)
                .stockAfter(after)
                .operatorId(operatorId)
                .build();
        this.save(log);
    }

    @Override
    public Page<InventoryLog> listLogs(Long productId, int page, int size) {
        Page<InventoryLog> pager = new Page<>(page, size);
        return this.page(pager, new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<InventoryLog>().eq(productId != null, "product_id", productId).orderByDesc("operate_time"));
    }
}
