package com.mall.cart.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.mall.cart.entity.Cart;
import com.mall.cart.service.CartService;
import com.mall.common.response.ResponseResult;
import com.mall.product.entity.Product;
import com.mall.product.entity.ProductSku;
import com.mall.product.service.ProductService;
import com.mall.product.service.ProductSkuService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping
public class CartController {

    @Autowired
    private CartService cartService;
    @Autowired
    private ProductService productService;
    @Autowired
    private ProductSkuService productSkuService;

    @GetMapping("/api/cart")
    public ResponseResult listCart(@RequestParam Long userId) {
        List<Cart> carts = cartService.list(new LambdaQueryWrapper<Cart>()
                .eq(Cart::getUserId, userId)
                .orderByDesc(Cart::getCreateTime));
        
        // Enrich with product info
        List<Map<String, Object>> result = new ArrayList<>();
        for (Cart c : carts) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", c.getId());
            item.put("userId", c.getUserId());
            item.put("productId", c.getProductId());
            item.put("quantity", c.getQuantity());
            item.put("skuId", c.getSkuId());
            item.put("checked", c.getChecked());
            
            Product p = productService.getById(c.getProductId());
            if (p != null) {
                item.put("productName", p.getProductName());
                item.put("mainImage", p.getMainImage());
                item.put("salePrice", p.getSalePrice());
                item.put("sellableStock", p.getSellableStock());
            }
            
            if (c.getSkuId() != null) {
                ProductSku sku = productSkuService.getById(c.getSkuId());
                if (sku != null) {
                    item.put("skuPrice", sku.getPrice());
                    item.put("skuSpecs", sku.getSpecs());
                    item.put("skuStock", sku.getStock());
                    item.put("skuImage", sku.getImage());
                }
            }
            result.add(item);
        }
        return ResponseResult.success(result);
    }

    @PostMapping("/api/cart")
    public ResponseResult addToCart(@RequestBody Map<String, Object> body) {
        Long userId = ((Number) body.get("userId")).longValue();
        Long productId = ((Number) body.get("productId")).longValue();
        Integer quantity = body.get("quantity") != null ? ((Number) body.get("quantity")).intValue() : 1;
        Long skuId = body.get("skuId") != null ? ((Number) body.get("skuId")).longValue() : null;

        // Check existing
        LambdaQueryWrapper<Cart> wrapper = new LambdaQueryWrapper<Cart>()
                .eq(Cart::getUserId, userId)
                .eq(Cart::getProductId, productId);
        if (skuId != null) {
            wrapper.eq(Cart::getSkuId, skuId);
        } else {
            wrapper.isNull(Cart::getSkuId);
        }
        
        Cart existing = cartService.getOne(wrapper);
        if (existing != null) {
            existing.setQuantity(existing.getQuantity() + quantity);
            cartService.updateById(existing);
            return ResponseResult.success(existing);
        }
        
        Cart cart = Cart.builder()
                .userId(userId)
                .productId(productId)
                .quantity(quantity)
                .skuId(skuId)
                .checked(1)
                .build();
        cartService.save(cart);
        return ResponseResult.success(cart);
    }

    @PutMapping("/api/cart/{id}")
    public ResponseResult updateCart(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Cart cart = cartService.getById(id);
        if (cart == null) return ResponseResult.fail(404, "购物车项不存在");
        
        if (body.containsKey("quantity")) {
            cart.setQuantity(((Number) body.get("quantity")).intValue());
        }
        if (body.containsKey("checked")) {
            cart.setChecked(((Number) body.get("checked")).intValue());
        }
        cartService.updateById(cart);
        return ResponseResult.success(cart);
    }

    @DeleteMapping("/api/cart/{id}")
    public ResponseResult removeFromCart(@PathVariable Long id) {
        boolean ok = cartService.removeById(id);
        return ok ? ResponseResult.success("删除成功") : ResponseResult.fail(404, "购物车项不存在");
    }

    @DeleteMapping("/api/cart/clear")
    public ResponseResult clearCart(@RequestParam Long userId) {
        cartService.remove(new LambdaQueryWrapper<Cart>().eq(Cart::getUserId, userId));
        return ResponseResult.success("清空成功");
    }

    @PutMapping("/api/cart/checkAll")
    public ResponseResult checkAll(@RequestParam Long userId, @RequestParam Integer checked) {
        Cart update = new Cart();
        update.setChecked(checked);
        cartService.update(update, new LambdaQueryWrapper<Cart>().eq(Cart::getUserId, userId));
        return ResponseResult.success("操作成功");
    }
}
