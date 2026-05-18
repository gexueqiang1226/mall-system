package com.mall.review.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.mall.review.entity.Review;

import java.util.List;
import java.util.Map;

public interface ReviewService extends IService<Review> {
    List<Review> listReviews(Long productId, int page, int size);

    Map<String, Object> getStatistics(Long productId);

    boolean submitReview(Long userId, Long productId, Long orderId, Integer rating, String content, String images);
}
