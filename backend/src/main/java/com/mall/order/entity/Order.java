package com.mall.order.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.*;

import java.time.LocalDateTime;

@TableName("mall_order")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Order {
    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;
    private String itemsJson; // JSON array of {productId, quantity}
    private Integer status; // 0=created,1=paid,2=canceled
    private Integer totalAmount;
    private LocalDateTime createTime;
}
