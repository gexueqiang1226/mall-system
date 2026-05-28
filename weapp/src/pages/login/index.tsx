import { Component } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.css'
import api from '@/services/api'

interface LoginState {
  username: string
  password: string
  loading: boolean
}

export default class Login extends Component<{}, LoginState> {
  constructor(props) {
    super(props)
    this.state = { username: '', password: '', loading: false }
  }

  handleLogin = async () => {
    const { username, password } = this.state
    if (!username || !password) {
      Taro.showToast({ title: '请输入用户名和密码', icon: 'error' })
      return
    }
    this.setState({ loading: true })
    try {
      const response = await api.post('/auth/login', { username, password })
      if (response.code === 0) {
        const data = response.data
        Taro.setStorageSync('TOKEN', data.token)
        Taro.setStorageSync('USER_INFO', {
          userId: data.userId,
          username: data.username,
          avatar: data.avatar,
          phone: data.phone,
          nickName: data.username,
        })
        Taro.showToast({ title: '登录成功', icon: 'success' })
        setTimeout(() => Taro.switchTab({ url: '/pages/index/index' }), 1000)
      } else {
        Taro.showToast({ title: response.message || '登录失败', icon: 'error' })
      }
    } catch (error) {
      Taro.showToast({ title: '登录失败', icon: 'error' })
    }
    this.setState({ loading: false })
  }

  goRegister = () => Taro.navigateTo({ url: '/pages/register/index' })
  goBack = () => Taro.navigateBack()

  render() {
    const { username, password, loading } = this.state
    return (
      <View className="login-page">
        <View className="login-header">
          <View className="back-btn" onClick={this.goBack}>
            <Text className="back-text">‹</Text>
          </View>
          <Text className="header-title">登录</Text>
          <View style={{ width: '32px' }} />
        </View>
        <View className="login-body">
          <View className="login-logo">
            <View className="logo-circle">
              <Text className="logo-text">S</Text>
            </View>
            <Text className="login-welcome">欢迎回来</Text>
            <Text className="login-subtitle">登录后享受更多会员权益</Text>
          </View>
          <View className="login-form">
            <View className="form-field">
              <Input className="form-input" placeholder="请输入用户名" value={username} onInput={(e) => this.setState({ username: e.detail.value })} />
            </View>
            <View className="form-field">
              <Input className="form-input" placeholder="请输入密码" type="password" value={password} onInput={(e) => this.setState({ password: e.detail.value })} />
            </View>
            <View className={`login-btn ${loading ? 'disabled' : ''}`} onClick={loading ? undefined : this.handleLogin}>
              <Text className="login-btn-text">{loading ? '登录中...' : '登 录'}</Text>
            </View>
            <View className="login-links">
              <Text className="link-text" onClick={this.goRegister}>没有账号？立即注册</Text>
            </View>
          </View>
        </View>
      </View>
    )
  }
}
