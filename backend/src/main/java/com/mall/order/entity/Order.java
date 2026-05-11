package com.mall.order.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("mall_order")
public class Order {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String orderNo;
    private Long userId;
    private BigDecimal totalAmount;
    private BigDecimal payAmount;
    private BigDecimal shippingAmount;
    private BigDecimal discountAmount;
    private Integer status; // 0=待支付 1=已支付 2=已发货 3=已收货 4=已取消 5=已退货
    private String paymentMethod;
    private LocalDateTime paymentTime;
    private LocalDateTime shippingTime;
    private LocalDateTime receiveTime;
    private String remark;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;

    /** Not mapped to DB - transient field for order items JSON storage during creation */
    @TableField(exist = false)
    private String itemsJson;

    /** Not mapped - convenience field for loading items */
    @TableField(exist = false)
    private java.util.List<OrderItem> orderItems;
}
