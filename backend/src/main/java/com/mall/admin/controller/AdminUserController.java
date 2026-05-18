package com.mall.admin.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.mall.common.response.ResponseResult;
import com.mall.user.entity.User;
import com.mall.user.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin/api/users")
public class AdminUserController {

    @Autowired
    private UserService userService;

    /**
     * GET /admin/api/users?page=1&size=20&keyword=
     * Paginated user list with stats
     */
    @GetMapping
    public ResponseResult<Map<String, Object>> listUsers(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword) {
        
        IPage<User> userPage = userService.listUsers(keyword, page, size);
        
        // Transform each user to include stats
        List<Map<String, Object>> records = userPage.getRecords().stream().map(user -> {
            Map<String, Object> userMap = new HashMap<>();
            userMap.put("userId", user.getId());
            userMap.put("nickname", user.getUsername());
            userMap.put("phone", user.getPhone());
            userMap.put("email", user.getEmail());
            userMap.put("createTime", user.getCreateTime());
            
            // Get stats for this user
            Map<String, Object> stats = userService.getUserStats(user.getId());
            userMap.put("totalOrders", stats.get("totalOrders"));
            userMap.put("totalSpent", stats.get("totalSpent"));
            
            return userMap;
        }).collect(Collectors.toList());
        
        Map<String, Object> result = new HashMap<>();
        result.put("records", records);
        result.put("total", userPage.getTotal());
        result.put("page", userPage.getCurrent());
        result.put("size", userPage.getSize());
        
        return ResponseResult.success(result);
    }

    /**
     * GET /admin/api/users/{id}
     * Single user detail with stats
     */
    @GetMapping("/{id}")
    public ResponseResult<Map<String, Object>> getUserDetail(@PathVariable Long id) {
        Map<String, Object> detail = userService.getUserDetail(id);
        if (detail == null) {
            return ResponseResult.fail("User not found");
        }
        return ResponseResult.success(detail);
    }

    /**
     * PUT /admin/api/users/{id}
     * Update user nickname/email
     */
    @PutMapping("/{id}")
    public ResponseResult<Void> updateUser(
            @PathVariable Long id,
            @RequestParam(required = false) String nickname,
            @RequestParam(required = false) String email) {
        
        boolean success = userService.updateUser(id, nickname, email);
        if (!success) {
            return ResponseResult.fail("User not found or update failed");
        }
        return ResponseResult.success();
    }
}