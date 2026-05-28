import { Component } from 'react'
import { View, Text, ScrollView, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.css'
import api from '@/services/api'

interface OrderBadge {
  pending: number
  paid: number
  shipped: number
  completed: number
}

interface UserState {
  userInfo: any
  isLogin: boolean
  showLogin: boolean
  showRegister: boolean
  username: string
  password: string
  registerUsername: string
  registerPassword: string
  registerPhone: string
  profile: any
  pointsBalance: number
  couponsCount: number
  favoritesCount: number
  browseHistoryCount: number
  orderBadge: OrderBadge
  loading: boolean
}

export default class User extends Component<{}, UserState> {
  constructor(props) {
    super(props)
    this.state = {
      userInfo: null,
      isLogin: false,
      showLogin: false,
      showRegister: false,
      username: '',
      password: '',
      registerUsername: '',
      registerPassword: '',
      registerPhone: '',
      profile: null,
      pointsBalance: 0,
      couponsCount: 0,
      favoritesCount: 0,
      browseHistoryCount: 0,
      orderBadge: { pending: 0, paid: 0, shipped: 0, completed: 0 },
      loading: true,
    }
  }

  componentDidMount() {
    this.checkLogin()
  }

  componentDidShow() {
    this.checkLogin()
  }

  checkLogin = () => {
    const userInfo = Taro.getStorageSync('USER_INFO')
    if (userInfo && userInfo.userId) {
      this.setState({ userInfo, isLogin: true }, () => {
        this.loadUserData()
      })
    } else {
      this.setState({ userInfo: null, isLogin: false, loading: false })
    }
  }

  loadUserData = async () => {
    const { userInfo } = this.state
    if (!userInfo || !userInfo.userId) return

    const userId = userInfo.userId

    try {
      const [profileRes, pointsRes, couponsRes, favoritesRes] = await Promise.all([
        api.get('/user/profile', { userId }).catch(() => null),
        api.get('/points/balance', { userId }).catch(() => null),
        api.get('/coupons', { userId }).catch(() => null),
        api.get('/favorites', { userId }).catch(() => null),
      ])

      this.setState({
        profile: profileRes?.data || null,
        pointsBalance: pointsRes?.data?.balance || pointsRes?.data || 0,
        couponsCount: Array.isArray(couponsRes?.data) ? couponsRes.data.length : (couponsRes?.data?.total || 0),
        favoritesCount: Array.isArray(favoritesRes?.data) ? favoritesRes.data.length : (favoritesRes?.data?.total || 0),
        loading: false,
      })

      this.loadOrderBadges(userId)
    } catch (error) {
      console.error('加载用户数据失败:', error)
      this.setState({ loading: false })
    }
  }

  loadOrderBadges = async (userId: number) => {
    const statuses = [
      { key: 'pending', status: 'PENDING' },
      { key: 'paid', status: 'PAID' },
      { key: 'shipped', status: 'SHIPPED' },
      { key: 'completed', status: 'COMPLETED' },
    ]

    const badge = { pending: 0, paid: 0, shipped: 0, completed: 0 }

    await Promise.all(
      statuses.map(async (s) => {
        try {
          const res = await api.get('/orders', { userId, status: s.status, page: 1, size: 1 })
          badge[s.key] = res?.data?.total || 0
        } catch (e) {
          // ignore
        }
      })
    )

    this.setState({ orderBadge: badge })
  }

  handleLogin = async () => {
    const { username, password } = this.state
    if (!username || !password) {
      Taro.showToast({ title: '请输入用户名和密码', icon: 'error' })
      return
    }
    try {
      const response = await api.post('/auth/login', { username, password })
      if (response.code === 0) {
        const data = response.data
        const userInfo = {
          userId: data.userId,
          username: data.username,
          avatar: data.avatar,
          phone: data.phone,
          nickName: data.username,
        }
        Taro.setStorageSync('USER_INFO', userInfo)
        Taro.setStorageSync('TOKEN', data.token)
        this.setState({ userInfo, isLogin: true, showLogin: false, loading: true }, () => {
          this.loadUserData()
        })
        Taro.showToast({ title: '登录成功', icon: 'success' })
      }
    } catch (error) {
      Taro.showToast({ title: '登录失败', icon: 'error' })
    }
  }

  handleRegister = async () => {
    const { registerUsername, registerPassword, registerPhone } = this.state
    if (!registerUsername || !registerPassword) {
      Taro.showToast({ title: '请输入用户名和密码', icon: 'error' })
      return
    }
    try {
      const response = await api.post('/auth/register', {
        username: registerUsername,
        password: registerPassword,
        phone: registerPhone,
      })
      if (response.code === 0) {
        Taro.showToast({ title: '注册成功，请登录', icon: 'success' })
        this.setState({ showRegister: false, showLogin: true })
      }
    } catch (error) {
      Taro.showToast({ title: '注册失败', icon: 'error' })
    }
  }

  handleLogout = () => {
    Taro.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      confirmText: '确定',
      confirmColor: '#E53935',
      success: (res) => {
        if (res.confirm) {
          Taro.removeStorageSync('USER_INFO')
          Taro.removeStorageSync('TOKEN')
          this.setState({
            userInfo: null,
            isLogin: false,
            profile: null,
            pointsBalance: 0,
            couponsCount: 0,
            favoritesCount: 0,
            browseHistoryCount: 0,
            orderBadge: { pending: 0, paid: 0, shipped: 0, completed: 0 },
          })
          Taro.showToast({ title: '已退出', icon: 'success' })
        }
      },
    })
  }

  goToOrders = () => {
    Taro.navigateTo({ url: '/pages/order/myorders/index' })
  }

  goToOrdersByStatus = (status?: string) => {
    const base = '/pages/order/myorders/index'
    const url = status ? `${base}?status=${status}` : base
    Taro.navigateTo({ url })
  }

  goToPage = (path: string) => {
    Taro.navigateTo({ url: path })
  }

  getInitial = () => {
    const { userInfo, profile } = this.state
    const name = profile?.nickName || userInfo?.nickName || userInfo?.username || ''
    return name.charAt(0).toUpperCase() || 'U'
  }

  getDisplayName = () => {
    const { userInfo, profile } = this.state
    return profile?.nickName || userInfo?.nickName || userInfo?.username || '用户'
  }

  renderLoginForm = () => {
    const { username, password } = this.state
    return (
      <View className="auth-page">
        <View className="auth-header">
          <View className="auth-logo">
            <Text className="auth-logo-text">U</Text>
          </View>
          <Text className="auth-title">欢迎登录</Text>
          <Text className="auth-subtitle">登录后享受更多会员权益</Text>
        </View>
        <View className="auth-form">
          <View className="auth-field">
            <Text className="auth-field-icon">&#x1F464;</Text>
            <Input className="auth-input" placeholder="请输入用户名" value={username} onInput={(e) => this.setState({ username: e.detail.value })} />
          </View>
          <View className="auth-field">
            <Text className="auth-field-icon">&#x1F512;</Text>
            <Input className="auth-input" placeholder="请输入密码" type="password" value={password} onInput={(e) => this.setState({ password: e.detail.value })} />
          </View>
          <View className="auth-submit" onClick={this.handleLogin}>
            <Text className="auth-submit-text">登 录</Text>
          </View>
          <Text className="auth-link" onClick={() => this.setState({ showLogin: false, showRegister: true })}>没有账号？立即注册</Text>
          <Text className="auth-link" onClick={() => this.setState({ showLogin: false })}>返回</Text>
        </View>
      </View>
    )
  }

  renderRegisterForm = () => {
    const { registerUsername, registerPassword, registerPhone } = this.state
    return (
      <View className="auth-page">
        <View className="auth-header">
          <View className="auth-logo">
            <Text className="auth-logo-text">+</Text>
          </View>
          <Text className="auth-title">注册账号</Text>
          <Text className="auth-subtitle">加入我们，享受会员专属权益</Text>
        </View>
        <View className="auth-form">
          <View className="auth-field">
            <Text className="auth-field-icon">&#x1F464;</Text>
            <Input className="auth-input" placeholder="请输入用户名" value={registerUsername} onInput={(e) => this.setState({ registerUsername: e.detail.value })} />
          </View>
          <View className="auth-field">
            <Text className="auth-field-icon">&#x1F512;</Text>
            <Input className="auth-input" placeholder="请输入密码" type="password" value={registerPassword} onInput={(e) => this.setState({ registerPassword: e.detail.value })} />
          </View>
          <View className="auth-field">
            <Text className="auth-field-icon">&#x1F4F1;</Text>
            <Input className="auth-input" placeholder="手机号（选填）" value={registerPhone} onInput={(e) => this.setState({ registerPhone: e.detail.value })} />
          </View>
          <View className="auth-submit" onClick={this.handleRegister}>
            <Text className="auth-submit-text">注 册</Text>
          </View>
          <Text className="auth-link" onClick={() => this.setState({ showRegister: false, showLogin: true })}>已有账号？去登录</Text>
        </View>
      </View>
    )
  }

  renderNotLogin = () => {
    return (
      <View className="user-page">
        <View className="profile-banner-empty">
          <View className="profile-empty-content">
            <View className="profile-empty-avatar">
              <Text className="profile-empty-avatar-text">?</Text>
            </View>
            <Text className="profile-empty-title">登录后享受更多服务</Text>
            <View className="profile-empty-btns">
              <View className="profile-login-btn" onClick={() => this.setState({ showLogin: true })}>
                <Text className="profile-login-text">登录</Text>
              </View>
              <View className="profile-register-btn" onClick={() => this.setState({ showRegister: true })}>
                <Text className="profile-register-text">注册</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    )
  }

  renderLoggedIn = () => {
    const { pointsBalance, couponsCount, favoritesCount, browseHistoryCount, orderBadge } = this.state

    const orderShortcuts = [
      { key: 'pending', label: '待付款', status: 'PENDING', count: orderBadge.pending },
      { key: 'paid', label: '待发货', status: 'PAID', count: orderBadge.paid },
      { key: 'shipped', label: '待收货', status: 'SHIPPED', count: orderBadge.shipped },
      { key: 'completed', label: '待评价', status: 'COMPLETED', count: orderBadge.completed },
    ]

    const menuItems = [
      { icon: '&#x1F4CB;', label: '我的订单', path: '/pages/order/myorders/index' },
      { icon: '&#x2764;', label: '我的收藏', path: '/pages/favorites/index' },
      { icon: '&#x1F4CD;', label: '地址管理', path: '/pages/address/index' },
      { icon: '&#x1F3F7;', label: '优惠券', path: '/pages/coupon/index' },
      { icon: '&#x2B50;', label: '积分中心', path: '/pages/points/index' },
      { icon: '&#x1F464;', label: '个人资料', path: '/pages/profile/index' },
    ]

    return (
      <View className="user-page">
        <ScrollView scrollY className="user-scroll">
          {/* Profile Header */}
          <View className="profile-banner">
            <View className="profile-info">
              <View className="profile-avatar-circle">
                <Text className="profile-avatar-initial">{this.getInitial()}</Text>
              </View>
              <View className="profile-meta">
                <Text className="profile-name">{this.getDisplayName()}</Text>
                <View className="vip-badge">
                  <Text className="vip-text">&#x1F451; 卓越会员</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Stats Row */}
          <View className="stats-card">
            <View className="stats-row">
              <View className="stat-item">
                <Text className="stat-value">{pointsBalance}</Text>
                <Text className="stat-label">积分</Text>
              </View>
              <View className="stat-divider" />
              <View className="stat-item">
                <Text className="stat-value">{couponsCount}</Text>
                <Text className="stat-label">优惠券</Text>
              </View>
              <View className="stat-divider" />
              <View className="stat-item">
                <Text className="stat-value">{favoritesCount}</Text>
                <Text className="stat-label">收藏</Text>
              </View>
              <View className="stat-divider" />
              <View className="stat-item">
                <Text className="stat-value">{browseHistoryCount}</Text>
                <Text className="stat-label">足迹</Text>
              </View>
            </View>
          </View>

          {/* Order Shortcuts */}
          <View className="section-card order-section">
            <View className="section-header-row">
              <Text className="section-title">我的订单</Text>
              <View className="view-all" onClick={this.goToOrders}>
                <Text className="view-all-text">全部订单</Text>
                <Text className="view-all-arrow">&gt;</Text>
              </View>
            </View>
            <View className="order-shortcuts">
              {orderShortcuts.map((item) => (
                <View
                  key={item.key}
                  className="order-shortcut-item"
                  onClick={() => this.goToOrdersByStatus(item.status)}
                >
                  <View className="order-icon-wrap">
                    <Text className="order-icon-text">
                      {item.key === 'pending' ? '&#x1F4B3;' :
                       item.key === 'paid' ? '&#x1F4E6;' :
                       item.key === 'shipped' ? '&#x1F69A;' : '&#x2705;'}
                    </Text>
                    {item.count > 0 && (
                      <View className="order-badge">
                        <Text className="order-badge-text">{item.count > 99 ? '99+' : item.count}</Text>
                      </View>
                    )}
                  </View>
                  <Text className="order-label">{item.label}</Text>
                </View>
              ))}
              <View className="order-shortcut-item" onClick={this.goToOrders}>
                <View className="order-icon-wrap">
                  <Text className="order-icon-text">&#x1F4CA;</Text>
                </View>
                <Text className="order-label">全部</Text>
              </View>
            </View>
          </View>

          {/* Menu List */}
          <View className="section-card menu-section">
            {menuItems.map((item, index) => (
              <View key={index} className="menu-item" onClick={() => this.goToPage(item.path)}>
                <View className="menu-icon-wrap">
                  <Text className="menu-icon-text">{item.icon}</Text>
                </View>
                <Text className="menu-text">{item.label}</Text>
                <Text className="menu-arrow">&gt;</Text>
              </View>
            ))}
          </View>

          {/* Logout */}
          <View className="logout-wrap">
            <View className="logout-btn" onClick={this.handleLogout}>
              <Text className="logout-text">退出登录</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    )
  }

  render() {
    const { isLogin, showLogin, showRegister, loading } = this.state

    if (showLogin && !isLogin) return this.renderLoginForm()
    if (showRegister) return this.renderRegisterForm()
    if (!isLogin) return this.renderNotLogin()

    if (loading) {
      return (
        <View className="user-page">
          <View className="loading-wrap">
            <View className="loading-spinner" />
            <Text className="loading-text">加载中...</Text>
          </View>
        </View>
      )
    }

    return this.renderLoggedIn()
  }
}
