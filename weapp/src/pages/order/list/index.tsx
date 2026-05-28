import { Component } from 'react'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import api from '@/services/api'
import './index.css'

/* ---------- types ---------- */

interface AddressInfo {
  id: number
  recipientName: string
  recipientPhone: string
  province?: string
  city?: string
  district?: string
  detailAddress: string
  isDefault?: number
}

interface OrderItem {
  id: number
  productId: number
  productName: string
  mainImage: string
  salePrice: number
  skuPrice?: number
  quantity: number
  checked: number
  skuSpecs?: string
}

interface CouponInfo {
  id: number
  couponName: string
  discountAmount: number
  minAmount: number
  description?: string
}

interface OrderListState {
  loading: boolean
  address: AddressInfo | null
  items: OrderItem[]
  coupons: CouponInfo[]
  selectedCoupon: CouponInfo | null
  showCouponPicker: boolean
  pointsBalance: number
  usePoints: boolean
  failedImages: Set<number>
}

/* ---------- discount tiers ---------- */

const DISCOUNT_TIERS = [
  { threshold: 999, discount: 120 },
  { threshold: 499, discount: 50 },
  { threshold: 199, discount: 20 },
]

/* ---------- component ---------- */

export default class OrderList extends Component<{}, OrderListState> {
  constructor(props) {
    super(props)
    this.state = {
      loading: true,
      address: null,
      items: [],
      coupons: [],
      selectedCoupon: null,
      showCouponPicker: false,
      pointsBalance: 0,
      usePoints: false,
      failedImages: new Set(),
    }
  }

  componentDidMount() {
    this.init()
  }

  componentDidShow() {
    // If returning from address selection page, reload address
    const selectedAddr = Taro.getStorageSync('SELECTED_ADDRESS')
    if (selectedAddr) {
      this.setState({ address: selectedAddr })
      Taro.removeStorageSync('SELECTED_ADDRESS')
    }
  }

  getUserId = (): number | null => {
    const userInfo = Taro.getStorageSync('USER_INFO')
    return userInfo?.userId || null
  }

  init = async () => {
    const userId = this.getUserId()
    if (!userId) {
      Taro.showToast({ title: '请先登录', icon: 'error' })
      setTimeout(() => Taro.switchTab({ url: '/pages/user/index' }), 1000)
      return
    }
    try {
      this.setState({ loading: true })
      await Promise.all([
        this.loadAddress(userId),
        this.loadCartItems(userId),
        this.loadPoints(userId),
      ])
      this.setState({ loading: false })
    } catch (err) {
      console.error('Init order page failed:', err)
      this.setState({ loading: false })
    }
  }

  loadAddress = async (userId: number) => {
    try {
      const res = await api.get('/addresses', { userId })
      const addresses: AddressInfo[] = res.data || res || []
      const defaultAddr = addresses.find((a) => a.isDefault === 1) || addresses[0] || null
      this.setState({ address: defaultAddr })
    } catch (err) {
      console.error('Load address failed:', err)
    }
  }

  loadCartItems = async (userId: number) => {
    try {
      const res = await api.get('/cart', { userId })
      const allItems: OrderItem[] = res.data || res || []
      const checkedItems = allItems.filter((item) => item.checked === 1)
      this.setState({ items: checkedItems }, () => {
        if (checkedItems.length > 0) {
          this.loadCoupons(userId)
        }
      })
    } catch (err) {
      console.error('Load cart items failed:', err)
    }
  }

  loadCoupons = async (userId: number) => {
    const goodsTotal = this.getGoodsTotal()
    try {
      const res = await api.get('/coupons/available', { userId, amount: goodsTotal })
      const coupons: CouponInfo[] = res.data || res || []
      this.setState({ coupons })
    } catch (err) {
      console.error('Load coupons failed:', err)
    }
  }

  loadPoints = async (userId: number) => {
    try {
      const res = await api.get('/points/balance', { userId })
      const balance = res.data?.balance || res.data || res || 0
      this.setState({ pointsBalance: Number(balance) })
    } catch (err) {
      console.error('Load points failed:', err)
    }
  }

  /* ---------- computed values ---------- */

  getUnitPrice = (item: OrderItem): number => {
    return item.skuPrice || item.salePrice || 0
  }

  getGoodsTotal = (): number => {
    return this.state.items.reduce(
      (sum, item) => sum + this.getUnitPrice(item) * item.quantity,
      0
    )
  }

  getShippingFee = (): number => {
    const goodsTotal = this.getGoodsTotal()
    return goodsTotal >= 99 ? 0 : 10
  }

  getFullDiscount = (): number => {
    const goodsTotal = this.getGoodsTotal()
    let discount = 0
    for (const tier of DISCOUNT_TIERS) {
      if (goodsTotal >= tier.threshold) {
        discount = tier.discount
        break
      }
    }
    return discount
  }

  getCouponDiscount = (): number => {
    const { selectedCoupon } = this.state
    if (!selectedCoupon) return 0
    return selectedCoupon.discountAmount || 0
  }

  getPointsOffset = (): number => {
    const { pointsBalance, usePoints } = this.state
    if (!usePoints || pointsBalance <= 0) return 0
    return Math.floor(pointsBalance / 100)
  }

  getBestDiscount = (): { type: string; amount: number } => {
    const fullDiscount = this.getFullDiscount()
    const couponDiscount = this.getCouponDiscount()
    if (fullDiscount >= couponDiscount) {
      return { type: 'full', amount: fullDiscount }
    }
    return { type: 'coupon', amount: couponDiscount }
  }

  getFinalPrice = (): number => {
    const goodsTotal = this.getGoodsTotal()
    const shipping = this.getShippingFee()
    const { amount: discount } = this.getBestDiscount()
    const pointsOffset = this.getPointsOffset()
    const final = goodsTotal + shipping - discount - pointsOffset
    return Math.max(final, 0)
  }

  /* ---------- actions ---------- */

  selectAddress = () => {
    Taro.navigateTo({ url: '/pages/address/index?mode=select' })
  }

  openCouponPicker = () => {
    this.setState({ showCouponPicker: true })
  }

  closeCouponPicker = () => {
    this.setState({ showCouponPicker: false })
  }

  selectCoupon = (coupon: CouponInfo | null) => {
    this.setState((prev) => ({
      selectedCoupon:
        prev.selectedCoupon && prev.selectedCoupon.id === coupon?.id ? null : coupon,
      showCouponPicker: false,
    }))
  }

  togglePoints = () => {
    this.setState((prev) => ({ usePoints: !prev.usePoints }))
  }

  handleImageError = (id: number) => {
    this.setState((prev) => {
      const failedImages = new Set(prev.failedImages)
      failedImages.add(id)
      return { failedImages }
    })
  }

  submitOrder = async () => {
    const { address, items } = this.state
    const userId = this.getUserId()

    if (!address) {
      Taro.showToast({ title: '请选择收货地址', icon: 'error' })
      return
    }

    if (items.length === 0) {
      Taro.showToast({ title: '订单为空', icon: 'error' })
      return
    }

    Taro.showLoading({ title: '提交中...' })

    try {
      const addressInfo = [
        address.recipientName,
        address.recipientPhone,
        address.province || '',
        address.city || '',
        address.district || '',
        address.detailAddress,
      ].join(' ')

      const orderData = {
        userId,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        remark: addressInfo,
      }

      const response = await api.post('/orders', orderData)
      Taro.hideLoading()

      if (response.code === 0 || response.id) {
        // Delete checked cart items from server
        const deletePromises = items.map((item) =>
          api.delete(`/cart/${item.id}`).catch(() => {})
        )
        await Promise.all(deletePromises)

        Taro.showToast({ title: '订单已提交', icon: 'success' })

        const orderId = response.data?.id || response.id || response.data
        setTimeout(() => {
          Taro.redirectTo({
            url: `/pages/order/detail/index?id=${orderId}`,
          })
        }, 1000)
      } else {
        Taro.showToast({
          title: response.message || '提交失败',
          icon: 'error',
        })
      }
    } catch (error) {
      console.error('Order submit failed:', error)
      Taro.hideLoading()
      Taro.showToast({ title: '提交失败', icon: 'error' })
    }
  }

  /* ---------- render ---------- */

  render() {
    const {
      loading,
      address,
      items,
      coupons,
      selectedCoupon,
      showCouponPicker,
      pointsBalance,
      usePoints,
      failedImages,
    } = this.state

    if (loading) {
      return (
        <View className="order-container">
          <View className="order-loading">
            <Text className="order-loading-text">加载中...</Text>
          </View>
        </View>
      )
    }

    const goodsTotal = this.getGoodsTotal()
    const shippingFee = this.getShippingFee()
    const bestDiscount = this.getBestDiscount()
    const pointsOffset = this.getPointsOffset()
    const finalPrice = this.getFinalPrice()

    return (
      <View className="order-container">
        <ScrollView scrollY className="order-content">
          {/* Address Section */}
          <View className="order-section" onClick={this.selectAddress}>
            <View className="address-card">
              {address ? (
                <View className="address-info">
                  <View className="address-header">
                    <Text className="address-name">{address.recipientName}</Text>
                    <Text className="address-phone">{address.recipientPhone}</Text>
                  </View>
                  <Text className="address-detail-text">
                    {address.province || ''}
                    {address.city || ''}
                    {address.district || ''}
                    {address.detailAddress}
                  </Text>
                </View>
              ) : (
                <Text className="address-placeholder">请选择收货地址</Text>
              )}
              <Text className="address-arrow">></Text>
            </View>
          </View>

          {/* Items Section */}
          <View className="order-section">
            <View className="order-section-title">商品清单</View>
            {items.map((item) => {
              const unitPrice = this.getUnitPrice(item)
              return (
                <View key={item.id} className="order-item">
                  {failedImages.has(item.id) || !item.mainImage ? (
                    <View className="order-item-img-fallback">
                      <Text className="fallback-letter">{(item.productName || '?')[0]}</Text>
                    </View>
                  ) : (
                    <Image
                      src={item.mainImage}
                      mode="aspectFill"
                      className="order-item-img"
                      onError={() => this.handleImageError(item.id)}
                    />
                  )}
                  <View className="order-item-info">
                    <Text className="order-item-name">{item.productName}</Text>
                    {item.skuSpecs ? (
                      <Text className="order-item-specs">{item.skuSpecs}</Text>
                    ) : null}
                    <View className="order-item-bottom">
                      <Text className="order-item-price">&yen;{unitPrice.toFixed(2)}</Text>
                      <Text className="order-item-qty">x{item.quantity}</Text>
                    </View>
                  </View>
                </View>
              )
            })}
          </View>

          {/* Coupon Section */}
          <View className="order-section" onClick={this.openCouponPicker}>
            <View className="coupon-row">
              <Text className="coupon-label">优惠券</Text>
              <View style={{ display: 'flex', alignItems: 'center' }}>
                {selectedCoupon ? (
                  <Text className="coupon-value">
                    -&yen;{selectedCoupon.discountAmount.toFixed(2)}
                  </Text>
                ) : (
                  <Text className="coupon-value none">
                    {coupons.length > 0 ? `${coupons.length}张可用` : '暂无可用'}
                  </Text>
                )}
                <Text className="coupon-arrow">></Text>
              </View>
            </View>
          </View>

          {/* Points Section */}
          <View className="order-section">
            <View className="points-row">
              <View style={{ display: 'flex', alignItems: 'center' }}>
                <Text className="points-info">
                  积分抵扣 (可用 {pointsBalance} 积分)
                </Text>
                {pointsBalance > 0 && (
                  <Text className="points-offset">
                    可抵 &yen;{Math.floor(pointsBalance / 100).toFixed(2)}
                  </Text>
                )}
              </View>
              <View
                className={`check-circle ${usePoints ? 'checked' : ''}`}
                style={{ width: 22, height: 22 }}
                onClick={this.togglePoints}
              >
                {usePoints && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 12L10 17L19 7"
                      stroke="#fff"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </View>
            </View>
          </View>

          {/* Price Summary */}
          <View className="order-section">
            <View className="price-row">
              <Text>商品合计</Text>
              <Text className="price-row-value">&yen;{goodsTotal.toFixed(2)}</Text>
            </View>
            <View className="price-row">
              <Text>运费</Text>
              <Text className={`price-row-value ${shippingFee === 0 ? 'green' : ''}`}>
                {shippingFee === 0 ? '免运费' : <Text>&yen;{shippingFee.toFixed(2)}</Text>}
              </Text>
            </View>
            {bestDiscount.amount > 0 && (
              <View className="price-row discount">
                <Text>
                  {bestDiscount.type === 'full' ? '满减优惠' : '优惠券抵扣'}
                </Text>
                <Text className="price-row-value red">
                  -&yen;{bestDiscount.amount.toFixed(2)}
                </Text>
              </View>
            )}
            {pointsOffset > 0 && (
              <View className="price-row discount">
                <Text>积分抵扣</Text>
                <Text className="price-row-value red">
                  -&yen;{pointsOffset.toFixed(2)}
                </Text>
              </View>
            )}
            <View className="price-row total">
              <Text className="price-row-label">应付金额</Text>
              <Text className="price-row-value highlight">
                &yen;{finalPrice.toFixed(2)}
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Fixed Footer */}
        <View className="order-footer">
          <View className="order-footer-total">
            <Text className="order-footer-label">合计:</Text>
            <Text className="order-footer-symbol">&yen;</Text>
            <Text className="order-footer-price">{finalPrice.toFixed(2)}</Text>
          </View>
          <View className="order-submit-btn" onClick={this.submitOrder}>
            <Text className="order-submit-text">提交订单</Text>
          </View>
        </View>

        {/* Coupon Picker Overlay */}
        {showCouponPicker && (
          <View className="coupon-overlay" onClick={this.closeCouponPicker}>
            <View
              className="coupon-picker"
              onClick={(e) => e.stopPropagation()}
            >
              <View className="coupon-picker-header">
                <Text className="coupon-picker-title">选择优惠券</Text>
                <Text className="coupon-picker-close" onClick={this.closeCouponPicker}>
                  关闭
                </Text>
              </View>
              <View className="coupon-picker-list">
                {coupons.length === 0 ? (
                  <View className="coupon-picker-empty">暂无可用优惠券</View>
                ) : (
                  coupons.map((coupon) => {
                    const isSelected = selectedCoupon?.id === coupon.id
                    return (
                      <View
                        key={coupon.id}
                        className="coupon-picker-item"
                        onClick={() => this.selectCoupon(coupon)}
                      >
                        <View className="coupon-picker-item-info">
                          <Text className="coupon-picker-item-name">
                            {coupon.couponName}
                          </Text>
                          <Text className="coupon-picker-item-desc">
                            {coupon.description || `满${coupon.minAmount}可用`}
                          </Text>
                        </View>
                        <Text className="coupon-picker-item-amount">
                          &yen;{coupon.discountAmount}
                        </Text>
                        <View
                          className={`coupon-picker-item-radio ${isSelected ? 'selected' : ''}`}
                        >
                          {isSelected && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                              <path
                                d="M5 12L10 17L19 7"
                                stroke="#fff"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </View>
                      </View>
                    )
                  })
                )}
              </View>
            </View>
          </View>
        )}
      </View>
    )
  }
}
