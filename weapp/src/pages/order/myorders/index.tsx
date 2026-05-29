import { Component } from 'react'
import Taro from '@tarojs/taro'
import { getStorage } from '@/utils/storage'
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
  totalAmount: number
  payAmount: number
  status: number
  createTime: string
  items?: OrderItem[]
  orderItems?: OrderItem[]
}

const TABS = [
  { label: '全部', status: '' },
  { label: '待付款', status: '0' },
  { label: '待发货', status: '1' },
  { label: '待收货', status: '2' },
  { label: '已完成', status: '3' },
]

const STATUS_MAP: Record<number, string> = {
  0: '待付款',
  1: '待发货',
  2: '待收货',
  3: '已完成',
  4: '已取消',
  5: '已退款',
}

const STATUS_COLOR: Record<number, string> = {
  0: '#FF6B35',
  1: '#0056B3',
  2: '#0056B3',
  3: '#52c41a',
  4: '#999',
  5: '#999',
}

interface State {
  orders: Order[]
  activeTab: number
  page: number
  hasMore: boolean
  loading: boolean
  refreshing: boolean
  userId: number
}

export default class MyOrders extends Component<{}, State> {
  state: State = {
    orders: [],
    activeTab: 0,
    page: 1,
    hasMore: true,
    loading: false,
    refreshing: false,
    userId: 0,
  }

  componentDidMount() {
    const userInfo = getStorage('USER_INFO')
    const userId = userInfo?.id || getStorage('USER_ID') || 0
    const params = Taro.getCurrentInstance().router?.params || {}
    const status = params.status
    const tabIdx = status !== undefined ? TABS.findIndex(t => t.status === String(status)) : 0
    this.setState({ userId, activeTab: Math.max(0, tabIdx) }, () => {
      if (userId) this.loadOrders(true)
    })
  }

  async loadOrders(reset = false) {
    const { userId, activeTab, page } = this.state
    if (!userId) return
    const nextPage = reset ? 1 : page + 1
    const status = TABS[activeTab].status
    this.setState({ loading: true })
    try {
      const params: any = { userId, page: nextPage, size: 10 }
      if (status !== '') params.status = status
      const res = await api.get('/orders', params)
      const items: Order[] = res?.data?.records || []
      this.setState(prev => ({
        orders: reset ? items : [...prev.orders, ...items],
        page: nextPage,
        hasMore: items.length >= 10,
        loading: false,
        refreshing: false,
      }))
    } catch {
      Taro.showToast({ title: '加载失败', icon: 'none' })
      this.setState({ loading: false, refreshing: false })
    }
  }

  switchTab(idx: number) {
    if (idx === this.state.activeTab) return
    this.setState({ activeTab: idx, orders: [], page: 1 }, () => this.loadOrders(true))
  }

  onRefresh() {
    this.setState({ refreshing: true }, () => this.loadOrders(true))
  }

  goDetail(id: number) {
    Taro.navigateTo({ url: `/pages/order/detail/index?id=${id}` })
  }

  async handleAction(e: any, orderId: number, action: string) {
    e.stopPropagation()
    Taro.showLoading({ title: '处理中...' })
    try {
      await api.post(`/orders/${orderId}/${action}`)
      Taro.hideLoading()
      Taro.showToast({ title: '操作成功', icon: 'success' })
      setTimeout(() => this.loadOrders(true), 1000)
    } catch {
      Taro.hideLoading()
      Taro.showToast({ title: '操作失败', icon: 'none' })
    }
  }

  renderOrderCard(order: Order) {
    const statusLabel = STATUS_MAP[order.status] || '未知'
    const statusColor = STATUS_COLOR[order.status] || '#999'
    const orderItems = order.items || order.orderItems || []
    const previewItems = orderItems.slice(0, 3)
    const rest = orderItems.length - 3

    return (
      <View className='order-card' key={order.id} onClick={() => this.goDetail(order.id)}>
        <View className='order-card-header'>
          <Text className='order-store'>山姆旗舰店</Text>
          <Text className='order-status' style={{ color: statusColor }}>{statusLabel}</Text>
        </View>

        {/* 商品预览 */}
        <ScrollView scrollX className='order-items-scroll'>
          {previewItems.map((item, i) => (
            <Image key={i} className='order-thumb' src={item.productImage} mode='aspectFill' />
          ))}
          {rest > 0 && (
            <View className='order-thumb-more'>
              <Text>+{rest}</Text>
            </View>
          )}
        </ScrollView>

        <View className='order-card-footer'>
          <Text className='order-items-count'>共{(order.items || []).length}件</Text>
          <Text className='order-total'>合计 <Text className='order-total-price'>¥{Number(order.payAmount || order.totalAmount).toFixed(2)}</Text></Text>
        </View>

        {/* 操作按钮 */}
        <View className='order-actions'>
          {order.status === 0 && (
            <View className='order-action-btn primary' onClick={e => this.handleAction(e, order.id, 'pay-confirm')}>
              <Text>去付款</Text>
            </View>
          )}
          {order.status === 1 && (
            <View className='order-action-btn' onClick={e => { e.stopPropagation(); Taro.showToast({ title: '已催发货', icon: 'success' }) }}>
              <Text>催发货</Text>
            </View>
          )}
          {order.status === 2 && (
            <View className='order-action-btn primary' onClick={e => this.handleAction(e, order.id, 'receive')}>
              <Text>确认收货</Text>
            </View>
          )}
          {order.status === 3 && (
            <View className='order-action-btn' onClick={e => { e.stopPropagation(); Taro.navigateTo({ url: `/pages/product/detail/index?id=${order.items?.[0]?.productId}` }) }}>
              <Text>再次购买</Text>
            </View>
          )}
        </View>
      </View>
    )
  }

  render() {
    const { orders, activeTab, loading, refreshing, hasMore } = this.state

    return (
      <View className='my-orders-page'>
        {/* Tab栏 */}
        <View className='tab-bar'>
          <ScrollView scrollX className='tab-scroll'>
            {TABS.map((tab, i) => (
              <View
                key={i}
                className={`tab-item ${activeTab === i ? 'active' : ''}`}
                onClick={() => this.switchTab(i)}
              >
                <Text>{tab.label}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        <ScrollView
          className='orders-scroll'
          scrollY
          refresherEnabled
          refresherTriggered={refreshing}
          onRefresherRefresh={this.onRefresh.bind(this)}
          onScrollToLower={() => this.loadOrders(false)}
        >
          {orders.map(o => this.renderOrderCard(o))}

          {loading && <View className='loading-tip'>加载中...</View>}
          {!loading && !hasMore && orders.length > 0 && (
            <View className='no-more-tip'>— 已经到底了 —</View>
          )}
          {!loading && orders.length === 0 && (
            <View className='empty-tip'>
              <Text className='empty-icon'>📦</Text>
              <Text className='empty-text'>暂无相关订单</Text>
              <View className='go-shop-btn' onClick={() => Taro.switchTab({ url: '/pages/index/index' })}>
                <Text>去购物</Text>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    )
  }
}
