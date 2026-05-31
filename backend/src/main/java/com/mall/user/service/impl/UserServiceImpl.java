package com.mall.user.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.mall.common.security.JwtTokenProvider;
import com.mall.order.entity.Order;
import com.mall.order.mapper.OrderMapper;
import com.mall.user.entity.User;
import com.mall.user.mapper.UserMapper;
import com.mall.user.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class UserServiceImpl extends ServiceImpl<UserMapper, User> implements UserService {

    @Autowired
    private PasswordEncoder passwordEncoder;

@Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private OrderMapper orderMapper;

    @Override
    public User register(String username, String password, String phone) {
        if (findByUsername(username) != null) {
            return null;
        }

        User user = User.builder()
                .username(username)
                .password(passwordEncoder.encode(password))
                .phone(phone)
                .status(1)
                .build();
        this.save(user);
        return user;
    }

    @Override
    public String login(String username, String password) {
        User user = findByUsername(username);
        if (user == null) {
            return null;
        }

        if (user.getStatus() != null && user.getStatus() == 0) {
            return null;
        }

        if (!passwordEncoder.matches(password, user.getPassword())) {
            return null;
        }

        return jwtTokenProvider.generateToken(user.getId(), user.getUsername(), "user");
    }

    @Override
    public User findByUsername(String username) {
        return this.getOne(new QueryWrapper<User>().eq("username", username));
    }

    @Override
    public boolean updateProfile(Long userId, String nickname, String avatar, String email) {
        User user = this.getById(userId);
        if (user == null) {
            return false;
        }
        if (nickname != null) {
            user.setUsername(nickname);
        }
        if (avatar != null) {
            user.setAvatar(avatar);
        }
        if (email != null) {
            user.setEmail(email);
        }
        return this.updateById(user);
    }

    @Override
    public Map<String, Object> getUserInfo(Long userId) {
        User user = this.getById(userId);
        if (user == null) {
            return null;
        }
        Map<String, Object> data = new HashMap<>();
        data.put("userId", user.getId());
        data.put("username", user.getUsername());
        data.put("nickname", user.getUsername());
        data.put("avatar", user.getAvatar());
        data.put("email", user.getEmail());
        data.put("phone", user.getPhone());
        data.put("status", user.getStatus());
        data.put("points", 0);
        data.put("createTime", user.getCreateTime());
        return data;
    }

    @Override
    public boolean changePassword(Long userId, String oldPassword, String newPassword) {
        User user = this.getById(userId);
        if (user == null) {
            return false;
        }
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            return false;
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        return this.updateById(user);
    }

    @Override
    public IPage<User> listUsers(String keyword, int page, int size) {
        IPage<User> userPage = new com.baomidou.mybatisplus.extension.plugins.pagination.Page<>(page, size);
        QueryWrapper<User> queryWrapper = new QueryWrapper<>();
        
        if (keyword != null && !keyword.trim().isEmpty()) {
            queryWrapper.and(w -> w
                    .like("username", keyword)
                    .or().like("phone", keyword)
                    .or().like("email", keyword));
        }
        
        queryWrapper.orderByDesc("create_time");
        return this.page(userPage, queryWrapper);
    }

    @Override
    public Map<String, Object> getUserDetail(Long userId) {
        User user = this.getById(userId);
        if (user == null) {
            return null;
        }
        
        Map<String, Object> detail = new HashMap<>();
        detail.put("userId", user.getId());
        detail.put("nickname", user.getUsername());
        detail.put("phone", user.getPhone());
        detail.put("email", user.getEmail());
        detail.put("createTime", user.getCreateTime());
        
        Map<String, Object> stats = getUserStats(userId);
        detail.put("totalOrders", stats.get("totalOrders"));
        detail.put("totalSpent", stats.get("totalSpent"));
        
        return detail;
    }

    @Override
    public Map<String, Object> getUserStats(Long userId) {
        Map<String, Object> stats = new HashMap<>();
        
        // totalOrders: count of mall_order rows where user_id matches and status != 5
        QueryWrapper<Order> orderQuery = new QueryWrapper<>();
        orderQuery.eq("user_id", userId).ne("status", 5);
        long totalOrders = orderMapper.selectCount(orderQuery);
        stats.put("totalOrders", totalOrders);
        
        // totalSpent: sum of total_amount where user_id matches and status >= 1 and status NOT IN (4,5)
        QueryWrapper<Order> spentQuery = new QueryWrapper<>();
        spentQuery.eq("user_id", userId)
                .ge("status", 1)
                .notIn("status", 4, 5);
        List<Object> spentObjs = orderMapper.selectObjs(spentQuery);
        double totalSpentVal = spentObjs.stream()
                .filter(obj -> obj != null)
                .mapToDouble(obj -> ((Number) obj).doubleValue())
                .sum();
        stats.put("totalSpent", BigDecimal.valueOf(totalSpentVal));
        
        return stats;
    }

    @Override
    @Transactional
    public boolean updateUser(Long userId, String nickname, String email) {
        User user = this.getById(userId);
        if (user == null) {
            return false;
        }
        if (nickname != null) {
            user.setUsername(nickname);
        }
        if (email != null) {
            user.setEmail(email);
        }
        return this.updateById(user);
    }
}
