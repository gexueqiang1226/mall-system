package com.mall.inventory.redis;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.mall.product.entity.Product;
import com.mall.product.service.ProductService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
public class StockInitRunner implements CommandLineRunner {

    @Autowired
    private ProductService productService;

    @Autowired
    private StringRedisTemplate redisTemplate;

    @Override
    public void run(String... args) {
        List<Product> products = productService.list(new QueryWrapper<Product>()
                .select("id", "sellable_stock"));
        int count = 0;
        for (Product p : products) {
            String key = "stock:" + p.getId();
            int stock = p.getSellableStock() != null ? p.getSellableStock() : 0;
            if (!Boolean.TRUE.equals(redisTemplate.hasKey(key))) {
                redisTemplate.opsForValue().set(key, String.valueOf(stock));
                count++;
            }
        }
        if (count > 0) {
            log.info("已同步 {} 个商品的库存到 Redis", count);
        } else {
            log.info("所有商品库存已在 Redis 中，无需同步");
        }
    }
}
