package com.mall.category.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.mall.category.entity.Category;

import java.util.List;

public interface CategoryService extends IService<Category> {
    List<Category> listByParentId(Long parentId);
    List<Category> listAll();
}
