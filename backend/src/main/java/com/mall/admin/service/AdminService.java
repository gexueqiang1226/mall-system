package com.mall.admin.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.mall.admin.entity.Admin;

public interface AdminService extends IService<Admin> {
    Admin findByUsername(String username);
}
