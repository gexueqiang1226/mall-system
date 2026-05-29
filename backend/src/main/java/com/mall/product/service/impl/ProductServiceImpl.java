package com.mall.product.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.mall.product.entity.Product;
import com.mall.product.mapper.ProductMapper;
import com.mall.product.service.ProductService;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class ProductServiceImpl extends ServiceImpl<ProductMapper, Product> implements ProductService {

    @Override
    public Page<Product> listProducts(int page, int size, Map<String, Object> params) {
        Page<Product> pager = new Page<>(page, size);
        QueryWrapper<Product> wrapper = new QueryWrapper<>();

        if (params != null) {
            if (params.get("isOnline") != null) {
                wrapper.eq("is_online", params.get("isOnline"));
            }
            if (params.get("categoryId") != null) {
                wrapper.eq("category_id", params.get("categoryId"));
            }
            if (params.get("keyword") != null) {
                String kw = "%" + params.get("keyword") + "%";
                wrapper.and(w -> w.like("product_name", params.get("keyword")).or().like("product_code", params.get("keyword")));
            }
            String sortByRaw = (String) params.getOrDefault("sortBy", "createTime");
            // 驼峰转下划线: soldCount → sold_count, salePrice → sale_price
            String sortBy = sortByRaw.replaceAll("([a-z])([A-Z])", "$1_$2").toLowerCase();
            String order = (String) params.getOrDefault("order", "desc");
            if ("asc".equalsIgnoreCase(order)) {
                wrapper.orderByAsc(sortBy);
            } else {
                wrapper.orderByDesc(sortBy);
            }
        }

        return this.page(pager, wrapper);
    }
}
