import { Component } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.css'
import api from '@/services/api'

interface RegisterState {
  username: string
  password: string
  confirmPassword: string
  phone: string
  loading: boolean
}

export default class Register extends Component<{}, RegisterState> {
  constructor(props) {
    super(props)
    this.state = { username: '', password: '', confirmPassword: '', phone: '', loading: false }
  }

  handleRegister = async () => {
    const { username, password, confirmPassword, phone } = this.state
    if (!username || !password) {
      Taro.showToast({ title: '请输入用户名和密码', icon: 'error' })
      return
    }
    if (password !== confirmPassword) {
      Taro.showToast({ title: '两次密码不一致', icon: 'error' })
      return
    }
    this.setState({ loading: true })
    try {
      const response = await api.post('/auth/register', { username, password, phone })
      if (response.code === 0) {
        Taro.showToast({ title: '注册成功，请登录', icon: 'success' })
        setTimeout(() => Taro.navigateTo({ url: '/pages/login/index' }), 1000)
      } else {
        Taro.showToast({ title: response.message || '注册失败', icon: 'error' })
      }
    } catch (error) {
      Taro.showToast({ title: '注册失败', icon: 'error' })
    }
    this.setState({ loading: false })
  }

  goLogin = () => Taro.navigateBack()
  goBack = () => Taro.navigateBack()

  render() {
    const { username, password, confirmPassword, phone, loading } = this.state
    return (
      <View className="login-page">
        <View className="login-header">
          <View className="back-btn" onClick={this.goBack}>
            <Text className="back-text">‹</Text>
          </View>
          <Text className="header-title">注册</Text>
          <View style={{ width: '32px' }} />
        </View>
        <View className="login-body">
          <View className="login-logo">
            <View className="logo-circle">
              <Text className="logo-text">S</Text>
            </View>
            <Text className="login-welcome">创建账号</Text>
            <Text className="login-subtitle">加入我们，享受会员专属权益</Text>
          </View>
          <View className="login-form">
            <View className="form-field">
              <Input className="form-input" placeholder="请输入用户名" value={username} onInput={(e) => this.setState({ username: e.detail.value })} />
            </View>
            <View className="form-field">
              <Input className="form-input" placeholder="请输入密码" type="password" value={password} onInput={(e) => this.setState({ password: e.detail.value })} />
            </View>
            <View className="form-field">
              <Input className="form-input" placeholder="请确认密码" type="password" value={confirmPassword} onInput={(e) => this.setState({ confirmPassword: e.detail.value })} />
            </View>
            <View className="form-field">
              <Input className="form-input" placeholder="手机号（选填）" type="number" value={phone} onInput={(e) => this.setState({ phone: e.detail.value })} />
            </View>
            <View className={`login-btn ${loading ? 'disabled' : ''}`} onClick={loading ? undefined : this.handleRegister}>
              <Text className="login-btn-text">{loading ? '注册中...' : '注 册'}</Text>
            </View>
            <View className="login-links">
              <Text className="link-text" onClick={this.goLogin}>已有账号？去登录</Text>
            </View>
          </View>
        </View>
      </View>
    )
  }
}
