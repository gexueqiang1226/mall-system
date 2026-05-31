import { Component } from 'react'
import Taro from '@tarojs/taro'
import { getUserId } from '@/utils/storage'
import { View, Text, ScrollView } from '@tarojs/components'
import api from '@/services/api'
import './index.css'

interface PointsHistory {
  id: number
  userId: number
  points: number
  type: string
  description: string
  createTime: string
}

interface State {
  balance: number
  history: PointsHistory[]
  loading: boolean
  page: number
  hasMore: boolean
  userId: number
}

export default class Points extends Component<{}, State> {
  state: State = {
    balance: 0,
    history: [],
    loading: false,
    page: 1,
    hasMore: true,
    userId: 0,
  }

  componentDidMount() {
    const userId = getUserId()
    this.setState({ userId }, () => { if (userId) this.loadData() })
  }

  async loadData(reset = true) {
    const { userId, page } = this.state
    const nextPage = reset ? 1 : page + 1
    this.setState({ loading: true })
    try {
      const [balRes, histRes] = await Promise.all([
        api.get('/points/balance', { userId }),
        api.get('/points/history', { userId, page: nextPage, size: 20 }),
      ])
      const balance = balRes?.data?.balance || 0
      const items: PointsHistory[] = histRes?.data?.items || []
      this.setState(prev => ({
        balance,
        history: reset ? items : [...prev.history, ...items],
        page: nextPage,
        hasMore: items.length >= 20,
        loading: false,
      }))
    } catch {
      Taro.showToast({ title: '加载失败', icon: 'none' })
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
    const { balance, history, loading, hasMore } = this.state

    return (
      <View className='points-page'>
        <View className='detail-nav-bar'>
          <View className='detail-back-btn' onClick={this.goBack.bind(this)}>
            <Text className='detail-back-icon'>‹</Text>
          </View>
          <Text className='detail-nav-title'>我的积分</Text>
        </View>
        {/* 积分余额卡片 */}
        <View className='balance-card'>
          <Text className='balance-label'>我的积分</Text>
          <Text className='balance-value'>{balance}</Text>
          <Text className='balance-hint'>100积分 = ¥1抵扣</Text>
          <View className='exchange-btn' onClick={() => Taro.showToast({ title: '积分兑换开发中', icon: 'none' })}>
            <Text>积分兑换</Text>
          </View>
        </View>

        {/* 明细列表 */}
        <ScrollView
          className='history-scroll'
          scrollY
          onScrollToLower={() => this.loadData(false)}
        >
          <Text className='list-title'>积分明细</Text>
          {history.map(item => (
            <View className='history-item' key={item.id}>
              <View className='history-left'>
                <Text className='history-desc'>{item.description}</Text>
                <Text className='history-time'>{item.createTime?.slice(0, 10)}</Text>
              </View>
              <Text className={`history-points ${item.points > 0 ? 'income' : 'expense'}`}>
                {item.points > 0 ? '+' : ''}{item.points}
              </Text>
            </View>
          ))}
          {loading && <View className='tip'>加载中...</View>}
          {!loading && !hasMore && history.length > 0 && <View className='tip'>— 已经到底了 —</View>}
          {!loading && history.length === 0 && (
            <View className='empty-tip'>
              <Text className='empty-icon'>⭐</Text>
              <Text className='empty-text'>暂无积分明细</Text>
            </View>
          )}
        </ScrollView>
      </View>
    )
  }
}
