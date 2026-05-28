import { Component } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.css'
import api from '@/services/api'

interface ProfileState {
  user: any
  loading: boolean
}

export default class Profile extends Component<{}, ProfileState> {
  constructor(props) {
    super(props)
    this.state = { user: null, loading: true }
  }

  componentDidMount() { this.loadProfile() }

  loadProfile = async () => {
    const userInfo = Taro.getStorageSync('USER_INFO')
    if (!userInfo?.userId) { Taro.showToast({ title: '请先登录', icon: 'error' }); return }
    try {
      const res = await api.get('/user/profile', { userId: userInfo.userId })
      this.setState({ user: res.data || res, loading: false })
    } catch { this.setState({ loading: false }) }
  }

  doLogout = () => {
    Taro.showModal({
      title: '提示', content: '确定要退出登录吗？', confirmColor: '#E53935',
      success: (res) => {
        if (res.confirm) {
          Taro.removeStorageSync('USER_INFO')
          Taro.removeStorageSync('TOKEN')
          Taro.showToast({ title: '已退出', icon: 'success' })
          setTimeout(() => Taro.navigateBack(), 1000)
        }
      },
    })
  }

  goBack = () => Taro.navigateBack()

  formatTime = (t: string) => {
    if (!t) return ''
    const d = new Date(t)
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  }

  render() {
    const { user, loading } = this.state
    if (loading) return <View className="profile-page"><View className="loading-spinner" /></View>
    if (!user) return <View className="profile-page"><View className="empty-state">加载失败</View></View>
    const initial = (user.username || 'U').charAt(0).toUpperCase()
    return (
      <View className="profile-page">
        <View className="profile-header-bar">
          <View className="profile-back" onClick={this.goBack}><Text>‹</Text></View>
          <Text className="profile-page-title">个人资料</Text>
          <View style={{ width: '32px' }} />
        </View>
        <ScrollView scrollY className="profile-scroll">
          <View className="profile-avatar-section">
            <View className="profile-avatar-circle"><Text className="profile-avatar-text">{initial}</Text></View>
            <Text className="profile-username">{user.username}</Text>
          </View>
          <View className="section-card">
            <View className="profile-row">
              <Text className="profile-label">用户名</Text>
              <Text className="profile-val">{user.username}</Text>
            </View>
            <View className="profile-row">
              <Text className="profile-label">手机号</Text>
              <Text className="profile-val">{user.phone || '未绑定'}</Text>
            </View>
            <View className="profile-row">
              <Text className="profile-label">积分</Text>
              <Text className="profile-val">{user.points || 0}</Text>
            </View>
            <View className="profile-row">
              <Text className="profile-label">注册时间</Text>
              <Text className="profile-val">{this.formatTime(user.createTime || user.created_at)}</Text>
            </View>
          </View>
          <View className="logout-wrap">
            <View className="logout-btn" onClick={this.doLogout}><Text className="logout-text">退出登录</Text></View>
          </View>
        </ScrollView>
      </View>
    )
  }
}
