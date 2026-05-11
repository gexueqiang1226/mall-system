import { Component } from 'react'
import { View, Text, Button, ScrollView, Input } from '@tarojs/components'
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
      cancelText: '取消',
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

  render() {
    const { userInfo, isLogin, showLogin, showRegister, username, password, registerUsername, registerPassword, registerPhone } = this.state

    // Login form
    if (showLogin && !isLogin) {
      return (
        <View className="user-container">
          <View className="login-section">
            <Text className="login-title">用户登录</Text>
            <Input className="login-input" placeholder="用户名" value={username} onInput={(e) => this.setState({ username: e.detail.value })} />
            <Input className="login-input" placeholder="密码" type="password" value={password} onInput={(e) => this.setState({ password: e.detail.value })} />
            <Button className="btn-login" onClick={this.handleLogin}>登录</Button>
            <Text className="link-text" onClick={() => this.setState({ showLogin: false, showRegister: true })}>没有账号？去注册</Text>
            <Text className="link-text" onClick={() => this.setState({ showLogin: false })}>返回</Text>
          </View>
        </View>
      )
    }

    // Register form
    if (showRegister) {
      return (
        <View className="user-container">
          <View className="login-section">
            <Text className="login-title">用户注册</Text>
            <Input className="login-input" placeholder="用户名" value={registerUsername} onInput={(e) => this.setState({ registerUsername: e.detail.value })} />
            <Input className="login-input" placeholder="密码" type="password" value={registerPassword} onInput={(e) => this.setState({ registerPassword: e.detail.value })} />
            <Input className="login-input" placeholder="手机号（选填）" value={registerPhone} onInput={(e) => this.setState({ registerPhone: e.detail.value })} />
            <Button className="btn-login" onClick={this.handleRegister}>注册</Button>
            <Text className="link-text" onClick={() => this.setState({ showRegister: false, showLogin: true })}>已有账号？去登录</Text>
          </View>
        </View>
      )
    }

    // Not logged in
    if (!isLogin) {
      return (
        <View className="user-container">
          <View className="login-section">
            <View className="login-icon">👤</View>
            <Text className="login-text">未登录</Text>
            <Button className="btn-login" onClick={() => this.setState({ showLogin: true })}>登录</Button>
            <Button className="btn-register" onClick={() => this.setState({ showRegister: true })}>注册</Button>
          </View>
        </View>
      )
    }

    // Logged in
    return (
      <View className="user-container">
        <ScrollView scrollY>
          <View className="user-info-section">
            <View className="avatar">
              {userInfo.avatar ? (
                <Text className="avatar-text">👤</Text>
              ) : (
                <Text className="avatar-text">👤</Text>
              )}
            </View>
            <View className="user-details">
              <Text className="user-name">{userInfo.nickName || userInfo.username}</Text>
              <Text className="user-phone">{userInfo.phone || ''}</Text>
            </View>
          </View>

          <View className="menu-section">
            <View className="menu-item" onClick={this.goToOrders}>
              <Text className="menu-icon">📦</Text>
              <Text className="menu-text">我的订单</Text>
              <Text className="menu-arrow">></Text>
            </View>
            <View className="menu-item">
              <Text className="menu-icon">❤️</Text>
              <Text className="menu-text">我的收藏</Text>
              <Text className="menu-arrow">></Text>
            </View>
            <View className="menu-item">
              <Text className="menu-icon">📍</Text>
              <Text className="menu-text">收货地址</Text>
              <Text className="menu-arrow">></Text>
            </View>
            <View className="menu-item">
              <Text className="menu-icon">⚙️</Text>
              <Text className="menu-text">设置</Text>
              <Text className="menu-arrow">></Text>
            </View>
          </View>

          <View className="footer-section">
            <Button className="btn-logout" onClick={this.handleLogout}>退出登录</Button>
          </View>
        </ScrollView>
      </View>
    )
  }
}
