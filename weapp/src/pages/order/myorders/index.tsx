import { Component } from 'react'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.css'
import api from '@/services/api'

interface OrderItem {
  id: number
  productId: number
  productName: string
  productImage: string
  quantity: number
  price: number
  skuSpecs: string
}

interface Order {
  id: number
  orderNo: string
  totalAmount: number
  status: number
  createTime: string
  items: OrderItem[]
}

interface MyOrdersState {
  orders: Order[]
  activeTab: string
  loading: boolean
  page: number
  hasMore: boolean
}

const STATUS_TABS = [
  { label: '全部', value: '' },
  { label: '待付款', value: 'PENDING' },
  { label: '待发货', value: 'PAID' },
  { label: '待收货', value: 'SHIPPED' },
  { label: '已完成', value: 'COMPLETED' },
]

const STATUS_MAP: Record<string, string> = {
  0: '待付款', 1: '待发货', 2: '待收货', 3: '已完成', 4: '已取消', 5: '退款中',
  PENDING: '待付款', PAID: '待发货', SHIPPED: '待收货', COMPLETED: '已完成', CANCELLED: '已取消', REFUND: '退款中',
}

const STATUS_CLASS: Record<string, string> = {
  0: 'pending', 1: 'paid', 2: 'shipped', 3: 'completed', 4: 'cancelled', 5: 'refunding',
  PENDING: 'pending', PAID: 'paid', SHIPPED: 'shipped', COMPLETED: 'completed', CANCELLED: 'cancelled', REFUND: 'refunding',
}

export default class MyOrders extends Component<{}, MyOrdersState> {
  constructor(props) {
    super(props)
    this.state = { orders: [], activeTab: '', loading: false, page: 1, hasMore: true }
  }

  componentDidMount() { this.loadOrders() }

  loadOrders = async () => {
    const userInfo = Taro.getStorageSync('USER_INFO')
    if (!userInfo?.userId) { Taro.showToast({ title: '请先登录', icon: 'error' }); return }
    const { activeTab, page, loading, hasMore } = this.state
    if (loading || !hasMore) return
    this.setState({ loading: true })
    try {
      const params: any = { userId: userInfo.userId, page, size: 10 }
      if (activeTab) params.status = activeTab
      const response = await api.get('/orders', params)
      const newOrders = response.data?.records || []
      this.setState({
        orders: page === 1 ? newOrders : [...this.state.orders, ...newOrders],
        hasMore: newOrders.length >= 10, loading: false,
      })
    } catch { this.setState({ loading: false }) }
  }

  switchTab = (tab: string) => {
    this.setState({ activeTab: tab, page: 1, orders: [], hasMore: true }, () => this.loadOrders())
  }

  goToDetail = (orderId: number) => Taro.navigateTo({ url: `/pages/order/detail/index?id=${orderId}` })

  cancelOrder = async (id: number, e: any) => {
    e.stopPropagation()
    try {
      await api.post(`/orders/${id}/cancel`)
      Taro.showToast({ title: '已取消', icon: 'success' })
      this.setState({ page: 1, orders: [], hasMore: true }, () => this.loadOrders())
    } catch { Taro.showToast({ title: '取消失败', icon: 'error' }) }
  }

  receiveOrder = async (id: number, e: any) => {
    e.stopPropagation()
    try {
      await api.post(`/orders/${id}/receive`)
      Taro.showToast({ title: '已确认收货', icon: 'success' })
      this.setState({ page: 1, orders: [], hasMore: true }, () => this.loadOrders())
    } catch { Taro.showToast({ title: '操作失败', icon: 'error' }) }
  }

  requestRefund = async (id: number, e: any) => {
    e.stopPropagation()
    Taro.showModal({ title: '提示', content: '确认申请退款？', success: async (res) => {
      if (res.confirm) {
        try {
          await api.put(`/admin/api/orders/${id}/refund`)
          Taro.showToast({ title: '退款申请已提交', icon: 'success' })
          this.setState({ page: 1, orders: [], hasMore: true }, () => this.loadOrders())
        } catch { Taro.showToast({ title: '操作失败', icon: 'error' }) }
      }
    }})
  }

  formatTime = (t: string) => {
    if (!t) return ''
    const d = new Date(t)
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
  }

  goBack = () => Taro.navigateBack()

  render() {
    const { orders, activeTab, loading, hasMore } = this.state
    return (
      <View className="myorders-container">
        <View className="mo-header">
          <View className="mo-back" onClick={this.goBack}><Text>‹</Text></View>
          <Text className="mo-title">我的订单</Text>
          <View style={{ width: '32px' }} />
        </View>
        <View className="tab-bar">
          {STATUS_TABS.map((tab) => (
            <View key={tab.value} className={`tab-item ${activeTab === tab.value ? 'active' : ''}`} onClick={() => this.switchTab(tab.value)}>
              <Text>{tab.label}</Text>
            </View>
          ))}
        </View>
        <ScrollView scrollY className="orders-scroll" onScrollToLower={() => { if (hasMore) this.setState({ page: this.state.page + 1 }, () => this.loadOrders()) }}>
          {orders.map((order) => {
            const statusStr = STATUS_MAP[order.status] || STATUS_MAP[String(order.status)] || '未知'
            const statusCls = STATUS_CLASS[order.status] || STATUS_CLASS[String(order.status)] || ''
            const isPending = order.status === 0 || order.status === 'PENDING'
            const isShipped = order.status === 2 || order.status === 'SHIPPED'
            const isCompleted = order.status === 3 || order.status === 'COMPLETED'
            const isRefund = order.status === 5 || order.status === 'REFUND'
            return (
              <View key={order.id} className="order-card" onClick={() => this.goToDetail(order.id)}>
                <View className="order-header">
                  <Text className="order-no">{order.orderNo}</Text>
                  <Text className={`order-status ${statusCls}`}>{statusStr}</Text>
                </View>
                {(order.items || []).map((item, idx) => (
                  <View key={idx} className="order-product">
                    {item.productImage ? (
                      <Image src={item.productImage} mode="aspectFill" className="order-prod-img" />
                    ) : (
                      <View className="order-prod-img" style={{ background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: '16px' }}>📦</Text>
                      </View>
                    )}
                    <View className="order-prod-info">
                      <Text className="prod-name" numberOfLines={1}>{item.productName}</Text>
                      {item.skuSpecs && <Text className="prod-specs">{item.skuSpecs}</Text>}
                      <Text className="prod-price">¥{item.price} x{item.quantity}</Text>
                    </View>
                  </View>
                ))}
                <View className="order-footer-row">
                  <Text className="order-time">{this.formatTime(order.createTime)}</Text>
                  <View className="order-actions">
                    {isPending && (
                      <>
                        <View className="order-btn danger" onClick={(e) => this.cancelOrder(order.id, e)}><Text className="order-btn-text">取消</Text></View>
                        <View className="order-btn primary" onClick={(e) => this.goToDetail(order.id)}><Text className="order-btn-text">支付</Text></View>
                      </>
                    )}
                    {isShipped && (
                      <View className="order-btn primary" onClick={(e) => this.receiveOrder(order.id, e)}><Text className="order-btn-text">确认收货</Text></View>
                    )}
                    {isCompleted && (
                      <>
                        <View className="order-btn" onClick={(e) => { e.stopPropagation(); this.goToDetail(order.id) }}><Text className="order-btn-text">评价</Text></View>
                        <View className="order-btn danger" onClick={(e) => this.requestRefund(order.id, e)}><Text className="order-btn-text">退款</Text></View>
                      </>
                    )}
                    {isRefund && <Text className="refund-text">退款处理中</Text>}
                    <Text className="order-total">合计 ¥{order.totalAmount}</Text>
                  </View>
                </View>
              </View>
            )
          })}
          {orders.length === 0 && !loading && <View className="empty-state">暂无订单</View>}
          {loading && <View className="plist-loading"><Text className="plist-loading-text">加载中...</Text></View>}
          {!hasMore && orders.length > 0 && <View className="plist-loading"><Text className="plist-loading-text">没有更多了</Text></View>}
        </ScrollView>
      </View>
    )
  }
}
