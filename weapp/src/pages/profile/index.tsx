import { Component } from 'react'
import Taro from '@tarojs/taro'
import { getStorage, setStorage, getUserId } from '@/utils/storage'
import { View, Text, Input, ScrollView } from '@tarojs/components'
import api from '@/services/api'
import './index.css'

interface State {
  nickname: string
  phone: string
  email: string
  userId: number
  loading: boolean
  saving: boolean
}

export default class Profile extends Component<{}, State> {
  state: State = {
    nickname: '',
    phone: '',
    email: '',
    userId: 0,
    loading: true,
    saving: false,
  }

  componentDidMount() {
    const userId = getUserId()
    if (!userId) { Taro.navigateTo({ url: '/pages/login/index' }); return }
    const userInfo = getStorage('USER_INFO')
    this.setState({
      userId,
      nickname: userInfo?.nickname || '',
      phone: userInfo?.phone || '',
      email: userInfo?.email || '',
      loading: false,
    })
  }

  async handleSave() {
    const { userId, nickname, phone, email, saving } = this.state
    if (!nickname.trim()) { Taro.showToast({ title: '请输入昵称', icon: 'none' }); return }
    if (saving) return
    this.setState({ saving: true })
    try {
      await api.put('/user/profile', { userId, nickname: nickname.trim(), phone: phone.trim(), email: email.trim() })
      const userInfo = getStorage('USER_INFO') || {}
      setStorage('USER_INFO', { ...userInfo, nickname: nickname.trim(), phone: phone.trim(), email: email.trim() })
      Taro.showToast({ title: '保存成功', icon: 'success' })
      this.setState({ saving: false })
    } catch {
      Taro.showToast({ title: '保存失败', icon: 'none' })
      this.setState({ saving: false })
    }
  }

  getAvatarText() {
    return (this.state.nickname || 'U').charAt(0).toUpperCase()
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
    const { nickname, phone, email, loading, saving } = this.state
    if (loading) return <View className='loading-page'><Text>加载中...</Text></View>

    return (
      <View className='profile-page'>
        <View className='detail-nav-bar'>
          <View className='detail-back-btn' onClick={this.goBack.bind(this)}>
            <Text className='detail-back-icon'>‹</Text>
          </View>
          <Text className='detail-nav-title'>个人资料</Text>
        </View>
        <ScrollView className='profile-scroll' scrollY>
          {/* 头像 */}
          <View className='avatar-section'>
            <View className='big-avatar'>
              <Text className='avatar-text'>{this.getAvatarText()}</Text>
            </View>
            <Text className='avatar-hint'>点击更换头像</Text>
          </View>

          {/* 表单 */}
          <View className='form-card'>
            <View className='form-item'>
              <Text className='form-label'>昵称</Text>
              <Input
                className='form-input'
                placeholder='请输入昵称'
                value={nickname}
                onInput={e => this.setState({ nickname: e.detail.value })}
              />
            </View>
            <View className='form-item'>
              <Text className='form-label'>手机号</Text>
              <Input
                className='form-input'
                placeholder='请输入手机号'
                type='number'
                value={phone}
                onInput={e => this.setState({ phone: e.detail.value })}
              />
            </View>
            <View className='form-item no-border'>
              <Text className='form-label'>邮箱</Text>
              <Input
                className='form-input'
                placeholder='请输入邮箱'
                type='email'
                value={email}
                onInput={e => this.setState({ email: e.detail.value })}
              />
            </View>
          </View>

          <View
            className={`save-btn ${saving ? 'disabled' : ''}`}
            onClick={this.handleSave.bind(this)}
          >
            <Text>{saving ? '保存中...' : '保存修改'}</Text>
          </View>
        </ScrollView>
      </View>
    )
  }
}
