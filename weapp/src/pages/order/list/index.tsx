import { Component } from 'react'
import { View, Text, Image, Button, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.css'
import api from '@/services/api'

interface OrderItem {
  productId: number
  productName: string
  mainImage: string
  salePrice: number
  quantity: number
}

interface OrderListState {
  items: OrderItem[]
  totalPrice: number
  recipientName: string
  recipientPhone: string
  address: string
  paymentMethod: string
}

export default class OrderList extends Component<{}, OrderListState> {
  constructor(props) {
    super(props)
    this.state = {
      items: [],
      totalPrice: 0,
      recipientName: '',
      recipientPhone: '',
      address: '请选择收货地址',
      paymentMethod: 'wechat',
    }
  }

  componentDidMount() {
    this.loadOrderData()
  }

  loadOrderData = () => {
    const tempOrder = Taro.getStorageSync('TEMP_ORDER')
    if (tempOrder) {
      this.setState({
        items: tempOrder.items || [],
        totalPrice: tempOrder.totalPrice || 0,
      })
    }
  }

  handleNameChange = (e) => {
    this.setState({ recipientName: e.detail.value })
  }

  handlePhoneChange = (e) => {
    this.setState({ recipientPhone: e.detail.value })
  }

  selectAddress = () => {
    Taro.chooseAddress({
      success: (res) => {
        const fullAddress = `${res.provinceName}${res.cityName}${res.countyName}${res.detailInfo}`
        this.setState({
          address: fullAddress,
          recipientName: res.userName,
          recipientPhone: res.telNumber,
        })
      },
    })
  }

  submitOrder = async () => {
    const { items, recipientName, recipientPhone, address, paymentMethod } = this.state

    if (!recipientName || !recipientPhone || address === '请选择收货地址') {
      Taro.showToast({ title: '请完善收货信息', icon: 'error' })
      return
    }

    if (items.length === 0) {
      Taro.showToast({ title: '订单为空', icon: 'error' })
      return
    }

    const userInfo = Taro.getStorageSync('USER_INFO')
    if (!userInfo || !userInfo.userId) {
      Taro.showToast({ title: '请先登录', icon: 'error' })
      setTimeout(() => {
        Taro.switchTab({ url: '/pages/user/index' })
      }, 1000)
      return
    }

    Taro.showLoading({ title: '提交中...' })

    try {
      const orderData = {
        userId: userInfo.userId,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        paymentMethod,
        remark: `${recipientName} ${recipientPhone} ${address}`,
      }

      const response = await api.post('/orders', orderData)

      Taro.hideLoading()

      if (response.code === 0) {
        Taro.showToast({ title: '订单已提交', icon: 'success' })

        Taro.setStorageSync('CART', [])
        Taro.removeStorageSync('TEMP_ORDER')

        const orderId = response.data?.id
        setTimeout(() => {
          Taro.navigateTo({
            url: `/pages/order/detail/index?id=${orderId}`,
          })
        }, 1000)
      } else {
        Taro.showToast({ title: response.message || '提交失败', icon: 'error' })
      }
    } catch (error) {
      console.error('订单提交失败:', error)
      Taro.hideLoading()
      Taro.showToast({ title: '提交失败', icon: 'error' })
    }
  }

  render() {
    const { items, totalPrice, recipientName, recipientPhone, address, paymentMethod } = this.state

    return (
      <View className="order-container">
        <ScrollView scrollY className="order-content">
          <View className="address-section">
            <View className="section-title">收货地址</View>
            <View className="address-card" onClick={this.selectAddress}>
              {address !== '请选择收货地址' && (
                <View className="address-detail">
                  <View className="address-header">
                    <Text className="recipient-name">{recipientName}</Text>
                    <Text className="recipient-phone">{recipientPhone}</Text>
                  </View>
                  <Text className="address-text">{address}</Text>
                </View>
              )}
              {address === '请选择收货地址' && (
                <Text className="address-placeholder">{address}</Text>
              )}
              <Text className="address-arrow">></Text>
            </View>
          </View>

          <View className="items-section">
            <View className="section-title">订单商品</View>
            {items.map((item) => (
              <View key={item.productId} className="order-item">
                <Image src={item.mainImage} className="item-image" />
                <View className="item-details">
                  <Text className="item-name">{item.productName}</Text>
                  <Text className="item-price">¥{item.salePrice}</Text>
                </View>
                <Text className="item-quantity">x{item.quantity}</Text>
              </View>
            ))}
          </View>

          <View className="shipping-section">
            <View className="section-title">配送方式</View>
            <View className="shipping-method">
              <Text>标准配送</Text>
              <Text className="shipping-price">免费</Text>
            </View>
          </View>

          <View className="payment-section">
            <View className="section-title">支付方式</View>
            <View className="payment-methods">
              <View
                className={`payment-method ${paymentMethod === 'wechat' ? 'active' : ''}`}
                onClick={() => this.setState({ paymentMethod: 'wechat' })}
              >
                <Text>微信支付</Text>
              </View>
              <View
                className={`payment-method ${paymentMethod === 'alipay' ? 'active' : ''}`}
                onClick={() => this.setState({ paymentMethod: 'alipay' })}
              >
                <Text>支付宝</Text>
              </View>
            </View>
          </View>

          <View className="price-detail">
            <View className="price-row">
              <Text>小计:</Text>
              <Text>¥{totalPrice.toFixed(2)}</Text>
            </View>
            <View className="price-row">
              <Text>运费:</Text>
              <Text>¥0.00</Text>
            </View>
            <View className="price-row total">
              <Text>应付:</Text>
              <Text>¥{totalPrice.toFixed(2)}</Text>
            </View>
          </View>
        </ScrollView>

        <View className="order-footer">
          <Button className="btn-submit" onClick={this.submitOrder}>
            提交订单
          </Button>
        </View>
      </View>
    )
  }
}
