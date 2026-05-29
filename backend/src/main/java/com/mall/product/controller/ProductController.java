package com.mall.product.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.mall.common.response.ResponseResult;
import com.mall.product.entity.Product;
import com.mall.product.service.ProductService;
import com.mall.inventory.service.InventoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping
public class ProductController {

    @Autowired
    private ProductService productService;

    @Autowired
    private InventoryService inventoryService;

    // Admin - 商品列表
    @GetMapping("/admin/api/products")
    public ResponseResult adminListProducts(@RequestParam(defaultValue = "1") int page,
                                             @RequestParam(defaultValue = "20") int size,
                                             @RequestParam(required = false) Integer isOnline,
                                             @RequestParam(required = false) Long categoryId,
                                             @RequestParam(required = false) String keyword,
                                             @RequestParam(required = false) String sortBy,
                                             @RequestParam(required = false) String order) {
        Map<String, Object> params = new HashMap<>();
        params.put("isOnline", isOnline);
        params.put("categoryId", categoryId);
        params.put("keyword", keyword);
        if (sortBy != null) params.put("sortBy", sortBy);
        if (order != null) params.put("order", order);

        Page<Product> pager = productService.listProducts(page, size, params);
        Map<String, Object> data = new HashMap<>();
        data.put("items", pager.getRecords());
        data.put("total", pager.getTotal());
        data.put("page", page);
        data.put("size", size);
        return ResponseResult.success(data);
    }

    // Admin - 商品详情
    @GetMapping("/admin/api/products/{id}")
    public ResponseResult adminGetProduct(@PathVariable Long id) {
        Product p = productService.getById(id);
        if (p == null) return ResponseResult.fail(404, "商品不存在");
        return ResponseResult.success(p);
    }

    // Public API - 商品列表
    @GetMapping("/api/products")
    public ResponseResult listProducts(@RequestParam(defaultValue = "1") int page,
                                       @RequestParam(defaultValue = "20") int size,
                                       @RequestParam(required = false) Integer isOnline,
                                       @RequestParam(required = false) Long categoryId,
                                       @RequestParam(required = false) String keyword,
                                       @RequestParam(required = false) String sortBy,
                                       @RequestParam(required = false) String order) {
        Map<String, Object> params = new HashMap<>();
        params.put("isOnline", isOnline);
        params.put("categoryId", categoryId);
        params.put("keyword", keyword);
        if (sortBy != null) params.put("sortBy", sortBy);
        if (order != null) params.put("order", order);

        Page<Product> pager = productService.listProducts(page, size, params);
        Map<String, Object> data = new HashMap<>();
        data.put("items", pager.getRecords());
        data.put("total", pager.getTotal());
        data.put("page", page);
        data.put("size", size);
        return ResponseResult.success(data);
    }

    // Public API - 商品详情
    @GetMapping("/api/products/{id}")
    public ResponseResult getProduct(@PathVariable Long id) {
        Product p = productService.getById(id);
        if (p == null) return ResponseResult.fail(404, "商品不存在");
        return ResponseResult.success(p);
    }

    // Admin - 新增商品
    @PostMapping("/admin/api/products")
    public ResponseResult createProduct(@RequestBody Product product) {
        product.setCreateTime(LocalDateTime.now());
        product.setUpdateTime(LocalDateTime.now());
        productService.save(product);
        return ResponseResult.success(product);
    }

    // Admin - 编辑商品
    @PutMapping("/admin/api/products/{id}")
    public ResponseResult updateProduct(@PathVariable Long id, @RequestBody Product product) {
        Product exist = productService.getById(id);
        if (exist == null) return ResponseResult.fail(404, "商品不存在");
        product.setId(id);
        product.setUpdateTime(LocalDateTime.now());
        productService.updateById(product);
        return ResponseResult.success(productService.getById(id));
    }

    // Admin - 上架
    @PostMapping("/admin/api/products/{id}/online")
    public ResponseResult online(@PathVariable Long id) {
        Product p = productService.getById(id);
        if (p == null) return ResponseResult.fail(404, "商品不存在");
        p.setIsOnline(1);
        p.setOnlineTime(LocalDateTime.now());
        p.setStatus(2);
        productService.updateById(p);
        return ResponseResult.success("商品上架成功");
    }

    // Admin - 下架
    @PostMapping("/admin/api/products/{id}/offline")
    public ResponseResult offline(@PathVariable Long id) {
        Product p = productService.getById(id);
        if (p == null) return ResponseResult.fail(404, "商品不存在");
        p.setIsOnline(0);
        p.setOfflineTime(LocalDateTime.now());
        p.setStatus(3);
        productService.updateById(p);
        return ResponseResult.success("商品下架成功");
    }

    // Admin - 删除商品
    @DeleteMapping("/admin/api/products/{id}")
    public ResponseResult deleteProduct(@PathVariable Long id) {
        Product p = productService.getById(id);
        if (p == null) return ResponseResult.fail(404, "商品不存在");
        // 软删除：设为下架+标记deleted
        p.setIsOnline(0);
        p.setOfflineTime(LocalDateTime.now());
        p.setStatus(4); // 4=已删除
        productService.updateById(p);
        return ResponseResult.success("商品删除成功");
    }

    // Admin - 更新库存
    @PutMapping("/admin/api/products/{id}/inventory")
    public ResponseResult updateInventory(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Product p = productService.getById(id);
        if (p == null) return ResponseResult.fail(404, "商品不存在");

        Integer sellableStock = body.get("sellableStock") == null ? null : Integer.parseInt(body.get("sellableStock").toString());
        Integer lowStockWarning = body.get("lowStockWarning") == null ? null : Integer.parseInt(body.get("lowStockWarning").toString());
        String reason = (String) body.getOrDefault("reason", "管理员调整库存");
        Long operatorId = body.get("operatorId") == null ? null : Long.parseLong(body.get("operatorId").toString());

        int before = p.getSellableStock() == null ? 0 : p.getSellableStock();
        int after = before;
        int change = 0;
        if (sellableStock != null) {
            change = sellableStock - before;
            p.setSellableStock(sellableStock);
            after = sellableStock;
        }
        if (lowStockWarning != null) p.setLowStockWarning(lowStockWarning);

        productService.updateById(p);

        // 记录日志
        inventoryService.record(id, null, change >= 0 ? "increase" : "decrease", Math.abs(change), reason, before, after, operatorId);

        return ResponseResult.success("库存配置成功");
    }
}
