package com.mall.points.controller;

import com.mall.points.entity.Points;
import com.mall.points.service.PointsService;
import com.mall.common.response.ResponseResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping
public class PointsController {

    @Autowired
    private PointsService pointsService;

    @GetMapping("/api/points/balance")
    public ResponseResult getBalance(@RequestParam Long userId) {
        Integer balance = pointsService.getBalance(userId);
        Map<String, Object> data = new HashMap<>();
        data.put("userId", userId);
        data.put("balance", balance);
        return ResponseResult.success(data);
    }

    @GetMapping("/api/points/history")
    public ResponseResult getHistory(@RequestParam Long userId,
                                      @RequestParam(defaultValue = "1") int page,
                                      @RequestParam(defaultValue = "10") int size) {
        List<Points> list = pointsService.getHistory(userId, page, size);
        return ResponseResult.success(list);
    }

    @PostMapping("/api/points/exchange")
    public ResponseResult exchange(@RequestBody Map<String, Object> body) {
        Long userId = body.get("userId") == null ? null : ((Number) body.get("userId")).longValue();
        Long productId = body.get("productId") == null ? null : ((Number) body.get("productId")).longValue();
        Integer points = body.get("points") == null ? null : ((Number) body.get("points")).intValue();
        String description = (String) body.get("description");

        if (userId == null || points == null) {
            return ResponseResult.fail(400, "用户ID和积分不能为空");
        }
        if (points >= 0) {
            return ResponseResult.fail(400, "兑换积分必须为负值（消耗积分）");
        }

        boolean ok = pointsService.exchange(userId, productId, points, description);
        if (!ok) {
            return ResponseResult.fail(400, "积分余额不足");
        }
        return ResponseResult.success("兑换成功");
    }
}
