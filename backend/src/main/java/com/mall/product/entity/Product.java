package com.mall.product.entity;

import com.baomidou.mybatisplus.annotation.*;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 商品实体
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("mall_product")
@Schema(title = "商品信息")
public class Product implements Serializable {
    private static final long serialVersionUID = 1L;

    @TableId(type = IdType.AUTO)
    private Long id;

    private String productName;
    private String productCode;
    private Long categoryId;
    private String description;
    private String mainImage;
    private String detailImages;
    private String videoUrl;

    private BigDecimal salePrice;
    private BigDecimal marketPrice;
    private BigDecimal costPrice;

    private Integer totalStock;
    private Integer sellableStock;
    private Integer lockedStock;
    private Integer soldCount;
    private Integer lowStockWarning;

    private Integer isOnline;
    private LocalDateTime onlineTime;
    private LocalDateTime offlineTime;

    private Integer isRecommend;
    private Integer recommendWeight;

    private Integer isNew;
    private Integer isSeckill;

    private Integer status;
    private String auditRemark;

    private Integer canReturn;
    private Integer returnDays;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    private String creator;
    private String updater;

    @TableLogic
    private Integer deleted;
}
