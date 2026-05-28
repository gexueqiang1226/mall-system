package com.mall.category.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.mall.category.entity.Category;
import com.mall.category.mapper.CategoryMapper;
import com.mall.category.service.CategoryService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CategoryServiceImpl extends ServiceImpl<CategoryMapper, Category> implements CategoryService {

    @Override
    public List<Category> listByParentId(Long parentId) {
        return this.list(new QueryWrapper<Category>()
                .eq(parentId != null, "parent_id", parentId)
                .eq("status", 1)
                .orderByAsc("sort_order"));
    }

    @Override
    public List<Category> listAll() {
        return this.list(new QueryWrapper<Category>()
                .eq("status", 1)
                .orderByAsc("sort_order"));
    }
}
