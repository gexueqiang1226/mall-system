package com.mall.address.controller;

import com.mall.address.entity.Address;
import com.mall.address.service.AddressService;
import com.mall.common.response.ResponseResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping
public class AddressController {

    @Autowired
    private AddressService addressService;

    @GetMapping("/api/addresses")
    public ResponseResult listAddresses(@RequestParam Long userId) {
        List<Address> list = addressService.listByUserId(userId);
        return ResponseResult.success(list);
    }

    @PostMapping("/api/addresses")
    public ResponseResult addAddress(@RequestBody Address address) {
        if (address.getUserId() == null || address.getReceiver() == null || address.getPhone() == null) {
            return ResponseResult.fail(400, "用户ID、收货人、手机号不能为空");
        }
        addressService.save(address);
        return ResponseResult.success(address);
    }

    @PutMapping("/api/addresses/{id}")
    public ResponseResult updateAddress(@PathVariable Long id, @RequestBody Address address) {
        Address existing = addressService.getById(id);
        if (existing == null) {
            return ResponseResult.fail(404, "地址不存在");
        }
        address.setId(id);
        addressService.updateById(address);
        return ResponseResult.success(address);
    }

    @DeleteMapping("/api/addresses/{id}")
    public ResponseResult deleteAddress(@PathVariable Long id) {
        boolean ok = addressService.removeById(id);
        if (!ok) {
            return ResponseResult.fail(404, "地址不存在");
        }
        return ResponseResult.success("删除成功");
    }

    @PutMapping("/api/addresses/{id}/default")
    public ResponseResult setDefault(@PathVariable Long id, @RequestParam Long userId) {
        boolean ok = addressService.setDefault(id, userId);
        if (!ok) {
            return ResponseResult.fail(404, "设置默认地址失败");
        }
        return ResponseResult.success("设置成功");
    }
}
