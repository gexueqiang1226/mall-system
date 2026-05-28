package com.mall.category.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.mall.category.entity.Category;
import com.mall.category.service.CategoryService;
import com.mall.common.response.ResponseResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
public class CategoryController {

    @Autowired
    private CategoryService categoryService;

    // Public - 获取所有分类
    @GetMapping("/api/categories")
    public ResponseResult listCategories() {
        List<Category> categories = categoryService.listAll();
        return ResponseResult.success(categories);
    }

    // Public - 获取子分类
    @GetMapping("/api/categories/{parentId}/children")
    public ResponseResult listByParent(@PathVariable Long parentId) {
        List<Category> categories = categoryService.listByParentId(parentId);
        return ResponseResult.success(categories);
    }

    // Admin - 分页查询分类
    @GetMapping("/admin/api/categories")
    public ResponseResult listCategoriesAdmin(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<Category> pager = categoryService.page(
                new Page<>(page, size),
                new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<Category>()
                        .orderByAsc("sort_order"));
        return ResponseResult.success(pager);
    }

    // Admin - 新增分类
    @PostMapping("/admin/api/categories")
    public ResponseResult createCategory(@RequestBody Category category) {
        category.setCreateTime(LocalDateTime.now());
        category.setStatus(1);
        categoryService.save(category);
        return ResponseResult.success(category);
    }

    // Admin - 编辑分类
    @PutMapping("/admin/api/categories/{id}")
    public ResponseResult updateCategory(@PathVariable Long id, @RequestBody Category category) {
        Category exist = categoryService.getById(id);
        if (exist == null) return ResponseResult.fail(404, "分类不存在");
        category.setId(id);
        categoryService.updateById(category);
        return ResponseResult.success(categoryService.getById(id));
    }

    // Admin - 删除分类
    @DeleteMapping("/admin/api/categories/{id}")
    public ResponseResult deleteCategory(@PathVariable Long id) {
        Category exist = categoryService.getById(id);
        if (exist == null) return ResponseResult.fail(404, "分类不存在");
        categoryService.removeById(id);
        return ResponseResult.success("删除成功");
    }
}
