package com.mall.review.controller;

import com.mall.review.entity.Review;
import com.mall.review.service.ReviewService;
import com.mall.common.response.ResponseResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping
public class ReviewController {

    @Autowired
    private ReviewService reviewService;

    @GetMapping("/api/reviews")
    public ResponseResult listReviews(@RequestParam(required = false) Long productId,
                                       @RequestParam(defaultValue = "1") int page,
                                       @RequestParam(defaultValue = "10") int size) {
        List<Review> list = reviewService.listReviews(productId, page, size);
        return ResponseResult.success(list);
    }

    @GetMapping("/api/reviews/{id}")
    public ResponseResult getReview(@PathVariable Long id) {
        Review review = reviewService.getById(id);
        if (review == null) {
            return ResponseResult.fail(404, "评价不存在");
        }
        return ResponseResult.success(review);
    }

    @PostMapping("/api/reviews")
    public ResponseResult submitReview(@RequestBody Map<String, Object> body) {
        Long userId = body.get("userId") == null ? null : ((Number) body.get("userId")).longValue();
        Long productId = body.get("productId") == null ? null : ((Number) body.get("productId")).longValue();
        Long orderId = body.get("orderId") == null ? null : ((Number) body.get("orderId")).longValue();
        Integer rating = body.get("rating") == null ? null : ((Number) body.get("rating")).intValue();
        String content = (String) body.get("content");
        String images = (String) body.get("images");

        if (userId == null || productId == null || rating == null) {
            return ResponseResult.fail(400, "用户ID、商品ID和评分不能为空");
        }
        if (rating < 1 || rating > 5) {
            return ResponseResult.fail(400, "评分必须在1-5之间");
        }

        boolean ok = reviewService.submitReview(userId, productId, orderId, rating, content, images);
        if (!ok) {
            return ResponseResult.fail(500, "提交评价失败");
        }
        return ResponseResult.success("评价提交成功");
    }

    @GetMapping("/api/reviews/statistics")
    public ResponseResult getStatistics(@RequestParam Long productId) {
        Map<String, Object> stats = reviewService.getStatistics(productId);
        return ResponseResult.success(stats);
    }
}
