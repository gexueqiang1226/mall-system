package com.mall.coupon.controller;

import com.mall.coupon.entity.Coupon;
import com.mall.coupon.service.CouponService;
import com.mall.common.response.ResponseResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping
public class CouponController {

    @Autowired
    private CouponService couponService;

    @GetMapping("/api/coupons")
    public ResponseResult listCoupons(
            @RequestParam Long userId,
            @RequestParam(required = false) Integer status) {
        List<Coupon> list = couponService.listByUserIdAndStatus(userId, status);
        return ResponseResult.success(list);
    }

    @GetMapping("/api/coupons/available")
    public ResponseResult listAvailable(
            @RequestParam Long userId,
            @RequestParam BigDecimal amount) {
        List<Coupon> list = couponService.listAvailable(userId, amount);
        return ResponseResult.success(list);
    }

    /** 领取优惠券 */
    @PostMapping("/api/coupons/claim/{id}")
    public ResponseResult claimCoupon(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> body) {
        try {
            Long userId = body != null && body.get("userId") != null
                    ? Long.valueOf(body.get("userId").toString()) : null;
            Coupon coupon = couponService.claimCoupon(id, userId);
            return ResponseResult.success(coupon);
        } catch (RuntimeException e) {
            if ("NOT_FOUND".equals(e.getMessage())) {
                return ResponseResult.fail(404, "优惠券不存在");
            }
            if ("ALREADY_CLAIMED".equals(e.getMessage())) {
                return ResponseResult.fail(400, "已领取过该优惠券");
            }
            return ResponseResult.fail(400, e.getMessage());
        }
    }

    @PostMapping("/api/coupons")
    public ResponseResult createCoupon(@RequestBody Coupon coupon) {
        if (coupon.getUserId() == null || coupon.getTitle() == null || coupon.getType() == null) {
            return ResponseResult.fail(400, "用户ID、优惠券名称、类型不能为空");
        }
        couponService.save(coupon);
        return ResponseResult.success(coupon);
    }

    @PostMapping("/api/coupons/{id}/use")
    public ResponseResult useCoupon(@PathVariable Long id) {
        try {
            Coupon coupon = couponService.useCoupon(id);
            return ResponseResult.success(coupon);
        } catch (RuntimeException e) {
            if ("NOT_FOUND".equals(e.getMessage())) {
                return ResponseResult.fail(404, "优惠券不存在");
            }
            return ResponseResult.fail(400, "优惠券已使用或已过期");
        }
    }
}
