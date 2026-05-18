package com.mall.user.controller;

import com.mall.common.response.ResponseResult;
import com.mall.user.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping("/profile")
    public ResponseResult getProfile(@RequestParam Long userId) {
        Map<String, Object> userInfo = userService.getUserInfo(userId);
        if (userInfo == null) {
            return ResponseResult.fail(404, "用户不存在");
        }
        return ResponseResult.success(userInfo);
    }

    @PutMapping("/profile")
    public ResponseResult updateProfile(@RequestBody Map<String, String> body) {
        Long userId = body.get("userId") == null ? null : Long.valueOf(body.get("userId"));
        String nickname = body.get("nickname");
        String avatar = body.get("avatar");
        String email = body.get("email");

        if (userId == null) {
            return ResponseResult.fail(400, "用户ID不能为空");
        }

        boolean ok = userService.updateProfile(userId, nickname, avatar, email);
        if (!ok) {
            return ResponseResult.fail(404, "用户不存在");
        }
        return ResponseResult.success("修改成功");
    }

    @PutMapping("/password")
    public ResponseResult changePassword(@RequestBody Map<String, String> body) {
        Long userId = body.get("userId") == null ? null : Long.valueOf(body.get("userId"));
        String oldPassword = body.get("oldPassword");
        String newPassword = body.get("newPassword");

        if (userId == null || oldPassword == null || newPassword == null) {
            return ResponseResult.fail(400, "用户ID、旧密码和新密码不能为空");
        }

        boolean ok = userService.changePassword(userId, oldPassword, newPassword);
        if (!ok) {
            return ResponseResult.fail(400, "旧密码错误或用户不存在");
        }
        return ResponseResult.success("密码修改成功");
    }
}
