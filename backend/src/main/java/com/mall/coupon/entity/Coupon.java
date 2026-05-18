package com.mall.coupon.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("mall_coupon")
public class Coupon {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;
    private String title;
    private Integer type; // 1=满减 2=折扣 3=无门槛
    private BigDecimal discountValue;
    private BigDecimal minAmount;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer status; // 0=未使用 1=已使用 2=已过期

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;
}
