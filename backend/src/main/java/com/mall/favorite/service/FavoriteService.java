package com.mall.favorite.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.mall.favorite.entity.Favorite;

import java.util.List;

public interface FavoriteService extends IService<Favorite> {
    List<Favorite> listByUserId(Long userId);
    boolean checkFavorite(Long userId, Long productId);
    boolean removeByUserAndProduct(Long userId, Long productId);
}
