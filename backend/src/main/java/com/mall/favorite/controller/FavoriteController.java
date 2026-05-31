package com.mall.favorite.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.mall.favorite.entity.Favorite;
import com.mall.favorite.service.FavoriteService;
import com.mall.common.response.ResponseResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping
public class FavoriteController {

    @Autowired
    private FavoriteService favoriteService;

    @GetMapping("/api/favorites")
    public ResponseResult listFavorites(@RequestParam Long userId) {
        List<Favorite> list = favoriteService.listByUserId(userId);
        return ResponseResult.success(list);
    }

    @PostMapping("/api/favorites")
    public ResponseResult addFavorite(@RequestBody Map<String, Object> body) {
        Long userId = body.get("userId") == null ? null : ((Number) body.get("userId")).longValue();
        Long productId = body.get("productId") == null ? null : ((Number) body.get("productId")).longValue();
        if (userId == null || productId == null) {
            return ResponseResult.fail(400, "用户ID和商品ID不能为空");
        }

        // 检查是否已收藏（deleted=0）
        if (favoriteService.checkFavorite(userId, productId)) {
            return ResponseResult.fail(409, "已收藏该商品");
        }

        // 检查是否存在 deleted=1 的旧记录
        QueryWrapper<Favorite> wrapper = new QueryWrapper<Favorite>()
                .eq("user_id", userId)
                .eq("product_id", productId)
                .eq("deleted", 1);
        Favorite existingDeleted = favoriteService.getOne(wrapper);

        if (existingDeleted != null) {
            // 恢复旧记录：设置 deleted=0
            existingDeleted.setDeleted(0);
            favoriteService.updateById(existingDeleted);
            return ResponseResult.success(existingDeleted);
        } else {
            // 正常插入新记录
            Favorite favorite = Favorite.builder()
                    .userId(userId)
                    .productId(productId)
                    .deleted(0)
                    .build();
            favoriteService.save(favorite);
            return ResponseResult.success(favorite);
        }
    }

    @DeleteMapping("/api/favorites/{id}")
    public ResponseResult removeFavorite(@PathVariable Long id) {
        // 只删除 deleted=0 的记录（物理删除）
        QueryWrapper<Favorite> wrapper = new QueryWrapper<Favorite>()
                .eq("id", id)
                .eq("deleted", 0);
        boolean ok = favoriteService.remove(wrapper);
        if (!ok) {
            return ResponseResult.fail(404, "收藏不存在");
        }
        return ResponseResult.success("取消收藏成功");
    }

    // 根据userId+productId删除收藏（移动端用）
    @DeleteMapping("/api/favorites")
    public ResponseResult removeFavoriteByUserAndProduct(@RequestParam Long userId, @RequestParam Long productId) {
        boolean ok = favoriteService.removeByUserAndProduct(userId, productId);
        if (!ok) {
            return ResponseResult.fail(404, "收藏不存在");
        }
        return ResponseResult.success("取消收藏成功");
    }

    @GetMapping("/api/favorites/check")
    public ResponseResult checkFavorite(@RequestParam Long userId, @RequestParam Long productId) {
        boolean favorited = favoriteService.checkFavorite(userId, productId);
        Map<String, Object> data = new HashMap<>();
        data.put("favorited", favorited);
        return ResponseResult.success(data);
    }
}
