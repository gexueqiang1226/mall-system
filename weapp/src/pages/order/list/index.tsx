import { Component } from 'react'
import Taro from '@tarojs/taro'
import { getStorage, getUserId } from '@/utils/storage'
import { View, Text, Image, ScrollView } from '@tarojs/components'
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

interface Coupon {
  id: number
  couponName: string
  couponType: string
  discountValue: number
  minAmount: number
  status: number
}

interface CheckoutItem {
  productId: number
  quantity: number
  skuId?: number
  productName?: string
  mainImage?: string
  price?: number
  salePrice?: number
}

interface State {
  addresses: Address[]
  selectedAddress: Address | null
  coupons: Coupon[]
  selectedCoupon: Coupon | null
  pointsBalance: number
  usePoints: boolean
  items: CheckoutItem[]
  remark: string
  showAddressPicker: boolean
  showCouponPicker: boolean
  userId: number
  submitting: boolean
}

export default class OrderList extends Component<{}, State> {
  state: State = {
    addresses: [],
    selectedAddress: null,
    coupons: [],
    selectedCoupon: null,
    pointsBalance: 0,
    usePoints: false,
    items: [],
    remark: '',
    showAddressPicker: false,
    showCouponPicker: false,
    userId: 0,
    submitting: false,
  }

  componentDidMount() {
    const userId = getUserId()
    if (!userId) {
      Taro.redirectTo({ url: '/pages/login/index' })
      return
    }
    const params = Taro.getCurrentInstance().router?.params || {}
    let items: CheckoutItem[] = []
    if (params.fromCart) {
      items = getStorage('CHECKOUT_ITEMS') || []
    } else if (params.productId) {
      items = [{
        productId: Number(params.productId),
        quantity: Number(params.quantity) || 1,
        skuId: params.skuId ? Number(params.skuId) : undefined,
      }]
    }
    this.setState({ userId, items }, () => this.loadData())
  }

  async loadData() {
    const { userId, items } = this.state
    const total = this.calcItemsTotal()
    try {
      const [addrRes, couponRes, pointsRes] = await Promise.all([
        api.get('/addresses', { userId }),
        api.get('/coupons/available', { userId, amount: total }),
        api.get('/points/balance', { userId }),
      ])
      const addresses: Address[] = addrRes?.data || []
      const defaultAddr = addresses.find(a => a.isDefault) || addresses[0] || null
      const coupons: Coupon[] = couponRes?.data || []
      const pointsBalance = pointsRes?.data?.balance || 0

      // 若items只有productId，补充商品信息
      if (items.length > 0 && !items[0].productName) {
        try {
          const enriched = await Promise.all(items.map(async it => {
            const r = await api.get(`/products/${it.productId}`)
            const p = r?.data
            return { ...it, productName: p?.productName, mainImage: p?.mainImage, price: p?.salePrice, salePrice: p?.salePrice }
          }))
          this.setState({ items: enriched })
        } catch {}
      }

      this.setState({ addresses, selectedAddress: defaultAddr, coupons, pointsBalance })
    } catch {
      Taro.showToast({ title: '加载失败', icon: 'none' })
    }
  }

  calcItemsTotal() {
    return this.state.items.reduce((sum, i) => sum + (i.salePrice || i.price || 0) * i.quantity, 0)
  }

  get subtotal() { return this.calcItemsTotal() }
  get freight() { return this.subtotal >= 99 ? 0 : 10 }
  get couponDiscount() { return this.state.selectedCoupon?.discountValue || 0 }
  get pointsDiscount() { return this.state.usePoints ? Math.min(this.state.pointsBalance / 100, this.subtotal * 0.1) : 0 }
  get total() { return Math.max(0, this.subtotal + this.freight - this.couponDiscount - this.pointsDiscount) }

  async submitOrder() {
    const { selectedAddress, selectedCoupon, usePoints, userId, remark, items, submitting } = this.state
    if (!selectedAddress) {
      Taro.showToast({ title: '请选择收货地址', icon: 'none' })
      return
    }
    if (submitting) return
    this.setState({ submitting: true })
    try {
      const body: any = {
        userId,
        addressId: selectedAddress.id,
        items: items.map(i => ({ productId: i.productId, quantity: i.quantity, skuId: i.skuId })),
        remark,
      }
      if (selectedCoupon) body.couponId = selectedCoupon.id
      const res = await api.post('/orders', body)
      const orderId = res?.data?.orderId
      Taro.showToast({ title: '下单成功', icon: 'success' })
      setTimeout(() => {
        Taro.redirectTo({ url: `/pages/order/detail/index?id=${orderId}` })
      }, 1000)
    } catch {
      Taro.showToast({ title: '下单失败', icon: 'none' })
      this.setState({ submitting: false })
    }
  }

  goBack() {
    const pages = Taro.getCurrentPages()
    if (pages.length > 1) {
      Taro.navigateBack()
    } else {
      Taro.switchTab({ url: '/pages/index/index' })
    }
  }

  render() {
    const { selectedAddress, addresses, coupons, selectedCoupon, pointsBalance, usePoints, items, remark, showAddressPicker, showCouponPicker, submitting } = this.state

    return (
      <View className='confirm-page'>
        <View className='detail-nav-bar'>
          <View className='detail-back-btn' onClick={this.goBack.bind(this)}>
            <Text className='detail-back-icon'>‹</Text>
          </View>
          <Text className='detail-nav-title'>我的订单</Text>
        </View>
        <ScrollView className='confirm-scroll' scrollY>
          {/* 收货地址 */}
          <View className='section-card address-card' onClick={() => this.setState({ showAddressPicker: true })}>
            {selectedAddress ? (
              <View className='address-content'>
                <View className='address-main'>
                  <Text className='receiver-name'>{selectedAddress.receiver}</Text>
                  <Text className='receiver-phone'>{selectedAddress.phone}</Text>
                  {selectedAddress.isDefault && <View className='default-tag'>默认</View>}
                </View>
                <Text className='address-detail'>
                  {selectedAddress.province}{selectedAddress.city}{selectedAddress.district}{selectedAddress.detail}
                </Text>
              </View>
            ) : (
              <View className='add-address'>
                <Text className='add-addr-text'>请添加收货地址</Text>
              </View>
            )}
            <Text className='addr-arrow'>&gt;</Text>
          </View>

          {/* 商品清单 */}
          <View className='section-card'>
            <Text className='section-title'>商品清单</Text>
            {items.map((item, i) => (
              <View className='order-item' key={i}>
                <Image className='order-item-img' src={item.mainImage || ''} mode='aspectFill' />
                <View className='order-item-info'>
                  <Text className='order-item-name'>{item.productName || `商品${item.productId}`}</Text>
                  <Text className='order-item-price'>¥{Number(item.salePrice || item.price || 0).toFixed(2)} × {item.quantity}</Text>
                </View>
                <Text className='order-item-total'>
                  ¥{((item.salePrice || item.price || 0) * item.quantity).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>

          {/* 优惠券 */}
          <View className='section-card row-item' onClick={() => this.setState({ showCouponPicker: true })}>
            <Text className='row-label'>优惠券</Text>
            <Text className='row-value'>
              {selectedCoupon ? `-¥${selectedCoupon.discountValue.toFixed(2)}` : (coupons.length > 0 ? `${coupons.length}张可用` : '暂无可用')}
            </Text>
            <Text className='row-arrow'>&gt;</Text>
          </View>

          {/* 积分 */}
          <View className='section-card row-item'>
            <Text className='row-label'>积分抵扣</Text>
            <Text className='row-desc'>({pointsBalance}积分可抵¥{(pointsBalance / 100).toFixed(2)})</Text>
            <View
              className={`toggle-btn ${usePoints ? 'on' : ''}`}
              onClick={() => this.setState({ usePoints: !usePoints })}
            >
              <View className='toggle-circle' />
            </View>
          </View>

          {/* 运费 */}
          <View className='section-card row-item'>
            <Text className='row-label'>运费</Text>
            <Text className='row-value freight-val'>
              {this.freight === 0 ? '免运费' : `¥${this.freight.toFixed(2)}`}
            </Text>
          </View>

          {/* 备注 */}
          <View className='section-card'>
            <Text className='row-label'>备注</Text>
            <input
              className='remark-input'
              placeholder='选填：对本次交易的说明'
              value={remark}
              onInput={(e: any) => this.setState({ remark: e.detail.value })}
            />
          </View>

          {/* 价格明细 */}
          <View className='section-card price-detail'>
            <Text className='section-title'>价格明细</Text>
            <View className='price-row-item'>
              <Text>商品合计</Text>
              <Text>¥{this.subtotal.toFixed(2)}</Text>
            </View>
            <View className='price-row-item'>
              <Text>运费</Text>
              <Text>{this.freight === 0 ? '免运费' : `¥${this.freight.toFixed(2)}`}</Text>
            </View>
            {this.couponDiscount > 0 && (
              <View className='price-row-item discount'>
                <Text>优惠券</Text>
                <Text>-¥{this.couponDiscount.toFixed(2)}</Text>
              </View>
            )}
            {this.pointsDiscount > 0 && (
              <View className='price-row-item discount'>
                <Text>积分抵扣</Text>
                <Text>-¥{this.pointsDiscount.toFixed(2)}</Text>
              </View>
            )}
            <View className='price-row-item total-row'>
              <Text>实付金额</Text>
              <Text className='total-amount'>¥{this.total.toFixed(2)}</Text>
            </View>
          </View>

          <View style={{ height: '80px' }} />
        </ScrollView>

        {/* 提交按钮 */}
        <View className='submit-bar'>
          <View className='submit-total'>
            <Text className='submit-label'>实付：</Text>
            <Text className='submit-price'>¥{this.total.toFixed(2)}</Text>
          </View>
          <View
            className={`submit-btn ${submitting ? 'disabled' : ''}`}
            onClick={this.submitOrder.bind(this)}
          >
            <Text>{submitting ? '提交中...' : '提交订单'}</Text>
          </View>
        </View>

        {/* 地址选择弹窗 */}
        {showAddressPicker && (
          <View className='picker-overlay' onClick={() => this.setState({ showAddressPicker: false })}>
            <View className='picker-panel' onClick={e => e.stopPropagation()}>
              <View className='picker-header'>
                <Text className='picker-title'>选择收货地址</Text>
                <Text className='picker-close' onClick={() => this.setState({ showAddressPicker: false })}>✕</Text>
              </View>
              <ScrollView scrollY className='picker-list'>
                {addresses.map(addr => (
                  <View
                    key={addr.id}
                    className={`addr-option ${selectedAddress?.id === addr.id ? 'selected' : ''}`}
                    onClick={() => this.setState({ selectedAddress: addr, showAddressPicker: false })}
                  >
                    <View className='addr-option-top'>
                      <Text className='addr-name'>{addr.receiver} {addr.phone}</Text>
                      {addr.isDefault && <View className='default-tag'>默认</View>}
                    </View>
                    <Text className='addr-full'>{addr.province}{addr.city}{addr.district}{addr.detail}</Text>
                  </View>
                ))}
                <View
                  className='add-addr-btn'
                  onClick={() => { this.setState({ showAddressPicker: false }); Taro.navigateTo({ url: '/pages/address-form/index' }) }}
                >
                  <Text>+ 新增地址</Text>
                </View>
              </ScrollView>
            </View>
          </View>
        )}

        {/* 优惠券选择弹窗 */}
        {showCouponPicker && (
          <View className='picker-overlay' onClick={() => this.setState({ showCouponPicker: false })}>
            <View className='picker-panel' onClick={e => e.stopPropagation()}>
              <View className='picker-header'>
                <Text className='picker-title'>选择优惠券</Text>
                <Text className='picker-close' onClick={() => this.setState({ showCouponPicker: false })}>✕</Text>
              </View>
              <ScrollView scrollY className='picker-list'>
                <View
                  className={`coupon-option ${!selectedCoupon ? 'selected' : ''}`}
                  onClick={() => this.setState({ selectedCoupon: null, showCouponPicker: false })}
                >
                  <Text>不使用优惠券</Text>
                </View>
                {coupons.map(c => (
                  <View
                    key={c.id}
                    className={`coupon-option ${selectedCoupon?.id === c.id ? 'selected' : ''}`}
                    onClick={() => this.setState({ selectedCoupon: c, showCouponPicker: false })}
                  >
                    <View className='coupon-card-inner'>
                      <Text className='coupon-value'>¥{c.discountValue}</Text>
                      <View className='coupon-info'>
                        <Text className='coupon-name'>{c.couponName}</Text>
                        <Text className='coupon-condition'>满{c.minAmount}元可用</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        )}
      </View>
    )
  }
}
