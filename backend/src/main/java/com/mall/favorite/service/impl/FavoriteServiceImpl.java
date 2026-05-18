package com.mall.favorite.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.mall.favorite.entity.Favorite;
import com.mall.favorite.mapper.FavoriteMapper;
import com.mall.favorite.service.FavoriteService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FavoriteServiceImpl extends ServiceImpl<FavoriteMapper, Favorite> implements FavoriteService {

    @Override
    public List<Favorite> listByUserId(Long userId) {
        QueryWrapper<Favorite> wrapper = new QueryWrapper<Favorite>()
                .eq("user_id", userId)
                .orderByDesc("create_time");
        return this.list(wrapper);
    }

    @Override
    public boolean checkFavorite(Long userId, Long productId) {
        QueryWrapper<Favorite> wrapper = new QueryWrapper<Favorite>()
                .eq("user_id", userId)
                .eq("product_id", productId);
        return this.count(wrapper) > 0;
    }
}
