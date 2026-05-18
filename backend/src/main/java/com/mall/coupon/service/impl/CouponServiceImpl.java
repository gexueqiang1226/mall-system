package com.mall.coupon.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.mall.coupon.entity.Coupon;
import com.mall.coupon.mapper.CouponMapper;
import com.mall.coupon.service.CouponService;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class CouponServiceImpl extends ServiceImpl<CouponMapper, Coupon> implements CouponService {

    @Override
    public List<Coupon> listByUserIdAndStatus(Long userId, Integer status) {
        QueryWrapper<Coupon> wrapper = new QueryWrapper<Coupon>()
                .eq("user_id", userId)
                .eq(status != null, "status", status)
                .orderByDesc("create_time");
        return this.list(wrapper);
    }

    @Override
    public List<Coupon> listAvailable(Long userId, BigDecimal amount) {
        QueryWrapper<Coupon> wrapper = new QueryWrapper<Coupon>()
                .eq("user_id", userId)
                .eq("status", 0)
                .le("start_time", LocalDateTime.now())
                .ge("end_time", LocalDateTime.now())
                .le("min_amount", amount)
                .orderByDesc("discount_value");
        return this.list(wrapper);
    }

    @Override
    public Coupon useCoupon(Long id) {
        Coupon coupon = this.getById(id);
        if (coupon == null) {
            throw new RuntimeException("NOT_FOUND");
        }
        if (coupon.getStatus() != 0) {
            throw new RuntimeException("INVALID_STATUS");
        }
        coupon.setStatus(1);
        this.updateById(coupon);
        return coupon;
    }
}
