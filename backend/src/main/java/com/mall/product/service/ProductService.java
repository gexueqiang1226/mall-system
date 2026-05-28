package com.mall.product.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.mall.product.entity.Product;

import java.util.Map;

public interface ProductService extends IService<Product> {
    Page<Product> listProducts(int page, int size, Map<String, Object> params);
}
