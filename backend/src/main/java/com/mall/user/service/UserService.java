package com.mall.user.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.mall.user.entity.User;

public interface UserService extends IService<User> {
    User register(String username, String password, String phone);
    String login(String username, String password);
    User findByUsername(String username);
}
