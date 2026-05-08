import { Component } from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.css'

interface OrderDetailState {
  orderId: string
}

export default class OrderDetail extends Component<{}, OrderDetailState> {
  constructor(props) {
    super(props)
    this.state = {
      orderId: '',
    }
  }

  componentDidMount() {
    const pages = Taro.getCurrentPages()
    const currentPage = pages[pages.length - 1]
    const { id } = currentPage.options as any
    this.setState({ orderId: id })
  }

  goToHome = () => {
    Taro.switchTab({
      url: '/pages/index/index',
    })
  }

  render() {
    const { orderId } = this.state

    return (
      <View className="detail-container">
        <View className="success-icon">✓</View>
        <Text className="success-title">订单已提交</Text>
        <Text className="order-number">订单号: {orderId}</Text>
        <Text className="order-tip">我们已收到您的订单，请耐心等待发货</Text>
        <Button className="btn-home" onClick={this.goToHome}>
          返回首页
        </Button>
      </View>
    )
  }
}
