import { Component } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
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

interface Order {
  id: number
  orderNo: string
  totalAmount: number
  status: number
  createTime: string
  orderItems: OrderItem[]
}

interface MyOrdersState {
  orders: Order[]
  activeTab: number
  loading: boolean
  page: number
  hasMore: boolean
}

const STATUS_TABS = [
  { label: '全部', value: -1 },
  { label: '待支付', value: 0 },
  { label: '已支付', value: 1 },
  { label: '已发货', value: 2 },
  { label: '已收货', value: 3 },
]

const STATUS_MAP: Record<number, string> = {
  0: '待支付', 1: '已支付', 2: '已发货', 3: '已收货', 4: '已取消', 5: '已退货',
}

export default class MyOrders extends Component<{}, MyOrdersState> {
  constructor(props) {
    super(props)
    this.state = {
      orders: [],
      activeTab: -1,
      loading: false,
      page: 1,
      hasMore: true,
    }
  }

  componentDidMount() {
    this.loadOrders()
  }

  loadOrders = async () => {
    const userInfo = Taro.getStorageSync('USER_INFO')
    if (!userInfo || !userInfo.userId) {
      Taro.showToast({ title: '请先登录', icon: 'error' })
      Taro.switchTab({ url: '/pages/user/index' })
      return
    }

    const { activeTab, page, loading, hasMore } = this.state
    if (loading || !hasMore) return

    this.setState({ loading: true })
    try {
      const params: any = { userId: userInfo.userId, page, size: 10 }
      if (activeTab >= 0) params.status = activeTab

      const response = await api.get('/orders', params)
      const newOrders = response.data?.records || []

      this.setState({
        orders: page === 1 ? newOrders : [...this.state.orders, ...newOrders],
        hasMore: newOrders.length >= 10,
        loading: false,
      })
    } catch (error) {
      this.setState({ loading: false })
    }
  }

  switchTab = (tabIndex: number) => {
    this.setState({ activeTab: tabIndex, page: 1, orders: [], hasMore: true }, () => {
      this.loadOrders()
    })
  }

  goToDetail = (orderId: number) => {
    Taro.navigateTo({ url: `/pages/order/detail/index?id=${orderId}` })
  }

  render() {
    const { orders, activeTab, loading, hasMore } = this.state

    return (
      <View className="myorders-container">
        <View className="tab-bar">
          {STATUS_TABS.map((tab) => (
            <View
              key={tab.value}
              className={`tab-item ${activeTab === tab.value ? 'active' : ''}`}
              onClick={() => this.switchTab(tab.value)}
            >
              <Text>{tab.label}</Text>
            </View>
          ))}
        </View>

        <ScrollView scrollY className="orders-scroll" onScrollToLower={() => {
          if (hasMore) this.setState({ page: this.state.page + 1 }, () => this.loadOrders())
        }}>
          {orders.length > 0 ? orders.map((order) => (
            <View key={order.id} className="order-card" onClick={() => this.goToDetail(order.id)}>
              <View className="order-header">
                <Text className="order-no">{order.orderNo}</Text>
                <Text className={`order-status status-${order.status}`}>{STATUS_MAP[order.status]}</Text>
              </View>
              {order.orderItems && order.orderItems.map((item) => (
                <View key={item.id} className="order-product">
                  <Text className="product-name">{item.productName}</Text>
                  <Text className="product-qty">x{item.quantity}</Text>
                </View>
              ))}
              <View className="order-footer-row">
                <Text className="order-time">{order.createTime}</Text>
                <Text className="order-total">¥{order.totalAmount}</Text>
              </View>
            </View>
          )) : (
            !loading && <View className="empty"><Text>暂无订单</Text></View>
          )}
          {loading && <View className="loading"><Text>加载中...</Text></View>}
          {!hasMore && orders.length > 0 && <View className="loading"><Text>没有更多了</Text></View>}
        </ScrollView>
      </View>
    )
  }
}
