import { Component } from 'react'
import { View, Text, ScrollView, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.css'
import api from '@/services/api'

interface UserState {
  userInfo: any
  isLogin: boolean
  showLogin: boolean
  username: string
  password: string
  showRegister: boolean
  registerUsername: string
  registerPassword: string
  registerPhone: string
}

export default class User extends Component<{}, UserState> {
  constructor(props) {
    super(props)
    this.state = {
      userInfo: null,
      isLogin: false,
      showLogin: false,
      username: '',
      password: '',
      showRegister: false,
      registerUsername: '',
      registerPassword: '',
      registerPhone: '',
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
      this.setState({ userInfo, isLogin: true })
    } else {
      this.setState({ userInfo: null, isLogin: false })
    }
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
        this.setState({ userInfo, isLogin: true, showLogin: false })
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
          this.setState({ userInfo: null, isLogin: false })
          Taro.showToast({ title: '已退出', icon: 'success' })
        }
      },
    })
  }

  goToOrders = () => {
    Taro.navigateTo({ url: '/pages/order/myorders/index' })
  }

  renderLoginForm = () => {
    const { username, password } = this.state
    return (
      <View className="auth-page">
        <View className="auth-header">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" stroke="#0056B3" strokeWidth="1.5" />
            <path d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20" stroke="#0056B3" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <Text className="auth-title">欢迎登录</Text>
          <Text className="auth-subtitle">登录后享受更多会员权益</Text>
        </View>
        <View className="auth-form">
          <View className="auth-field">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" stroke="#999" strokeWidth="1.5" />
              <path d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20" stroke="#999" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <Input className="auth-input" placeholder="请输入用户名" value={username} onInput={(e) => this.setState({ username: e.detail.value })} />
          </View>
          <View className="auth-field">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="11" width="14" height="10" rx="2" stroke="#999" strokeWidth="1.5" />
              <path d="M8 11V7C8 4.79086 9.79086 3 12 3V3C14.2091 3 16 4.79086 16 7V11" stroke="#999" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
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
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <path d="M12 5V19M5 12H19" stroke="#0056B3" strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="12" r="10" stroke="#0056B3" strokeWidth="1.5" />
          </svg>
          <Text className="auth-title">注册账号</Text>
          <Text className="auth-subtitle">加入我们，享受会员专属权益</Text>
        </View>
        <View className="auth-form">
          <View className="auth-field">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" stroke="#999" strokeWidth="1.5" />
              <path d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20" stroke="#999" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <Input className="auth-input" placeholder="请输入用户名" value={registerUsername} onInput={(e) => this.setState({ registerUsername: e.detail.value })} />
          </View>
          <View className="auth-field">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="11" width="14" height="10" rx="2" stroke="#999" strokeWidth="1.5" />
              <path d="M8 11V7C8 4.79086 9.79086 3 12 3V3C14.2091 3 16 4.79086 16 7V11" stroke="#999" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <Input className="auth-input" placeholder="请输入密码" type="password" value={registerPassword} onInput={(e) => this.setState({ registerPassword: e.detail.value })} />
          </View>
          <View className="auth-field">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22 16.92V19.92C22 20.48 21.78 21.01 21.39 21.39C21.01 21.78 20.48 22 19.92 22C16.56 21.68 13.32 20.55 10.5 18.68C7.87 16.98 5.66 14.77 3.96 12.14C2.05 9.28 0.92 6.02 0.61 2.63C0.61 2.08 0.82 1.56 1.2 1.17C1.58 0.79 2.1 0.57 2.65 0.57H5.65C6.64 0.56 7.48 1.26 7.65 2.23C7.8 3.15 8.06 4.05 8.43 4.91L6.73 6.61C8.24 9.49 10.51 11.76 13.39 13.27L15.09 11.57C15.95 11.94 16.85 12.2 17.77 12.35C18.74 12.52 19.44 13.36 19.43 14.35V16.92H22Z" stroke="#999" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
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
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" />
              <path d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
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
    const { userInfo } = this.state

    return (
      <View className="user-page">
        <ScrollView scrollY className="user-scroll">
          {/* Profile Card */}
          <View className="profile-banner">
            <View className="profile-info">
              <View className="profile-avatar">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8" r="4" stroke="#fff" strokeWidth="1.5" />
                  <path d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </View>
              <View className="profile-meta">
                <Text className="profile-name">{userInfo.nickName || userInfo.username}</Text>
                <View className="member-badge">
                  <Text className="member-text">会员</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Order Shortcuts */}
          <View className="section-card order-section">
            <View className="section-header-row">
              <Text className="section-title">我的订单</Text>
              <View className="view-all" onClick={this.goToOrders}>
                <Text className="view-all-text">全部订单</Text>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M9 6L15 12L9 18" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </View>
            </View>
            <View className="order-shortcuts">
              {[
                { key: 'unpaid', label: '待付款', svg: `<svg viewBox="0 0 24 24" fill="none"><rect x="2" y="4" width="20" height="16" rx="2" stroke="#0056B3" stroke-width="1.5"/><path d="M2 10H22" stroke="#0056B3" stroke-width="1.5"/><path d="M6 16H10" stroke="#0056B3" stroke-width="1.5" stroke-linecap="round"/></svg>` },
                { key: 'unshipped', label: '待发货', svg: `<svg viewBox="0 0 24 24" fill="none"><rect x="1" y="3" width="15" height="13" rx="2" stroke="#0056B3" stroke-width="1.5"/><path d="M16 8H20L23 12V16H16V8Z" stroke="#0056B3" stroke-width="1.5" stroke-linejoin="round"/><circle cx="5.5" cy="18.5" r="2.5" stroke="#0056B3" stroke-width="1.5"/><circle cx="18.5" cy="18.5" r="2.5" stroke="#0056B3" stroke-width="1.5"/></svg>` },
                { key: 'shipped', label: '待收货', svg: `<svg viewBox="0 0 24 24" fill="none"><path d="M9 11L11 13L15 9" stroke="#0056B3" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#0056B3" stroke-width="1.5"/></svg>` },
                { key: 'completed', label: '已完成', svg: `<svg viewBox="0 0 24 24" fill="none"><path d="M9 12L11 14L15 10M21 12C21 16.97 16.97 21 12 21C7.03 21 3 16.97 3 12C3 7.03 7.03 3 12 3C16.97 3 21 7.03 21 12Z" stroke="#0056B3" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>` },
              ].map((item) => (
                <View key={item.key} className="order-shortcut-item" onClick={this.goToOrders}>
                  <View className="order-icon" dangerouslySetInnerHTML={{ __html: item.svg }} />
                  <Text className="order-label">{item.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Menu List */}
          <View className="section-card menu-section">
            {[
              { icon: 'M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z', label: '我的收藏' },
              { icon: 'M20 12V22H4V12M22 7H2V12H22V7ZM12 22V7M12 7H7.5C6.83696 7 6.20107 6.73661 5.73223 6.26777C5.26339 5.79893 5 5.16304 5 4.5C5 3.83696 5.26339 3.20107 5.73223 2.73223C6.20107 2.26339 6.83696 2 7.5 2C11 2 12 7 12 7ZM12 7H16.5C17.163 7 17.7989 6.73661 18.2678 6.26777C18.7366 5.79893 19 5.16304 19 4.5C19 3.83696 18.7366 3.20107 18.2678 2.73223C17.7989 2.26339 17.163 2 16.5 2C13 2 12 7 12 7Z', label: '优惠券' },
              { icon: 'M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 5.02944 7.02944 1 12 1C16.9706 1 21 5.02944 21 10ZM12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z', label: '收货地址' },
              { icon: 'M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15ZM12 15V21M12 3V9M3 12H9M15 12H21', label: '设置' },
            ].map((item, index) => (
              <View key={index} className="menu-item">
                <View className="menu-icon-wrap">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d={item.icon} stroke="#0056B3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </View>
                <Text className="menu-text">{item.label}</Text>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M9 6L15 12L9 18" stroke="#ccc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
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
    const { isLogin, showLogin, showRegister } = this.state

    if (showLogin && !isLogin) return this.renderLoginForm()
    if (showRegister) return this.renderRegisterForm()
    if (!isLogin) return this.renderNotLogin()
    return this.renderLoggedIn()
  }
}
