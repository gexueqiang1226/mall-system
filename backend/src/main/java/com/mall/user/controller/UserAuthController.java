package com.mall.user.controller;

import com.mall.common.response.ResponseResult;
import com.mall.user.entity.User;
import com.mall.user.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class UserAuthController {

    @Autowired
    private UserService userService;

    @PostMapping("/register")
    public ResponseResult register(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");
        String phone = body.get("phone");

        if (username == null || password == null) {
            return ResponseResult.fail(400, "用户名和密码不能为空");
        }

        User user = userService.register(username, password, phone);
        if (user == null) {
            return ResponseResult.fail(409, "用户名已存在");
        }

        Map<String, Object> data = new HashMap<>();
        data.put("userId", user.getId());
        data.put("username", user.getUsername());
        return ResponseResult.success(data);
    }

    @PostMapping("/login")
    public ResponseResult login(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");

        if (username == null || password == null) {
            return ResponseResult.fail(400, "用户名和密码不能为空");
        }

        String token = userService.login(username, password);
        if (token == null) {
            return ResponseResult.fail(401, "用户名或密码错误");
        }

        User user = userService.findByUsername(username);
        Map<String, Object> data = new HashMap<>();
        data.put("token", token);
        data.put("userId", user.getId());
        data.put("username", user.getUsername());
        data.put("avatar", user.getAvatar());
        data.put("phone", user.getPhone());

        return ResponseResult.success(data);
    }
}
