package com.mall.address.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("mall_address")
public class Address {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;
    private String receiver;
    private String phone;
    private String province;
    private String city;
    private String district;
    private String detail;
    private Integer isDefault; // 0=非默认 1=默认

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;
}
