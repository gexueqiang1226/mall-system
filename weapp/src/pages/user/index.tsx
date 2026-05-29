import { Component } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, ScrollView } from '@tarojs/components'
import api from '@/services/api'
import './index.css'

interface UserInfo {
  id: number
  username: string
  nickname: string
  phone: string
  email: string
  points: number
  avatar: string
}

interface OrderCount {
  pending: number
  shipped: number
  received: number
  done: number
}

interface State {
  userInfo: UserInfo | null
  orderCount: OrderCount
  isLoggedIn: boolean
}

const FUNC_MENUS = [
  { icon: '❤️', label: '我的收藏', url: '/pages/favorites/index' },
  { icon: '🎟️', label: '优惠券', url: '/pages/coupons/index' },
  { icon: '⭐', label: '积分中心', url: '/pages/points/index' },
  { icon: '📍', label: '地址管理', url: '/pages/address/index' },
  { icon: '👤', label: '个人资料', url: '/pages/profile/index' },
  { icon: '⚙️', label: '设置', url: '' },
  { icon: '❓', label: '帮助中心', url: '' },
  { icon: 'ℹ️', label: '关于我们', url: '' },
]

const ORDER_TABS = [
  { icon: '💳', label: '待付款', status: '0' },
  { icon: '📦', label: '待发货', status: '1' },
  { icon: '🚚', label: '待收货', status: '2' },
  { icon: '✅', label: '已完成', status: '3' },
]

export default class UserPage extends Component<{}, State> {
  state: State = {
    userInfo: null,
    orderCount: { pending: 0, shipped: 0, received: 0, done: 0 },
    isLoggedIn: false,
  }

  componentDidShow() {
    this.checkLogin()
  }

  async checkLogin() {
    const userInfo = Taro.getStorageSync('USER_INFO')
    const token = Taro.getStorageSync('TOKEN')
    if (!userInfo || !token) {
      this.setState({ isLoggedIn: false, userInfo: null })
      return
    }
    this.setState({ isLoggedIn: true, userInfo })
    this.loadUserData(userInfo.id)
  }

  async loadUserData(userId: number) {
    try {
      const [profileRes] = await Promise.all([
        api.get('/user/profile', { userId }),
      ])
      const profile = profileRes?.data
      if (profile) {
        this.setState({ userInfo: profile })
        Taro.setStorageSync('USER_INFO', profile)
      }
    } catch {}
  }

  goLogin() {
    Taro.navigateTo({ url: '/pages/login/index' })
  }

  goOrders(status: string) {
    Taro.navigateTo({ url: `/pages/order/myorders/index?status=${status}` })
  }

  goAllOrders() {
    Taro.navigateTo({ url: '/pages/order/myorders/index' })
  }

  goMenu(url: string) {
    if (!url) {
      Taro.showToast({ title: '功能开发中', icon: 'none' })
      return
    }
    Taro.navigateTo({ url })
  }

  logout() {
    Taro.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          Taro.removeStorageSync('TOKEN')
          Taro.removeStorageSync('USER_INFO')
          Taro.removeStorageSync('USER_ID')
          this.setState({ isLoggedIn: false, userInfo: null })
          Taro.showToast({ title: '已退出登录', icon: 'success' })
        }
      },
    })
  }

  getAvatarText(userInfo: UserInfo) {
    return (userInfo.nickname || userInfo.username || 'U').charAt(0).toUpperCase()
  }

  render() {
    const { userInfo, isLoggedIn } = this.state

    return (
      <View className='user-page'>
        <ScrollView className='user-scroll' scrollY>
          {/* 用户信息卡片 */}
          {isLoggedIn && userInfo ? (
            <View className='user-card'>
              <View className='user-avatar'>
                <Text className='avatar-text'>{this.getAvatarText(userInfo)}</Text>
              </View>
              <View className='user-info'>
                <Text className='user-name'>{userInfo.nickname || userInfo.username}</Text>
                <View className='user-meta'>
                  <View className='vip-badge'>山姆会员</View>
                  <Text className='user-points'>积分 {userInfo.points || 0}</Text>
                </View>
              </View>
            </View>
          ) : (
            <View className='user-card not-login'>
              <View className='user-avatar guest'>
                <Text className='avatar-text'>👤</Text>
              </View>
              <View className='user-info'>
                <Text className='login-tip'>登录后享受更多服务</Text>
                <View className='login-btn' onClick={this.goLogin.bind(this)}>
                  <Text>登录 / 注册</Text>
                </View>
              </View>
            </View>
          )}

          {/* 我的订单 */}
          <View className='section-card order-section'>
            <View className='section-header'>
              <Text className='section-title'>我的订单</Text>
              <Text className='more-link' onClick={this.goAllOrders.bind(this)}>全部订单 &gt;</Text>
            </View>
            <View className='order-tabs'>
              {ORDER_TABS.map(tab => (
                <View
                  key={tab.status}
                  className='order-tab-item'
                  onClick={() => this.goOrders(tab.status)}
                >
                  <Text className='order-tab-icon'>{tab.icon}</Text>
                  <Text className='order-tab-label'>{tab.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* 功能网格 */}
          <View className='section-card'>
            <View className='func-grid'>
              {FUNC_MENUS.map((menu, i) => (
                <View
                  key={i}
                  className='func-item'
                  onClick={() => this.goMenu(menu.url)}
                >
                  <Text className='func-icon'>{menu.icon}</Text>
                  <Text className='func-label'>{menu.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* 退出登录 */}
          {isLoggedIn && (
            <View className='logout-btn' onClick={this.logout.bind(this)}>
              <Text>退出登录</Text>
            </View>
          )}

          <View style={{ height: '24px' }} />
        </ScrollView>
      </View>
    )
  }
}
