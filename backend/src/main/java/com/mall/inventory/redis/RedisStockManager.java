package com.mall.inventory.redis;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Component;
import org.springframework.util.StreamUtils;

import java.nio.charset.StandardCharsets;
import java.util.List;

@Component
public class RedisStockManager {

    @Autowired
    private StringRedisTemplate redisTemplate;

    private DefaultRedisScript<Long> lockScript;
    private DefaultRedisScript<Long> unlockScript;
    private DefaultRedisScript<Long> confirmScript;

    public RedisStockManager() {
    }

    @Autowired
    public void init() throws Exception {
        lockScript = new DefaultRedisScript<>();
        unlockScript = new DefaultRedisScript<>();
        confirmScript = new DefaultRedisScript<>();

        ClassPathResource r1 = new ClassPathResource("redis/lock_stock.lua");
        ClassPathResource r2 = new ClassPathResource("redis/unlock_stock.lua");
        ClassPathResource r3 = new ClassPathResource("redis/confirm_stock.lua");

        String lockLua = StreamUtils.copyToString(r1.getInputStream(), StandardCharsets.UTF_8);
        String unlockLua = StreamUtils.copyToString(r2.getInputStream(), StandardCharsets.UTF_8);
        String confirmLua = StreamUtils.copyToString(r3.getInputStream(), StandardCharsets.UTF_8);

        lockScript.setScriptText(lockLua);
        lockScript.setResultType(Long.class);

        unlockScript.setScriptText(unlockLua);
        unlockScript.setResultType(Long.class);

        confirmScript.setScriptText(confirmLua);
        confirmScript.setResultType(Long.class);
    }

    private String stockKey(Long productId) {
        return "stock:" + productId;
    }

    private String lockKey(Long productId) {
        return "stock:locked:" + productId;
    }

    public boolean lockStock(Long productId, int qty) {
        Long res = redisTemplate.execute(lockScript, List.of(stockKey(productId), lockKey(productId)), String.valueOf(qty));
        return res != null && res == 1L;
    }

    public boolean unlockStock(Long productId, int qty) {
        Long res = redisTemplate.execute(unlockScript, List.of(stockKey(productId), lockKey(productId)), String.valueOf(qty));
        return res != null && res == 1L;
    }

    public boolean confirmStock(Long productId, int qty) {
        Long res = redisTemplate.execute(confirmScript, List.of(lockKey(productId)), String.valueOf(qty));
        return res != null && res == 1L;
    }

    /**
     * Try lock multiple products. If any fail, roll back previously locked ones.
     */
    public boolean lockMultiple(List<Long> productIds, List<Integer> qtys) {
        if (productIds.size() != qtys.size()) return false;
        int n = productIds.size();
        int i = 0;
        try {
            for (; i < n; i++) {
                boolean ok = lockStock(productIds.get(i), qtys.get(i));
                if (!ok) {
                    // rollback
                    for (int j = 0; j < i; j++) {
                        unlockStock(productIds.get(j), qtys.get(j));
                    }
                    return false;
                }
            }
            return true;
        } catch (Exception ex) {
            // rollback on exception
            for (int j = 0; j < i; j++) {
                try { unlockStock(productIds.get(j), qtys.get(j)); } catch (Exception e) {}
            }
            return false;
        }
    }
}
