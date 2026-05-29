import { Component } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import api from '@/services/api'
import './index.css'

interface OrderItem {
  productId: number
  productName: string
  productImage: string
  quantity: number
  price: number
  totalAmount: number
}

interface Order {
  id: number
  orderNo: string
  userId: number
  totalAmount: number
  payAmount: number
  discountAmount: number
  freightAmount: number
  status: number
  addressSnapshot: string
  remark: string
  createTime: string
  payTime: string
  shipTime: string
  receiveTime: string
  items: OrderItem[]
}

interface AddressSnapshot {
  receiver?: string
  phone?: string
  province?: string
  city?: string
  district?: string
  detail?: string
}

const STATUS_MAP: Record<number, { label: string; icon: string; color: string }> = {
  0: { label: '待付款', icon: '⏳', color: '#FF6B35' },
  1: { label: '待发货', icon: '✅', color: '#0056B3' },
  2: { label: '已发货', icon: '🚚', color: '#0056B3' },
  3: { label: '已完成', icon: '🎉', color: '#52c41a' },
  4: { label: '已取消', icon: '❌', color: '#999' },
  5: { label: '已退款', icon: '💰', color: '#999' },
}

interface State {
  order: Order | null
  loading: boolean
}

export default class OrderDetail extends Component<{}, State> {
  state: State = {
    order: null,
    loading: true,
  }

  componentDidMount() {
    const params = Taro.getCurrentInstance().router?.params || {}
    const id = Number(params.id)
    if (id) this.loadOrder(id)
  }

  async loadOrder(id: number) {
    try {
      const res = await api.get(`/orders/${id}`)
      const order: Order = res?.data
      this.setState({ order, loading: false })
    } catch {
      Taro.showToast({ title: '加载失败', icon: 'none' })
      this.setState({ loading: false })
    }
  }

  getAddress(): AddressSnapshot {
    const { order } = this.state
    if (!order) return {}
    try {
      return JSON.parse(order.addressSnapshot || '{}')
    } catch { return {} }
  }

  async handleAction(action: string) {
    const { order } = this.state
    if (!order) return
    Taro.showLoading({ title: '处理中...' })
    try {
      await api.post(`/orders/${order.id}/${action}`)
      Taro.hideLoading()
      Taro.showToast({ title: '操作成功', icon: 'success' })
      setTimeout(() => this.loadOrder(order.id), 1000)
    } catch {
      Taro.hideLoading()
      Taro.showToast({ title: '操作失败', icon: 'none' })
    }
  }

  copyOrderNo() {
    const { order } = this.state
    if (!order) return
    Taro.setClipboardData({ data: order.orderNo }).then(() => {
      Taro.showToast({ title: '已复制', icon: 'success' })
    })
  }

  render() {
    const { order, loading } = this.state
    if (loading) return <View className='loading-page'><Text>加载中...</Text></View>
    if (!order) return <View className='loading-page'><Text>订单不存在</Text></View>

    const statusInfo = STATUS_MAP[order.status] || STATUS_MAP[0]
    const addr = this.getAddress()
    const freight = order.freightAmount || 0
    const discount = order.discountAmount || 0

    return (
      <View className='order-detail-page'>
        <ScrollView className='detail-scroll' scrollY>
          {/* 状态卡片 */}
          <View className='status-card'>
            <Text className='status-icon'>{statusInfo.icon}</Text>
            <Text className='status-label' style={{ color: statusInfo.color }}>{statusInfo.label}</Text>
            {order.status === 0 && (
              <Text className='status-hint'>请在30分钟内完成支付</Text>
            )}
            <View className='status-actions'>
              {order.status === 0 && (
                <View className='action-btn primary' onClick={() => this.handleAction('pay-confirm')}>
                  <Text>立即付款</Text>
                </View>
              )}
              {order.status === 2 && (
                <View className='action-btn primary' onClick={() => this.handleAction('receive')}>
                  <Text>确认收货</Text>
                </View>
              )}
              {order.status === 0 && (
                <View className='action-btn' onClick={() => this.handleAction('cancel')}>
                  <Text>取消订单</Text>
                </View>
              )}
            </View>
          </View>

          {/* 物流（已发货时） */}
          {order.status === 2 && (
            <View className='section-card'>
              <Text className='section-title'>物流信息</Text>
              <View className='logistics-timeline'>
                <View className='logistics-item active'>
                  <View className='logistics-dot' />
                  <View className='logistics-content'>
                    <Text className='logistics-event'>快件已发出，正在配送中</Text>
                    <Text className='logistics-time'>{order.shipTime}</Text>
                  </View>
                </View>
                <View className='logistics-item'>
                  <View className='logistics-dot' />
                  <View className='logistics-content'>
                    <Text className='logistics-event'>商家已发货</Text>
                    <Text className='logistics-time'>{order.shipTime}</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* 收货地址 */}
          <View className='section-card'>
            <Text className='section-title'>收货信息</Text>
            <View className='addr-info'>
              <View className='addr-top'>
                <Text className='addr-receiver'>{addr.receiver}</Text>
                <Text className='addr-phone'>{addr.phone}</Text>
              </View>
              <Text className='addr-full'>
                {addr.province}{addr.city}{addr.district}{addr.detail}
              </Text>
            </View>
          </View>

          {/* 商品清单 */}
          <View className='section-card'>
            <Text className='section-title'>商品清单</Text>
            {(order.items || []).map((item, i) => (
              <View className='order-item' key={i}>
                <Image className='order-item-img' src={item.productImage} mode='aspectFill' />
                <View className='order-item-info'>
                  <Text className='order-item-name'>{item.productName}</Text>
                  <Text className='order-item-price'>¥{Number(item.price).toFixed(2)} × {item.quantity}</Text>
                </View>
                <Text className='order-item-subtotal'>¥{Number(item.totalAmount).toFixed(2)}</Text>
              </View>
            ))}
          </View>

          {/* 价格明细 */}
          <View className='section-card'>
            <Text className='section-title'>价格明细</Text>
            <View className='price-row'>
              <Text>商品合计</Text>
              <Text>¥{Number(order.totalAmount).toFixed(2)}</Text>
            </View>
            <View className='price-row'>
              <Text>运费</Text>
              <Text>{freight === 0 ? '免运费' : `¥${freight.toFixed(2)}`}</Text>
            </View>
            {discount > 0 && (
              <View className='price-row discount'>
                <Text>优惠</Text>
                <Text>-¥{discount.toFixed(2)}</Text>
              </View>
            )}
            <View className='price-row total-row'>
              <Text>实付金额</Text>
              <Text className='pay-amount'>¥{Number(order.payAmount).toFixed(2)}</Text>
            </View>
          </View>

          {/* 订单信息 */}
          <View className='section-card'>
            <Text className='section-title'>订单信息</Text>
            <View className='info-row'>
              <Text className='info-label'>订单号</Text>
              <Text className='info-value order-no' onClick={this.copyOrderNo.bind(this)}>
                {order.orderNo} 复制
              </Text>
            </View>
            <View className='info-row'>
              <Text className='info-label'>下单时间</Text>
              <Text className='info-value'>{order.createTime}</Text>
            </View>
            {order.payTime && (
              <View className='info-row'>
                <Text className='info-label'>支付时间</Text>
                <Text className='info-value'>{order.payTime}</Text>
              </View>
            )}
            {order.remark && (
              <View className='info-row'>
                <Text className='info-label'>备注</Text>
                <Text className='info-value'>{order.remark}</Text>
              </View>
            )}
          </View>

          <View style={{ height: '24px' }} />
        </ScrollView>
      </View>
    )
  }
}
