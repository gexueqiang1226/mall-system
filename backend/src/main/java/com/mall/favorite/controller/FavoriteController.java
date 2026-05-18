package com.mall.favorite.controller;

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
        // 检查是否已收藏
        if (favoriteService.checkFavorite(userId, productId)) {
            return ResponseResult.fail(409, "已收藏该商品");
        }
        Favorite favorite = Favorite.builder()
                .userId(userId)
                .productId(productId)
                .build();
        favoriteService.save(favorite);
        return ResponseResult.success(favorite);
    }

    @DeleteMapping("/api/favorites/{id}")
    public ResponseResult removeFavorite(@PathVariable Long id) {
        boolean ok = favoriteService.removeById(id);
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
