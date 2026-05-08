package com.mall.inventory.entity;

import com.baomidou.mybatisplus.annotation.*;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 库存操作日志
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("mall_inventory_log")
@Schema(title = "库存操作日志")
public class InventoryLog implements Serializable {
    private static final long serialVersionUID = 1L;

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long productId;
    private Long orderId;
    private String operationType;
    private Integer quantityChange;
    private String reason;
    private Integer stockBefore;
    private Integer stockAfter;
    private Long operatorId;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime operateTime;
}
