import { Component } from 'react'
import { View, Text, Button, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.css'
import api from '@/services/api'

interface OrderItem {
  id: number
  productId: number
  productName: string
  quantity: number
  price: number
  totalAmount: number
}

interface OrderData {
  id: number
  orderNo: string
  userId: number
  totalAmount: number
  status: number
  paymentMethod: string
  createTime: string
  paymentTime: string
  shippingTime: string
  receiveTime: string
  remark: string
  orderItems: OrderItem[]
}

interface OrderDetailState {
  order: OrderData | null
  loading: boolean
}

const STATUS_MAP: Record<number, string> = {
  0: '待支付',
  1: '已支付',
  2: '已发货',
  3: '已收货',
  4: '已取消',
  5: '已退货',
}

export default class OrderDetail extends Component<{}, OrderDetailState> {
  private orderId: string = ''

  constructor(props) {
    super(props)
    this.state = {
      order: null,
      loading: true,
    }
  }

  componentDidMount() {
    const pages = Taro.getCurrentPages()
    const currentPage = pages[pages.length - 1]
    const { id } = currentPage.options as any
    this.orderId = id
    this.loadOrder()
  }

  loadOrder = async () => {
    try {
      const response = await api.get(`/orders/${this.orderId}`)
      this.setState({
        order: response.data,
        loading: false,
      })
    } catch (error) {
      console.error('加载订单失败:', error)
      this.setState({ loading: false })
    }
  }

  handlePayConfirm = async () => {
    try {
      await api.post(`/orders/${this.orderId}/pay-confirm`)
      Taro.showToast({ title: '支付成功', icon: 'success' })
      this.loadOrder()
    } catch (error) {
      Taro.showToast({ title: '支付失败', icon: 'error' })
    }
  }

  handleCancel = async () => {
    Taro.showModal({
      title: '提示',
      content: '确定取消此订单？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.post(`/orders/${this.orderId}/cancel`)
            Taro.showToast({ title: '已取消', icon: 'success' })
            this.loadOrder()
          } catch (error) {
            Taro.showToast({ title: '取消失败', icon: 'error' })
          }
        }
      },
    })
  }

  handleReceive = async () => {
    try {
      await api.post(`/orders/${this.orderId}/receive`)
      Taro.showToast({ title: '已确认收货', icon: 'success' })
      this.loadOrder()
    } catch (error) {
      Taro.showToast({ title: '操作失败', icon: 'error' })
    }
  }

  goToHome = () => {
    Taro.switchTab({ url: '/pages/index/index' })
  }

  render() {
    const { order, loading } = this.state

    if (loading) {
      return (
        <View className="detail-container">
          <Text>加载中...</Text>
        </View>
      )
    }

    if (!order) {
      return (
        <View className="detail-container">
          <Text>订单不存在</Text>
          <Button className="btn-home" onClick={this.goToHome}>返回首页</Button>
        </View>
      )
    }

    const statusText = STATUS_MAP[order.status] || '未知'

    return (
      <View className="detail-container">
        <ScrollView scrollY className="detail-scroll">
          <View className="order-status-section">
            <Text className="status-icon">
              {order.status === 0 ? '💳' : order.status === 1 ? '✅' : order.status === 2 ? '🚚' : order.status === 3 ? '📦' : order.status === 4 ? '❌' : '↩️'}
            </Text>
            <Text className="status-text">{statusText}</Text>
            <Text className="order-number">订单号: {order.orderNo}</Text>
          </View>

          <View className="info-section">
            <View className="info-row">
              <Text className="info-label">总金额:</Text>
              <Text className="info-value price">¥{order.totalAmount}</Text>
            </View>
            <View className="info-row">
              <Text className="info-label">支付方式:</Text>
              <Text className="info-value">{order.paymentMethod === 'wechat' ? '微信支付' : order.paymentMethod === 'alipay' ? '支付宝' : '-'}</Text>
            </View>
            <View className="info-row">
              <Text className="info-label">创建时间:</Text>
              <Text className="info-value">{order.createTime}</Text>
            </View>
            {order.paymentTime && (
              <View className="info-row">
                <Text className="info-label">支付时间:</Text>
                <Text className="info-value">{order.paymentTime}</Text>
              </View>
            )}
            {order.remark && (
              <View className="info-row">
                <Text className="info-label">备注:</Text>
                <Text className="info-value">{order.remark}</Text>
              </View>
            )}
          </View>

          {order.orderItems && order.orderItems.length > 0 && (
            <View className="items-section">
              <Text className="section-title">商品明细</Text>
              {order.orderItems.map((item) => (
                <View key={item.id} className="item-row">
                  <Text className="item-name">{item.productName}</Text>
                  <Text className="item-qty">x{item.quantity}</Text>
                  <Text className="item-price">¥{item.totalAmount}</Text>
                </View>
              ))}
            </View>
          )}

          <View className="actions-section">
            {order.status === 0 && (
              <>
                <Button className="btn btn-pay" onClick={this.handlePayConfirm}>确认支付</Button>
                <Button className="btn btn-cancel" onClick={this.handleCancel}>取消订单</Button>
              </>
            )}
            {order.status === 2 && (
              <Button className="btn btn-receive" onClick={this.handleReceive}>确认收货</Button>
            )}
            <Button className="btn btn-home" onClick={this.goToHome}>返回首页</Button>
          </View>
        </ScrollView>
      </View>
    )
  }
}
