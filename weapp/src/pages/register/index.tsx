import { Component } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Input } from '@tarojs/components'
import { setStorage, normalizeUserInfo } from '@/utils/storage'
import api from '@/services/api'
import './index.css'

interface State {
  username: string
  password: string
  confirmPwd: string
  phone: string
  showPwd: boolean
  loading: boolean
}

export default class Register extends Component<{}, State> {
  state: State = {
    username: '',
    password: '',
    confirmPwd: '',
    phone: '',
    showPwd: false,
    loading: false,
  }

  async handleRegister() {
    const { username, password, confirmPwd, phone, loading } = this.state
    if (!username.trim()) { Taro.showToast({ title: '请输入用户名', icon: 'none' }); return }
    if (!password) { Taro.showToast({ title: '请输入密码', icon: 'none' }); return }
    if (password.length < 6) { Taro.showToast({ title: '密码至少6位', icon: 'none' }); return }
    if (password !== confirmPwd) { Taro.showToast({ title: '两次密码不一致', icon: 'none' }); return }
    if (!phone.trim()) { Taro.showToast({ title: '请输入手机号', icon: 'none' }); return }
    if (!/^1\d{10}$/.test(phone.trim())) { Taro.showToast({ title: '手机号格式不正确', icon: 'none' }); return }
    if (loading) return
    this.setState({ loading: true })
    try {
      const res = await api.post('/auth/register', { username: username.trim(), password, phone: phone.trim() })
      const data = res?.data || {}
      // 兼容后端扁平返回：{ userId, username, ... } 或嵌套返回：{ token, user: {...} }
      const user = normalizeUserInfo(data.user || data)
      const token = data.token
      if (!user?.id) {
        Taro.showToast({ title: '注册返回数据异常', icon: 'none' })
        this.setState({ loading: false })
        return
      }
      // 如果后端返回了token，保存token；否则只保存用户信息后跳转登录或我的页
      if (token) {
        setStorage('TOKEN', token)
      }
      setStorage('USER_INFO', user)
      setStorage('USER_ID', user.id)
      Taro.showToast({ title: '注册成功', icon: 'success' })
      setTimeout(() => {
        if (token) {
          Taro.switchTab({ url: '/pages/user/index' })
        } else {
          Taro.navigateTo({ url: '/pages/login/index' })
        }
      }, 800)
    } catch (e: any) {
      Taro.showToast({ title: e?.message || '注册失败', icon: 'none' })
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
    const { username, password, confirmPwd, phone, showPwd, loading } = this.state

    return (
      <View className='auth-page'>
        <View className='detail-nav-bar'>
          <View className='detail-back-btn' onClick={this.goBack.bind(this)}>
            <Text className='detail-back-icon'>‹</Text>
          </View>
          <Text className='detail-nav-title'>注册</Text>
        </View>
        <View className='auth-logo-wrap'>
          <View className='auth-logo'>
            <Text className='auth-logo-text'>S</Text>
          </View>
          <Text className='auth-brand'>SAM'S CLUB</Text>
          <Text className='auth-welcome'>创建账号</Text>
        </View>

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
              placeholder='请输入密码（至少6位）'
              password={!showPwd}
              value={password}
              onInput={e => this.setState({ password: e.detail.value })}
            />
            <View className='pwd-toggle' onClick={() => this.setState({ showPwd: !showPwd })}>
              <Text>{showPwd ? '🙈' : '👁️'}</Text>
            </View>
          </View>

          <View className='input-group'>
            <View className='input-icon'>🔒</View>
            <Input
              className='auth-input'
              placeholder='请确认密码'
              password={!showPwd}
              value={confirmPwd}
              onInput={e => this.setState({ confirmPwd: e.detail.value })}
            />
          </View>

          <View className='input-group'>
            <View className='input-icon'>📱</View>
            <Input
              className='auth-input'
              placeholder='请输入手机号'
              type='number'
              value={phone}
              onInput={e => this.setState({ phone: e.detail.value })}
            />
          </View>

          <View
            className={`auth-submit-btn ${loading ? 'disabled' : ''}`}
            onClick={this.handleRegister.bind(this)}
          >
            <Text>{loading ? '注册中...' : '注册'}</Text>
          </View>

          <View className='auth-switch'>
            <Text className='auth-switch-text'>已有账号？</Text>
            <Text
              className='auth-switch-link'
              onClick={() => Taro.navigateTo({ url: '/pages/login/index' })}
            >
              去登录
            </Text>
          </View>
        </View>
      </View>
    )
  }
}
