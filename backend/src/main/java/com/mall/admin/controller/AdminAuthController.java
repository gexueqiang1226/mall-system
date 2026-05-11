package com.mall.admin.controller;

import com.mall.admin.entity.Admin;
import com.mall.admin.service.AdminService;
import com.mall.common.response.ResponseResult;
import com.mall.common.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/admin/api/auth")
public class AdminAuthController {

    @Autowired
    private AdminService adminService;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseResult login(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");

        if (username == null || password == null) {
            return ResponseResult.fail(400, "用户名和密码不能为空");
        }

        Admin admin = adminService.findByUsername(username);
        if (admin == null) {
            return ResponseResult.fail(401, "用户名或密码错误");
        }

        if (admin.getStatus() != null && admin.getStatus() == 0) {
            return ResponseResult.fail(403, "账号已被禁用");
        }

        if (!passwordEncoder.matches(password, admin.getPassword())) {
            return ResponseResult.fail(401, "用户名或密码错误");
        }

        admin.setLastLoginTime(LocalDateTime.now());
        adminService.updateById(admin);

        String token = jwtTokenProvider.generateToken(admin.getId(), admin.getUsername(), admin.getRole());

        Map<String, Object> data = new HashMap<>();
        data.put("token", token);
        data.put("userId", admin.getId());
        data.put("username", admin.getUsername());
        data.put("realName", admin.getRealName());
        data.put("role", admin.getRole());

        return ResponseResult.success(data);
    }

    @GetMapping("/info")
    public ResponseResult getAdminInfo(@RequestAttribute("userId") Long userId) {
        Admin admin = adminService.getById(userId);
        if (admin == null) {
            return ResponseResult.fail(404, "管理员不存在");
        }

        Map<String, Object> data = new HashMap<>();
        data.put("userId", admin.getId());
        data.put("username", admin.getUsername());
        data.put("realName", admin.getRealName());
        data.put("role", admin.getRole());

        return ResponseResult.success(data);
    }
}
