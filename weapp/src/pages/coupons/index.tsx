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
  title?: string
  type?: string
}

type CouponStatus = 'unused' | 'used' | 'expired'

const TABS = [
  { label: '可领取', key: 'available' },
  { label: '我的优惠券', key: 'mine' },
]

const MINE_TABS = [
  { label: '未使用', status: 0 },
  { label: '已使用', status: 1 },
  { label: '已过期', status: 2 },
]

interface State {
  coupons: Coupon[]
  activeTab: number
  activeMineTab: number
  loading: boolean
  userId: number
  page: number
  hasMore: boolean
}

export default class Coupons extends Component<{}, State> {
  state: State = {
    coupons: [],
    activeTab: 0,
    activeMineTab: 0,
    loading: false,
    userId: 0,
    page: 1,
    hasMore: true,
  }

  componentDidMount() {
    const userInfo = getStorage('USER_INFO')
    const userId = userInfo?.id || getStorage('USER_ID') || 0
    this.setState({ userId }, () => { if (userId) this.loadCoupons(true) })
  }

  async loadCoupons(reset = false) {
    const { userId, activeTab, page } = this.state
    if (!userId) return
    const nextPage = reset ? 1 : page + 1
    this.setState({ loading: true })
    try {
      let res: any
      let items: Coupon[] = []
      if (activeTab === 0) {
        // 可领取：已发放给用户的未使用优惠券
        try {
          res = await api.get('/coupons/available', { userId, amount: 0 })
        } catch {
          res = await api.get('/coupons', { userId, status: 0 })
        }
        items = res?.data || []
      } else {
        // 我的优惠券
        res = await api.get('/coupons', { userId, status: this.state.activeMineTab })
        items = res?.data || []
      }
      this.setState(prev => ({
        coupons: reset ? items : [...prev.coupons, ...items],
        page: nextPage,
        hasMore: items.length >= 10,
        loading: false,
      }))
    } catch {
      this.setState({ loading: false })
      Taro.showToast({ title: '加载失败', icon: 'none' })
    }
  }

  switchTab(idx: number) {
    if (idx === this.state.activeTab) return
    this.setState({ activeTab: idx, coupons: [], page: 1, hasMore: true }, () => this.loadCoupons(true))
  }

  switchMineTab(idx: number) {
    if (idx === this.state.activeMineTab) return
    this.setState({ activeMineTab: idx, coupons: [], page: 1, hasMore: true }, () => this.loadCoupons(true))
  }

  async claimCoupon(coupon: Coupon, e: any) {
    e.stopPropagation()
    if (!coupon.id) return
    Taro.showLoading({ title: '领取中...' })
    try {
      // 尝试领取：POST /api/coupons/claim/{id} 或 POST /api/coupons/claim
      let res: any
      try {
        res = await api.post(`/coupons/claim/${coupon.id}`, { userId: this.state.userId })
      } catch (err1) {
        try {
          res = await api.post('/coupons/claim', { userId: this.state.userId, couponId: coupon.id })
        } catch (err2) {
          // 后端若没有领取接口，直接返回成功提示
          Taro.hideLoading()
          Taro.showToast({ title: '请联系管理员配置优惠券领取接口', icon: 'none', duration: 2500 })
          return
        }
      }
      Taro.hideLoading()
      if (res?.code === 0) {
        Taro.showToast({ title: '领取成功', icon: 'success' })
        setTimeout(() => this.loadCoupons(true), 1000)
      } else {
        Taro.showToast({ title: res?.message || '领取失败', icon: 'none' })
      }
    } catch {
      Taro.hideLoading()
      Taro.showToast({ title: '领取失败', icon: 'none' })
    }
  }

  getCouponGradient(coupon: Coupon) {
    // 可领取状态的卡片
    if (this.state.activeTab === 0) {
      return 'linear-gradient(135deg, #FF6B35 0%, #FF2D2D 100%)'
    }
    if (coupon.status === 1) return 'linear-gradient(135deg, #ccc 0%, #bbb 100%)'
    if (coupon.status === 2) return 'linear-gradient(135deg, #ccc 0%, #bbb 100%)'
    return 'linear-gradient(135deg, #FF6B35 0%, #FF2D2D 100%)'
  }

  renderCouponCard(coupon: Coupon) {
    const gradient = this.getCouponGradient(coupon)
    const isAvailable = this.state.activeTab === 0
    const couponName = coupon.title || coupon.couponName || '优惠券'
    const discountValue = coupon.discountValue || 0
    const minAmount = coupon.minAmount || 0
    const endTime = coupon.endTime ? coupon.endTime.slice(0, 10) : ''

    return (
      <View key={coupon.id} className='coupon-card'>
        <View className='coupon-left' style={{ background: gradient }}>
          <Text className='coupon-value'>¥{discountValue}</Text>
          <Text className='coupon-min'>满{minAmount}元可用</Text>
        </View>
        <View className='coupon-divider'>
          <View className='circle top' />
          <View className='dash-line' />
          <View className='circle bottom' />
        </View>
        <View className='coupon-right'>
          <Text className='coupon-name'>{couponName}</Text>
          <Text className='coupon-expire'>{endTime ? `${endTime} 到期` : ''}</Text>
          {isAvailable && (
            <View className='claim-btn' onClick={e => this.claimCoupon(coupon, e)}>
              <Text>立即领取</Text>
            </View>
          )}
          {!isAvailable && coupon.status === 0 && (
            <View className='use-btn' onClick={() => Taro.switchTab({ url: '/pages/index/index' })}>
              <Text>去使用</Text>
            </View>
          )}
          {!isAvailable && coupon.status === 1 && <Text className='used-label'>已使用</Text>}
          {!isAvailable && coupon.status === 2 && <Text className='expire-label'>已过期</Text>}
        </View>
      </View>
    )
  }

  onScrollToLower = () => {
    if (!this.state.loading && this.state.hasMore) {
      this.loadCoupons(false)
    }
  }

  render() {
    const { coupons, activeTab, loading, hasMore } = this.state

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

        {activeTab === 1 && (
          <View className='mine-tabs'>
            {MINE_TABS.map((tab, i) => (
              <View
                key={i}
                className={`mine-tab-item ${this.state.activeMineTab === i ? 'active' : ''}`}
                onClick={() => this.switchMineTab(i)}
              >
                <Text>{tab.label}</Text>
              </View>
            ))}
          </View>
        )}

        <ScrollView
          className='coupons-scroll'
          scrollY
          onScrollToLower={this.onScrollToLower}
        >
          {coupons.map(c => this.renderCouponCard(c))}

          {loading && <View className='loading-tip'>加载中...</View>}
          {!loading && !hasMore && coupons.length > 0 && (
            <View className='no-more-tip'>— 已经到底了 —</View>
          )}
          {!loading && coupons.length === 0 && (
            <View className='empty-tip'>
              <Text className='empty-icon'>🎟️</Text>
              <Text className='empty-text'>
                {activeTab === 0 ? '暂无可领取的优惠券' : `暂无${MINE_TABS[this.state.activeMineTab].label}优惠券`}
              </Text>
              {activeTab === 0 && (
                <View className='go-shop-btn' onClick={() => Taro.switchTab({ url: '/pages/index/index' })}>
                  <Text>去逛逛</Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    )
  }
}