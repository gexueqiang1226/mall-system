package com.mall.admin.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.mall.common.response.ResponseResult;
import com.mall.review.entity.Review;
import com.mall.review.service.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/admin/api/reviews")
public class AdminReviewController {

    @Autowired
    private ReviewService reviewService;

    /**
     * GET /admin/api/reviews?page=1&size=20&productId=&rating=
     * Paginated review list with filters
     */
    @GetMapping
    public ResponseResult<Map<String, Object>> listReviews(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) Integer rating) {

        LambdaQueryWrapper<Review> wrapper = new LambdaQueryWrapper<>();

        if (productId != null) {
            wrapper.eq(Review::getProductId, productId);
        }

        if (rating != null) {
            wrapper.eq(Review::getRating, rating);
        }

        wrapper.orderByDesc(Review::getCreateTime);

        IPage<Review> reviewPage = reviewService.page(new Page<>(page, size), wrapper);

        Map<String, Object> result = new HashMap<>();
        result.put("records", reviewPage.getRecords());
        result.put("total", reviewPage.getTotal());
        result.put("page", reviewPage.getCurrent());
        result.put("size", reviewPage.getSize());

        return ResponseResult.success(result);
    }

    /**
     * GET /admin/api/reviews/{id}
     * Single review detail
     */
    @GetMapping("/{id}")
    public ResponseResult<Review> getReviewDetail(@PathVariable Long id) {
        Review review = reviewService.getById(id);
        if (review == null) {
            return ResponseResult.fail("Review not found");
        }
        return ResponseResult.success(review);
    }

    /**
     * DELETE /admin/api/reviews/{id}
     * Soft delete review
     */
    @DeleteMapping("/{id}")
    public ResponseResult<Void> deleteReview(@PathVariable Long id) {
        Review review = reviewService.getById(id);
        if (review == null) {
            return ResponseResult.fail("Review not found");
        }

        boolean success = reviewService.removeById(id);

        if (!success) {
            return ResponseResult.fail("Failed to delete review");
        }

        return ResponseResult.success();
    }

    /**
     * GET /admin/api/reviews/statistics
     * Global review statistics across all products
     */
    @GetMapping("/statistics")
    public ResponseResult<Map<String, Object>> getGlobalStatistics() {
        Map<String, Object> stats = reviewService.getStatistics(null);
        return ResponseResult.success(stats);
    }
}
