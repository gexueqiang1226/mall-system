package com.mall.admin.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.mall.common.response.ResponseResult;
import com.mall.coupon.entity.Coupon;
import com.mall.coupon.service.CouponService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/admin/api/coupons")
public class AdminCouponController {

    @Autowired
    private CouponService couponService;

    /**
     * GET /admin/api/coupons?page=1&size=20&keyword=&status=
     * Paginated coupon list with filters
     */
    @GetMapping
    public ResponseResult<Map<String, Object>> listCoupons(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer status) {

        LambdaQueryWrapper<Coupon> wrapper = new LambdaQueryWrapper<>();

        if (keyword != null && !keyword.trim().isEmpty()) {
            wrapper.like(Coupon::getTitle, keyword);
        }

        if (status != null) {
            wrapper.eq(Coupon::getStatus, status);
        }

        wrapper.orderByDesc(Coupon::getCreateTime);

        IPage<Coupon> couponPage = couponService.page(new Page<>(page, size), wrapper);

        Map<String, Object> result = new HashMap<>();
        result.put("records", couponPage.getRecords());
        result.put("total", couponPage.getTotal());
        result.put("page", couponPage.getCurrent());
        result.put("size", couponPage.getSize());

        return ResponseResult.success(result);
    }

    /**
     * GET /admin/api/coupons/{id}
     * Single coupon detail
     */
    @GetMapping("/{id}")
    public ResponseResult<Coupon> getCouponDetail(@PathVariable Long id) {
        Coupon coupon = couponService.getById(id);
        if (coupon == null) {
            return ResponseResult.fail("Coupon not found");
        }
        return ResponseResult.success(coupon);
    }

    /**
     * POST /admin/api/coupons
     * Create new coupon
     */
    @PostMapping
    public ResponseResult<Coupon> createCoupon(@RequestBody Coupon coupon) {
        if (coupon.getTitle() == null || coupon.getType() == null) {
            return ResponseResult.fail("Title and type are required");
        }

        if (coupon.getStatus() == null) {
            coupon.setStatus(0);
        }

        boolean success = couponService.save(coupon);
        if (!success) {
            return ResponseResult.fail("Failed to create coupon");
        }

        return ResponseResult.success(coupon);
    }

    /**
     * PUT /admin/api/coupons/{id}
     * Update coupon
     */
    @PutMapping("/{id}")
    public ResponseResult<Void> updateCoupon(
            @PathVariable Long id,
            @RequestBody Coupon coupon) {

        Coupon existing = couponService.getById(id);
        if (existing == null) {
            return ResponseResult.fail("Coupon not found");
        }

        coupon.setId(id);
        boolean success = couponService.updateById(coupon);

        if (!success) {
            return ResponseResult.fail("Failed to update coupon");
        }

        return ResponseResult.success();
    }

    /**
     * DELETE /admin/api/coupons/{id}
     * Soft delete coupon (set status to 3)
     */
    @DeleteMapping("/{id}")
    public ResponseResult<Void> deleteCoupon(@PathVariable Long id) {
        Coupon coupon = couponService.getById(id);
        if (coupon == null) {
            return ResponseResult.fail("Coupon not found");
        }

        coupon.setStatus(3);
        boolean success = couponService.updateById(coupon);

        if (!success) {
            return ResponseResult.fail("Failed to delete coupon");
        }

        return ResponseResult.success();
    }

    /**
     * POST /admin/api/coupons/{id}/disable
     * Disable coupon (set status to 2)
     */
    @PostMapping("/{id}/disable")
    public ResponseResult<Void> disableCoupon(@PathVariable Long id) {
        Coupon coupon = couponService.getById(id);
        if (coupon == null) {
            return ResponseResult.fail("Coupon not found");
        }

        coupon.setStatus(2);
        boolean success = couponService.updateById(coupon);

        if (!success) {
            return ResponseResult.fail("Failed to disable coupon");
        }

        return ResponseResult.success();
    }

    /**
     * POST /admin/api/coupons/{id}/enable
     * Enable coupon (set status to 0)
     */
    @PostMapping("/{id}/enable")
    public ResponseResult<Void> enableCoupon(@PathVariable Long id) {
        Coupon coupon = couponService.getById(id);
        if (coupon == null) {
            return ResponseResult.fail("Coupon not found");
        }

        coupon.setStatus(0);
        boolean success = couponService.updateById(coupon);

        if (!success) {
            return ResponseResult.fail("Failed to enable coupon");
        }

        return ResponseResult.success();
    }
}
