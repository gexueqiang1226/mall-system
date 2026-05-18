package com.mall.address.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.mall.address.entity.Address;

import java.util.List;

public interface AddressService extends IService<Address> {
    List<Address> listByUserId(Long userId);
    boolean setDefault(Long addressId, Long userId);
}
