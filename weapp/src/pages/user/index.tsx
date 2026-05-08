import { Component } from 'react'
import { View, Text, Button, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.css'

interface UserState {
  userInfo: any
  isLogin: boolean
}

export default class User extends Component<{}, UserState> {
  constructor(props) {
    super(props)
    this.state = {
      userInfo: null,
      isLogin: false,
    }
  }

  componentDidMount() {
    this.checkLogin()
  }

  checkLogin = () => {
    const userInfo = Taro.getStorageSync('USER_INFO')
    if (userInfo) {
      this.setState({
        userInfo,
        isLogin: true,
      })
    }
  }

  handleLogin = () => {
    // 模拟登录
    const mockUserInfo = {
      nickName: '用户123456',
      avatarUrl: 'https://via.placeholder.com/100',
      phone: '138****0000',
    }
    Taro.setStorageSync('USER_INFO', mockUserInfo)
    this.setState({
      userInfo: mockUserInfo,
      isLogin: true,
    })
    Taro.showToast({
      title: '登录成功',
      icon: 'success',
    })
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
          this.setState({
            userInfo: null,
            isLogin: false,
          })
          Taro.showToast({
            title: '已退出',
            icon: 'success',
          })
        }
      },
    })
  }

  goToOrders = () => {
    Taro.navigateTo({
      url: '/pages/order/list/index',
    })
  }

  render() {
    const { userInfo, isLogin } = this.state

    if (!isLogin) {
      return (
        <View className="user-container">
          <View className="login-section">
            <View className="login-icon">👤</View>
            <Text className="login-text">未登录</Text>
            <Button className="btn-login" onClick={this.handleLogin}>
              立即登录
            </Button>
          </View>
        </View>
      )
    }

    return (
      <View className="user-container">
        <ScrollView scrollY>
          {/* 用户信息 */}
          <View className="user-info-section">
            <View className="avatar" style={`background-image: url(${userInfo.avatarUrl})`}></View>
            <View className="user-details">
              <Text className="user-name">{userInfo.nickName}</Text>
              <Text className="user-phone">{userInfo.phone}</Text>
            </View>
          </View>

          {/* 菜单 */}
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
              <Text className="menu-icon">⭐</Text>
              <Text className="menu-text">评价晒单</Text>
              <Text className="menu-arrow">></Text>
            </View>
            <View className="menu-item">
              <Text className="menu-icon">🎟️</Text>
              <Text className="menu-text">优惠券</Text>
              <Text className="menu-arrow">></Text>
            </View>
            <View className="menu-item">
              <Text className="menu-icon">⚙️</Text>
              <Text className="menu-text">设置</Text>
              <Text className="menu-arrow">></Text>
            </View>
          </View>

          {/* 底部 */}
          <View className="footer-section">
            <Button className="btn-logout" onClick={this.handleLogout}>
              退出登录
            </Button>
          </View>
        </ScrollView>
      </View>
    )
  }
}
