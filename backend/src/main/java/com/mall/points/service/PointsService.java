package com.mall.points.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.mall.points.entity.Points;

import java.util.List;

public interface PointsService extends IService<Points> {
    Integer getBalance(Long userId);

    List<Points> getHistory(Long userId, int page, int size);

    boolean exchange(Long userId, Long productId, Integer points, String description);
}
