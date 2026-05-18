package com.mall.coupon.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.mall.coupon.entity.Coupon;

import java.math.BigDecimal;
import java.util.List;

public interface CouponService extends IService<Coupon> {
    List<Coupon> listByUserIdAndStatus(Long userId, Integer status);
    List<Coupon> listAvailable(Long userId, BigDecimal amount);
    Coupon useCoupon(Long id);
}
