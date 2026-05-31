package com.mall.favorite.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("mall_favorite")
public class Favorite {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;
    private Long productId;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    private Integer deleted;
}
