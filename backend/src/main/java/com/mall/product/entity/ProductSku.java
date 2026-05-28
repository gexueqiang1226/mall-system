package com.mall.product.entity;

import com.baomidou.mybatisplus.annotation.*;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("mall_product_sku")
@Schema(title = "商品SKU")
public class ProductSku implements Serializable {
    private static final long serialVersionUID = 1L;

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long productId;
    private String skuCode;
    private String specs;
    private BigDecimal price;
    private Integer stock;
    private String image;
    private Integer status;
    private LocalDateTime createTime;
}
