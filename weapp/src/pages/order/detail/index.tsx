import { Component } from 'react'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.css'
import api from '@/services/api'

interface OrderItem {
  id: number
  productId: number
  productName: string
  productImage?: string
  skuSpec?: string
  quantity: number
  price: number
  totalAmount: number
}

interface OrderData {
  id: number
  orderNo: string
  userId: number
  totalAmount: number
  goodsAmount: number
  shippingFee: number
  discountAmount: number
  status: number
  paymentMethod: string
  createTime: string
  paymentTime: string
  shippingTime: string
  receiveTime: string
  cancelTime: string
  refundTime: string
  remark: string
  receiverName: string
  receiverPhone: string
  receiverAddress: string
  orderItems: OrderItem[]
}

interface OrderDetailState {
  order: OrderData | null
  loading: boolean
}

const STATUS_MAP: Record<number, { label: string; color: string }> = {
  0: { label: '待付款', color: 'red' },
  1: { label: '已付款', color: 'green' },
  2: { label: '已发货', color: 'blue' },
  3: { label: '已完成', color: 'gray' },
  4: { label: '已取消', color: 'gray' },
  5: { label: '退款中', color: 'orange' },
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

  handleCancel = () => {
    Taro.showModal({
      title: '提示',
      content: '确定要取消此订单吗？',
      confirmColor: '#E53935',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.post(`/orders/${this.orderId}/cancel`)
            Taro.showToast({ title: '订单已取消', icon: 'success' })
            this.loadOrder()
          } catch (error) {
            Taro.showToast({ title: '取消失败', icon: 'error' })
          }
        }
      },
    })
  }

  handlePay = () => {
    Taro.showModal({
      title: '确认支付',
      content: '确认支付此订单？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.post(`/orders/${this.orderId}/pay-confirm`)
            Taro.showToast({ title: '支付成功', icon: 'success' })
            this.loadOrder()
          } catch (error) {
            Taro.showToast({ title: '支付失败', icon: 'error' })
          }
        }
      },
    })
  }

  handleReceive = () => {
    Taro.showModal({
      title: '确认收货',
      content: '确认已收到货物？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.post(`/orders/${this.orderId}/receive`)
            Taro.showToast({ title: '已确认收货', icon: 'success' })
            this.loadOrder()
          } catch (error) {
            Taro.showToast({ title: '操作失败', icon: 'error' })
          }
        }
      },
    })
  }

  handleRefund = () => {
    Taro.showModal({
      title: '申请退款',
      content: '确定要申请退款吗？',
      confirmColor: '#FF6B35',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.put(`/admin/api/orders/${this.orderId}/refund`)
            Taro.showToast({ title: '退款申请已提交', icon: 'success' })
            this.loadOrder()
          } catch (error) {
            Taro.showToast({ title: '申请失败', icon: 'error' })
          }
        }
      },
    })
  }

  handleReview = () => {
    Taro.showToast({ title: '评价功能开发中', icon: 'none' })
  }

  goBack = () => {
    Taro.navigateBack()
  }

  goToHome = () => {
    Taro.switchTab({ url: '/pages/index/index' })
  }

  formatTime = (timeStr: string) => {
    if (!timeStr) return ''
    return timeStr.replace('T', ' ').substring(0, 19)
  }

  renderTimeline = () => {
    const { order } = this.state
    if (!order) return null

    const steps = [
      { label: '下单', time: order.createTime, done: true },
      { label: '付款', time: order.paymentTime, done: order.status >= 1 && order.status !== 4 },
      { label: '发货', time: order.shippingTime, done: order.status >= 2 && order.status !== 4 },
      { label: '完成', time: order.receiveTime, done: order.status >= 3 },
    ]

    return (
      <View className="timeline-section">
        <Text className="section-title">订单状态</Text>
        <View className="timeline-list">
          {steps.map((step, index) => (
            <View key={index} className="timeline-item">
              <View className="timeline-left">
                <View className={`timeline-dot ${step.done ? 'dot-done' : 'dot-pending'}`} />
                {index < steps.length - 1 && (
                  <View className={`timeline-line ${step.done ? 'line-done' : 'line-pending'}`} />
                )}
              </View>
              <View className="timeline-right">
                <Text className={`timeline-label ${step.done ? 'label-done' : 'label-pending'}`}>
                  {step.label}
                </Text>
                {step.time && (
                  <Text className="timeline-time">{this.formatTime(step.time)}</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      </View>
    )
  }

  renderActions = () => {
    const { order } = this.state
    if (!order) return null

    return (
      <View className="actions-bar">
        {order.status === 0 && (
          <>
            <View className="action-btn btn-cancel-outline" onClick={this.handleCancel}>
              <Text className="action-btn-text cancel-text">取消订单</Text>
            </View>
            <View className="action-btn btn-pay-solid" onClick={this.handlePay}>
              <Text className="action-btn-text pay-text">立即支付</Text>
            </View>
          </>
        )}
        {order.status === 2 && (
          <View className="action-btn btn-confirm-solid" onClick={this.handleReceive}>
            <Text className="action-btn-text confirm-text">确认收货</Text>
          </View>
        )}
        {order.status === 3 && (
          <>
            <View className="action-btn btn-review-outline" onClick={this.handleReview}>
              <Text className="action-btn-text review-text">评价</Text>
            </View>
            <View className="action-btn btn-refund-outline" onClick={this.handleRefund}>
              <Text className="action-btn-text refund-text">申请退款</Text>
            </View>
          </>
        )}
        {order.status === 5 && (
          <View className="action-btn btn-refund-processing">
            <Text className="action-btn-text processing-text">退款处理中</Text>
          </View>
        )}
        <View className="action-btn btn-back-outline" onClick={this.goBack}>
          <Text className="action-btn-text back-text">返回</Text>
        </View>
      </View>
    )
  }

  render() {
    const { order, loading } = this.state

    if (loading) {
      return (
        <View className="detail-page">
          <View className="loading-wrap">
            <View className="loading-spinner" />
            <Text className="loading-text">加载中...</Text>
          </View>
        </View>
      )
    }

    if (!order) {
      return (
        <View className="detail-page">
          <View className="nav-bar">
            <View className="nav-back" onClick={this.goBack}>
              <Text className="nav-back-icon">&lt;</Text>
              <Text className="nav-back-label">返回</Text>
            </View>
            <Text className="nav-title">订单详情</Text>
            <View className="nav-placeholder" />
          </View>
          <View className="empty-state">
            <Text className="empty-text">订单不存在</Text>
            <View className="action-btn btn-back-outline empty-btn" onClick={this.goToHome}>
              <Text className="action-btn-text back-text">返回首页</Text>
            </View>
          </View>
        </View>
      )
    }

    const statusInfo = STATUS_MAP[order.status] || { label: '未知', color: 'gray' }

    return (
      <View className="detail-page">
        {/* Navigation Bar */}
        <View className="nav-bar">
          <View className="nav-back" onClick={this.goBack}>
            <Text className="nav-back-icon">&lt;</Text>
            <Text className="nav-back-label">返回</Text>
          </View>
          <Text className="nav-title">订单详情</Text>
          <View className="nav-placeholder" />
        </View>

        <ScrollView scrollY className="detail-scroll">
          {/* Status Header */}
          <View className={`status-header status-${statusInfo.color}`}>
            <Text className="status-label">{statusInfo.label}</Text>
            <Text className="status-order-no">订单号: {order.orderNo}</Text>
          </View>

          {/* Receiver Info */}
          {(order.receiverName || order.receiverAddress) && (
            <View className="receiver-section">
              <View className="receiver-row">
                <Text className="receiver-icon">&#x1F4CD;</Text>
                <View className="receiver-info">
                  <View className="receiver-name-row">
                    <Text className="receiver-name">{order.receiverName}</Text>
                    <Text className="receiver-phone">{order.receiverPhone}</Text>
                  </View>
                  <Text className="receiver-address">{order.receiverAddress}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Items List */}
          {order.orderItems && order.orderItems.length > 0 && (
            <View className="items-section">
              <Text className="section-title">商品明细</Text>
              {order.orderItems.map((item) => (
                <View key={item.id} className="item-card">
                  <View className="item-image-wrap">
                    {item.productImage ? (
                      <Image className="item-image" src={item.productImage} mode="aspectFill" />
                    ) : (
                      <View className="item-image-placeholder">
                        <Text className="item-image-text">商</Text>
                      </View>
                    )}
                  </View>
                  <View className="item-info">
                    <Text className="item-name">{item.productName}</Text>
                    {item.skuSpec && (
                      <Text className="item-spec">{item.skuSpec}</Text>
                    )}
                    <View className="item-price-row">
                      <Text className="item-price">¥{item.price.toFixed(2)}</Text>
                      <Text className="item-qty">x{item.quantity}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Price Summary */}
          <View className="price-section">
            <Text className="section-title">价格明细</Text>
            <View className="price-row">
              <Text className="price-label">商品总额</Text>
              <Text className="price-value">¥{(order.goodsAmount || order.totalAmount).toFixed(2)}</Text>
            </View>
            <View className="price-row">
              <Text className="price-label">运费</Text>
              <Text className="price-value">¥{(order.shippingFee || 0).toFixed(2)}</Text>
            </View>
            {(order.discountAmount && order.discountAmount > 0) && (
              <View className="price-row">
                <Text className="price-label">优惠减免</Text>
                <Text className="price-value discount">-¥{order.discountAmount.toFixed(2)}</Text>
              </View>
            )}
            <View className="price-row total-row">
              <Text className="price-label-total">实付金额</Text>
              <Text className="price-value-total">¥{order.totalAmount.toFixed(2)}</Text>
            </View>
          </View>

          {/* Order Info */}
          <View className="order-info-section">
            <Text className="section-title">订单信息</Text>
            <View className="info-row">
              <Text className="info-label">订单编号</Text>
              <Text className="info-value">{order.orderNo}</Text>
            </View>
            <View className="info-row">
              <Text className="info-label">下单时间</Text>
              <Text className="info-value">{this.formatTime(order.createTime)}</Text>
            </View>
            {order.paymentTime && (
              <View className="info-row">
                <Text className="info-label">付款时间</Text>
                <Text className="info-value">{this.formatTime(order.paymentTime)}</Text>
              </View>
            )}
            {order.shippingTime && (
              <View className="info-row">
                <Text className="info-label">发货时间</Text>
                <Text className="info-value">{this.formatTime(order.shippingTime)}</Text>
              </View>
            )}
            {order.receiveTime && (
              <View className="info-row">
                <Text className="info-label">收货时间</Text>
                <Text className="info-value">{this.formatTime(order.receiveTime)}</Text>
              </View>
            )}
            {order.paymentMethod && (
              <View className="info-row">
                <Text className="info-label">支付方式</Text>
                <Text className="info-value">
                  {order.paymentMethod === 'wechat' ? '微信支付' : order.paymentMethod === 'alipay' ? '支付宝' : order.paymentMethod}
                </Text>
              </View>
            )}
            {order.remark && (
              <View className="info-row">
                <Text className="info-label">备注</Text>
                <Text className="info-value">{order.remark}</Text>
              </View>
            )}
          </View>

          {/* Status Timeline */}
          {this.renderTimeline()}

          {/* Spacer for actions bar */}
          <View className="bottom-spacer" />
        </ScrollView>

        {/* Actions Bar */}
        {this.renderActions()}
      </View>
    )
  }
}
