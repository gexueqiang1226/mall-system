package com.mall.review.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.mall.review.entity.Review;
import com.mall.review.mapper.ReviewMapper;
import com.mall.review.service.ReviewService;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ReviewServiceImpl extends ServiceImpl<ReviewMapper, Review> implements ReviewService {

    @Override
    public List<Review> listReviews(Long productId, int page, int size) {
        Page<Review> pageParam = new Page<>(page, size);
        QueryWrapper<Review> wrapper = new QueryWrapper<Review>()
                .eq(productId != null, "product_id", productId)
                .orderByDesc("create_time");
        Page<Review> result = this.page(pageParam, wrapper);
        return result.getRecords();
    }

    @Override
    public Map<String, Object> getStatistics(Long productId) {
        QueryWrapper<Review> wrapper = new QueryWrapper<Review>()
                .eq("product_id", productId);
        List<Review> reviews = this.list(wrapper);

        int total = reviews.size();
        Map<Integer, Integer> ratingCount = new HashMap<>();
        for (int i = 1; i <= 5; i++) {
            ratingCount.put(i, 0);
        }
        for (Review review : reviews) {
            int r = review.getRating() != null ? review.getRating() : 0;
            ratingCount.put(r, ratingCount.getOrDefault(r, 0) + 1);
        }

        int goodCount = ratingCount.getOrDefault(5, 0) + ratingCount.getOrDefault(4, 0);
        double goodRate = total > 0 ? Math.round(goodCount * 10000.0 / total) / 100.0 : 0.0;

        Map<String, Object> stats = new HashMap<>();
        stats.put("total", total);
        stats.put("ratingCount", ratingCount);
        stats.put("goodRate", goodRate);
        return stats;
    }

    @Override
    public boolean submitReview(Long userId, Long productId, Long orderId, Integer rating, String content, String images) {
        Review review = Review.builder()
                .userId(userId)
                .productId(productId)
                .orderId(orderId)
                .rating(rating)
                .content(content)
                .images(images)
                .build();
        return this.save(review);
    }
}
