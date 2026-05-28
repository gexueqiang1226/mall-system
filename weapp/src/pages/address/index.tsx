import { Component } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.css'
import api from '@/services/api'

interface Address {
  id: number
  receiver: string
  phone: string
  province: string
  city: string
  district: string
  detail: string
  isDefault: number
}

interface AddressState {
  addresses: Address[]
  loading: boolean
  mode: string
}

export default class AddressPage extends Component<{}, AddressState> {
  constructor(props) {
    super(props)
    this.state = { addresses: [], loading: false, mode: 'manage' }
  }

  componentDidMount() {
    const pages = Taro.getCurrentPages()
    const currentPage = pages[pages.length - 1]
    this.setState({ mode: currentPage.options?.mode || 'manage' })
    this.loadAddresses()
  }

  loadAddresses = async () => {
    const userInfo = Taro.getStorageSync('USER_INFO')
    if (!userInfo?.userId) return
    this.setState({ loading: true })
    try {
      const res = await api.get('/addresses', { userId: userInfo.userId })
      this.setState({ addresses: res.data || [], loading: false })
    } catch { this.setState({ loading: false }) }
  }

  selectAddress = (addr: Address) => {
    if (this.state.mode === 'select') {
      Taro.setStorageSync('SELECTED_ADDRESS', addr)
      Taro.navigateBack()
    }
  }

  editAddress = (id: number, e: any) => {
    e.stopPropagation()
    Taro.navigateTo({ url: `/pages/address-form/index?id=${id}` })
  }

  deleteAddress = async (id: number, e: any) => {
    e.stopPropagation()
    Taro.showModal({ title: '提示', content: '确认删除该地址？', success: async (res) => {
      if (res.confirm) {
        await api.delete(`/addresses/${id}`)
        Taro.showToast({ title: '已删除', icon: 'success' })
        this.loadAddresses()
      }
    }})
  }

  setDefault = async (id: number, e: any) => {
    e.stopPropagation()
    const userInfo = Taro.getStorageSync('USER_INFO')
    await api.put(`/addresses/${id}/default`, { userId: userInfo.userId })
    this.loadAddresses()
  }

  goAdd = () => Taro.navigateTo({ url: '/pages/address-form/index' })
  goBack = () => Taro.navigateBack()

  render() {
    const { addresses, loading, mode } = this.state
    return (
      <View className="address-page">
        <View className="addr-header">
          <View className="addr-back" onClick={this.goBack}><Text>‹</Text></View>
          <Text className="addr-title">收货地址</Text>
          <View style={{ width: '32px' }} />
        </View>
        <ScrollView scrollY className="addr-scroll">
          {loading && <View className="loading-spinner" />}
          {addresses.map((a) => (
            <View key={a.id} className="addr-card" onClick={() => this.selectAddress(a)}>
              <View className="addr-card-info">
                <View className="addr-card-name-row">
                  <Text className="addr-card-name">{a.receiver}</Text>
                  <Text className="addr-card-phone">{a.phone}</Text>
                  {a.isDefault === 1 && <Text className="addr-default-tag">默认</Text>}
                </View>
                <Text className="addr-card-detail">{a.province}{a.city}{a.district}{a.detail}</Text>
              </View>
              <View className="addr-card-actions">
                <Text className="addr-action-btn" onClick={(e) => this.editAddress(a.id, e)}>编辑</Text>
                {a.isDefault !== 1 && <Text className="addr-action-btn" onClick={(e) => this.setDefault(a.id, e)}>设为默认</Text>}
                <Text className="addr-action-btn danger" onClick={(e) => this.deleteAddress(a.id, e)}>删除</Text>
              </View>
            </View>
          ))}
          {!loading && addresses.length === 0 && <View className="empty-state">暂无收货地址</View>}
        </ScrollView>
        <View className="addr-footer">
          <View className="addr-add-btn" onClick={this.goAdd}><Text className="addr-add-text">+ 新增地址</Text></View>
        </View>
      </View>
    )
  }
}
