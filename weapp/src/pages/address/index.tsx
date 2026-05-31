import { Component } from 'react'
import Taro from '@tarojs/taro'
import { getStorage } from '@/utils/storage'
import { View, Text, ScrollView } from '@tarojs/components'
import api from '@/services/api'
import './index.css'

interface Address {
  id: number
  receiver: string
  phone: string
  province: string
  city: string
  district: string
  detail: string
  isDefault: boolean
}

interface State {
  addresses: Address[]
  loading: boolean
  userId: number
}

export default class AddressList extends Component<{}, State> {
  state: State = {
    addresses: [],
    loading: false,
    userId: 0,
  }

  componentDidShow() {
    const userInfo = getStorage('USER_INFO')
    const userId = userInfo?.id || getStorage('USER_ID') || 0
    this.setState({ userId }, () => { if (userId) this.loadAddresses() })
  }

  async loadAddresses() {
    const { userId } = this.state
    this.setState({ loading: true })
    try {
      const res = await api.get('/addresses', { userId })
      this.setState({ addresses: res?.data || [], loading: false })
    } catch {
      Taro.showToast({ title: '加载失败', icon: 'none' })
      this.setState({ loading: false })
    }
  }

  async setDefault(addr: Address) {
    try {
      await api.put(`/addresses/${addr.id}/default?userId=${this.state.userId}`, {})
      this.loadAddresses()
    } catch {
      Taro.showToast({ title: '操作失败', icon: 'none' })
    }
  }

  async deleteAddress(addr: Address) {
    Taro.showModal({
      title: '删除地址',
      content: '确定要删除这个地址吗？',
      success: async res => {
        if (res.confirm) {
          try {
            await api.delete(`/addresses/${addr.id}`)
            this.setState(prev => ({ addresses: prev.addresses.filter(a => a.id !== addr.id) }))
            Taro.showToast({ title: '已删除', icon: 'success' })
          } catch {
            Taro.showToast({ title: '删除失败', icon: 'none' })
          }
        }
      },
    })
  }

  goAddressForm(addrId?: number) {
    const url = addrId
      ? `/pages/address-form/index?id=${addrId}`
      : '/pages/address-form/index'
    Taro.navigateTo({ url })
  }

  goBack() {
    const pages = Taro.getCurrentPages()
    if (pages.length > 1) {
      Taro.navigateBack()
    } else {
      Taro.switchTab({ url: '/pages/user/index' })
    }
  }

  render() {
    const { addresses, loading } = this.state

    return (
      <View className='address-page'>
        <View className='detail-nav-bar'>
          <View className='detail-back-btn' onClick={this.goBack.bind(this)}>
            <Text className='detail-back-icon'>‹</Text>
          </View>
          <Text className='detail-nav-title'>地址管理</Text>
        </View>
        <ScrollView className='addr-scroll' scrollY>
          {addresses.map(addr => (
            <View className='addr-card' key={addr.id}>
              <View className='addr-main' onClick={() => this.goAddressForm(addr.id)}>
                <View className='addr-top'>
                  <Text className='addr-receiver'>{addr.receiver}</Text>
                  <Text className='addr-phone'>{addr.phone}</Text>
                  {addr.isDefault && <View className='default-badge'>默认</View>}
                </View>
                <Text className='addr-full'>
                  {addr.province}{addr.city}{addr.district} {addr.detail}
                </Text>
              </View>
              <View className='addr-actions'>
                {!addr.isDefault && (
                  <Text className='addr-action-btn' onClick={() => this.setDefault(addr)}>设为默认</Text>
                )}
                <Text className='addr-action-btn edit' onClick={() => this.goAddressForm(addr.id)}>编辑</Text>
                <Text className='addr-action-btn delete' onClick={() => this.deleteAddress(addr)}>删除</Text>
              </View>
            </View>
          ))}

          {!loading && addresses.length === 0 && (
            <View className='empty-tip'>
              <Text className='empty-icon'>📍</Text>
              <Text className='empty-text'>还没有收货地址</Text>
            </View>
          )}
          {loading && <View className='loading-tip'>加载中...</View>}

          <View style={{ height: '80px' }} />
        </ScrollView>

        {/* 底部新增按钮 */}
        <View className='add-addr-bar' onClick={() => this.goAddressForm()}>
          <Text>+ 新增收货地址</Text>
        </View>
      </View>
    )
  }
}
