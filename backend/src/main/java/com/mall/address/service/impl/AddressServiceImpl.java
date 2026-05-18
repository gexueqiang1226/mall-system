package com.mall.address.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.mall.address.entity.Address;
import com.mall.address.mapper.AddressMapper;
import com.mall.address.service.AddressService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AddressServiceImpl extends ServiceImpl<AddressMapper, Address> implements AddressService {

    @Override
    public List<Address> listByUserId(Long userId) {
        QueryWrapper<Address> wrapper = new QueryWrapper<Address>()
                .eq("user_id", userId)
                .orderByDesc("is_default")
                .orderByDesc("create_time");
        return this.list(wrapper);
    }

    @Override
    @Transactional
    public boolean setDefault(Long addressId, Long userId) {
        // 先将该用户所有地址设为非默认
        UpdateWrapper<Address> clearWrapper = new UpdateWrapper<Address>()
                .eq("user_id", userId)
                .eq("is_default", 1)
                .set("is_default", 0);
        this.update(clearWrapper);

        // 再将目标地址设为默认
        Address address = this.getById(addressId);
        if (address == null || !address.getUserId().equals(userId)) {
            return false;
        }
        address.setIsDefault(1);
        this.updateById(address);
        return true;
    }
}
