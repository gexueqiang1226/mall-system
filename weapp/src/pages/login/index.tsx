import { Component } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Input } from '@tarojs/components'
import { setStorage, normalizeUserInfo } from '@/utils/storage'
import api from '@/services/api'
import './index.css'

interface State {
  username: string
  password: string
  showPwd: boolean
  loading: boolean
}

export default class Login extends Component<{}, State> {
  state: State = {
    username: '',
    password: '',
    showPwd: false,
    loading: false,
  }

  async handleLogin() {
    const { username, password, loading } = this.state
    if (!username.trim()) {
      Taro.showToast({ title: '请输入用户名', icon: 'none' })
      return
    }
    if (!password) {
      Taro.showToast({ title: '请输入密码', icon: 'none' })
      return
    }
    if (loading) return
    this.setState({ loading: true })
    try {
      const res = await api.post('/auth/login', { username: username.trim(), password })
      const data = res?.data || {}
      // 兼容后端扁平返回：{ token, userId, username, ... } 或嵌套返回：{ token, user: {...} }
      const user = normalizeUserInfo(data.user || data)
      const token = data.token
      if (!token || !user?.id) {
        Taro.showToast({ title: '登录返回数据异常', icon: 'none' })
        this.setState({ loading: false })
        return
      }
      setStorage('TOKEN', token)
      setStorage('USER_INFO', user)
      setStorage('USER_ID', user.id)
      Taro.showToast({ title: '登录成功', icon: 'success' })
      setTimeout(() => {
        Taro.switchTab({ url: '/pages/user/index' })
      }, 800)
    } catch (e: any) {
      Taro.showToast({ title: e?.message || '登录失败', icon: 'none' })
      this.setState({ loading: false })
    }
  }

  goBack() {
    const pages = Taro.getCurrentPages()
    if (pages.length > 1) {
      Taro.navigateBack()
    } else {
      Taro.switchTab({ url: '/pages/index/index' })
    }
  }

  render() {
    const { username, password, showPwd, loading } = this.state

    return (
      <View className='auth-page'>
        <View className='detail-nav-bar'>
          <View className='detail-back-btn' onClick={this.goBack.bind(this)}>
            <Text className='detail-back-icon'>‹</Text>
          </View>
          <Text className='detail-nav-title'>登录</Text>
        </View>
        {/* Logo区 */}
        <View className='auth-logo-wrap'>
          <View className='auth-logo'>
            <Text className='auth-logo-text'>S</Text>
          </View>
          <Text className='auth-brand'>SAM'S CLUB</Text>
          <Text className='auth-welcome'>欢迎回来</Text>
        </View>

        {/* 表单 */}
        <View className='auth-form'>
          <View className='input-group'>
            <View className='input-icon'>👤</View>
            <Input
              className='auth-input'
              placeholder='请输入用户名'
              value={username}
              onInput={e => this.setState({ username: e.detail.value })}
            />
          </View>

          <View className='input-group'>
            <View className='input-icon'>🔒</View>
            <Input
              className='auth-input'
              placeholder='请输入密码'
              password={!showPwd}
              value={password}
              onInput={e => this.setState({ password: e.detail.value })}
            />
            <View className='pwd-toggle' onClick={() => this.setState({ showPwd: !showPwd })}>
              <Text>{showPwd ? '🙈' : '👁️'}</Text>
            </View>
          </View>

          <View
            className={`auth-submit-btn ${loading ? 'disabled' : ''}`}
            onClick={this.handleLogin.bind(this)}
          >
            <Text>{loading ? '登录中...' : '登录'}</Text>
          </View>

          <View className='auth-switch'>
            <Text className='auth-switch-text'>没有账号？</Text>
            <Text
              className='auth-switch-link'
              onClick={() => Taro.navigateTo({ url: '/pages/register/index' })}
            >
              去注册
            </Text>
          </View>
        </View>
      </View>
    )
  }
}
