import { Component } from 'react'
import Taro from '@tarojs/taro'
import { getStorage } from '@/utils/storage'
import { View, Text, ScrollView } from '@tarojs/components'
import api from '@/services/api'
import './index.css'

interface Coupon {
  id: number
  couponName: string
  couponType: string
  discountValue: number
  minAmount: number
  startTime: string
  endTime: string
  status: number
}

const TABS = [
  { label: '未使用', status: 0 },
  { label: '已使用', status: 1 },
  { label: '已过期', status: 2 },
]

interface State {
  coupons: Coupon[]
  activeTab: number
  loading: boolean
  userId: number
}

export default class Coupons extends Component<{}, State> {
  state: State = {
    coupons: [],
    activeTab: 0,
    loading: false,
    userId: 0,
  }

  componentDidMount() {
    const userInfo = getStorage('USER_INFO')
    const userId = userInfo?.id || getStorage('USER_ID') || 0
    this.setState({ userId }, () => { if (userId) this.loadCoupons() })
  }

  async loadCoupons() {
    const { userId, activeTab } = this.state
    this.setState({ loading: true })
    try {
      const res = await api.get('/coupons', { userId, status: activeTab })
      this.setState({ coupons: res?.data || [], loading: false })
    } catch {
      Taro.showToast({ title: '加载失败', icon: 'none' })
      this.setState({ loading: false })
    }
  }

  switchTab(idx: number) {
    this.setState({ activeTab: idx }, () => this.loadCoupons())
  }

  getCouponGradient(status: number) {
    if (status === 1) return 'linear-gradient(135deg, #ccc 0%, #bbb 100%)'
    if (status === 2) return 'linear-gradient(135deg, #ccc 0%, #bbb 100%)'
    return 'linear-gradient(135deg, #FF6B35 0%, #FF2D2D 100%)'
  }

  render() {
    const { coupons, activeTab, loading } = this.state

    return (
      <View className='coupons-page'>
        <View className='tab-bar'>
          {TABS.map((tab, i) => (
            <View
              key={i}
              className={`tab-item ${activeTab === i ? 'active' : ''}`}
              onClick={() => this.switchTab(i)}
            >
              <Text>{tab.label}</Text>
            </View>
          ))}
        </View>

        <ScrollView className='coupons-scroll' scrollY>
          {coupons.map(c => (
            <View key={c.id} className='coupon-card'>
              <View className='coupon-left' style={{ background: this.getCouponGradient(c.status) }}>
                <Text className='coupon-value'>¥{c.discountValue}</Text>
                <Text className='coupon-min'>满{c.minAmount}元可用</Text>
              </View>
              <View className='coupon-divider'>
                <View className='circle top' />
                <View className='dash-line' />
                <View className='circle bottom' />
              </View>
              <View className='coupon-right'>
                <Text className='coupon-name'>{c.couponName}</Text>
                <Text className='coupon-expire'>
                  {c.endTime?.slice(0, 10)} 到期
                </Text>
                {c.status === 0 && (
                  <View className='use-btn' onClick={() => Taro.switchTab({ url: '/pages/index/index' })}>
                    <Text>去使用</Text>
                  </View>
                )}
                {c.status === 1 && <Text className='used-label'>已使用</Text>}
                {c.status === 2 && <Text className='expire-label'>已过期</Text>}
              </View>
            </View>
          ))}

          {!loading && coupons.length === 0 && (
            <View className='empty-tip'>
              <Text className='empty-icon'>🎟️</Text>
              <Text className='empty-text'>暂无{TABS[activeTab].label}优惠券</Text>
            </View>
          )}
          {loading && <View className='loading-tip'>加载中...</View>}
        </ScrollView>
      </View>
    )
  }
}
