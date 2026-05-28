package com.mall.user.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.mall.user.entity.User;

import java.util.Map;

public interface UserService extends IService<User> {
    User register(String username, String password, String phone);
    String login(String username, String password);
    User findByUsername(String username);
    boolean updateProfile(Long userId, String nickname, String avatar, String email);
    Map<String, Object> getUserInfo(Long userId);
    boolean changePassword(Long userId, String oldPassword, String newPassword);
    IPage<User> listUsers(String keyword, int page, int size);
    Map<String, Object> getUserDetail(Long userId);
    boolean updateUser(Long userId, String nickname, String email);
    Map<String, Object> getUserStats(Long userId);
}
