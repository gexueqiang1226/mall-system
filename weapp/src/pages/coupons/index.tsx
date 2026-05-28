import { Component } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.css'
import api from '@/services/api'

interface Coupon {
  id: number
  title: string
  type: number
  discountValue: number
  minAmount: number
  status: number
  endTime: string
}

interface CouponsState {
  coupons: Coupon[]
  activeTab: string
  loading: boolean
}

const TYPE_LABELS: Record<number, string> = { 1: '满减', 2: '折扣', 3: '免邮' }
const TABS = [
  { key: '0', label: '未使用' },
  { key: '1', label: '已使用' },
  { key: '2', label: '已过期' },
]

export default class Coupons extends Component<{}, CouponsState> {
  constructor(props) {
    super(props)
    this.state = { coupons: [], activeTab: '0', loading: false }
  }

  componentDidMount() { this.loadCoupons() }

  loadCoupons = async () => {
    const userInfo = Taro.getStorageSync('USER_INFO')
    if (!userInfo?.userId) { Taro.showToast({ title: '请先登录', icon: 'error' }); return }
    this.setState({ loading: true })
    try {
      const res = await api.get('/coupons', { userId: userInfo.userId, status: this.state.activeTab })
      this.setState({ coupons: res.data || [], loading: false })
    } catch { this.setState({ loading: false }) }
  }

  switchTab = (tab: string) => {
    this.setState({ activeTab: tab }, () => this.loadCoupons())
  }

  goBack = () => Taro.navigateBack()

  render() {
    const { coupons, activeTab, loading } = this.state
    return (
      <View className="coupons-page">
        <View className="coupons-header">
          <View className="coupons-back" onClick={this.goBack}><Text>‹</Text></View>
          <Text className="coupons-title">优惠券</Text>
          <View style={{ width: '32px' }} />
        </View>
        <View className="tab-bar">
          {TABS.map((t) => (
            <View key={t.key} className={`tab-item ${activeTab === t.key ? 'active' : ''}`} onClick={() => this.switchTab(t.key)}>
              <Text>{t.label}</Text>
            </View>
          ))}
        </View>
        <ScrollView scrollY className="coupons-scroll">
          {loading && <View className="loading-spinner" />}
          {!loading && coupons.map((c) => {
            const discount = c.type === 2 ? `${(c.discountValue / 10)}折` : `¥${c.discountValue}`
            const minText = c.minAmount > 0 ? `满${c.minAmount}可用` : '无门槛'
            const endDate = c.endTime ? c.endTime.split(' ')[0] : '长期有效'
            return (
              <View key={c.id} className={`coupon-card ${c.status === 1 ? 'used' : ''}`}>
                <View className="coupon-left">
                  <Text className="coupon-type">{TYPE_LABELS[c.type] || '优惠'}</Text>
                  <Text className="coupon-value">{discount}</Text>
                </View>
                <View className="coupon-right">
                  <Text className="coupon-title">{c.title}</Text>
                  <Text className="coupon-min">{minText}</Text>
                  <Text className="coupon-date">有效期至 {endDate}</Text>
                </View>
              </View>
            )
          })}
          {!loading && coupons.length === 0 && <View className="empty-state">暂无优惠券</View>}
        </ScrollView>
      </View>
    )
  }
}
