package com.mall.common.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * 统一响应结果
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(title = "响应结果")
public class ResponseResult<T> implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(title = "响应码", example = "0")
    private Integer code;

    @Schema(title = "响应信息", example = "success")
    private String message;

    @Schema(title = "响应数据")
    private T data;

    /**
     * 成功响应
     */
    public static <T> ResponseResult<T> success() {
        return ResponseResult.<T>builder()
                .code(0)
                .message("success")
                .build();
    }

    public static <T> ResponseResult<T> success(T data) {
        return ResponseResult.<T>builder()
                .code(0)
                .message("success")
                .data(data)
                .build();
    }

    public static <T> ResponseResult<T> success(String message, T data) {
        return ResponseResult.<T>builder()
                .code(0)
                .message(message)
                .data(data)
                .build();
    }

    /**
     * 失败响应
     */
    public static <T> ResponseResult<T> fail(Integer code, String message) {
        return ResponseResult.<T>builder()
                .code(code)
                .message(message)
                .build();
    }

    public static <T> ResponseResult<T> fail(String message) {
        return ResponseResult.<T>builder()
                .code(-1)
                .message(message)
                .build();
    }
}
