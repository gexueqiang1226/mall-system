package com.mall.product.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.mall.common.response.ResponseResult;
import com.mall.product.entity.ProductSku;
import com.mall.product.service.ProductSkuService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping
public class ProductSkuController {

    @Autowired
    private ProductSkuService productSkuService;

    @GetMapping("/api/products/{productId}/skus")
    public ResponseResult listSkus(@PathVariable Long productId) {
        List<ProductSku> skus = productSkuService.list(
                new LambdaQueryWrapper<ProductSku>()
                        .eq(ProductSku::getProductId, productId)
                        .eq(ProductSku::getStatus, 1));
        return ResponseResult.success(skus);
    }

    @GetMapping("/api/skus/{id}")
    public ResponseResult getSku(@PathVariable Long id) {
        ProductSku sku = productSkuService.getById(id);
        if (sku == null) return ResponseResult.fail(404, "SKU不存在");
        return ResponseResult.success(sku);
    }
}
