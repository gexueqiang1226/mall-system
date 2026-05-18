package com.mall.points.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.mall.points.entity.Points;
import com.mall.points.mapper.PointsMapper;
import com.mall.points.service.PointsService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PointsServiceImpl extends ServiceImpl<PointsMapper, Points> implements PointsService {

    @Override
    public Integer getBalance(Long userId) {
        QueryWrapper<Points> wrapper = new QueryWrapper<Points>()
                .eq("user_id", userId);
        List<Points> list = this.list(wrapper);
        return list.stream()
                .mapToInt(p -> p.getPoints() != null ? p.getPoints() : 0)
                .sum();
    }

    @Override
    public List<Points> getHistory(Long userId, int page, int size) {
        Page<Points> pageParam = new Page<>(page, size);
        QueryWrapper<Points> wrapper = new QueryWrapper<Points>()
                .eq("user_id", userId)
                .orderByDesc("create_time");
        Page<Points> result = this.page(pageParam, wrapper);
        return result.getRecords();
    }

    @Override
    public boolean exchange(Long userId, Long productId, Integer points, String description) {
        Integer balance = getBalance(userId);
        if (balance == null || balance + points < 0) {
            return false;
        }
        Points record = Points.builder()
                .userId(userId)
                .points(points)
                .type("redeem")
                .orderId(productId)
                .description(description)
                .build();
        this.save(record);
        return true;
    }
}
