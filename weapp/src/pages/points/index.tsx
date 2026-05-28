import { Component } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.css'
import api from '@/services/api'

interface PointRecord {
  id: number
  points: number
  type: string
  description: string
  createTime: string
}

interface PointsState {
  balance: number
  history: PointRecord[]
  loading: boolean
}

export default class Points extends Component<{}, PointsState> {
  constructor(props) {
    super(props)
    this.state = { balance: 0, history: [], loading: false }
  }

  componentDidMount() { this.loadData() }

  loadData = async () => {
    const userInfo = Taro.getStorageSync('USER_INFO')
    if (!userInfo?.userId) { Taro.showToast({ title: '请先登录', icon: 'error' }); return }
    this.setState({ loading: true })
    try {
      const [balRes, histRes] = await Promise.all([
        api.get('/points/balance', { userId: userInfo.userId }),
        api.get('/points/history', { userId: userInfo.userId }),
      ])
      this.setState({
        balance: balRes.data?.balance || 0,
        history: histRes.data || [],
        loading: false,
      })
    } catch { this.setState({ loading: false }) }
  }

  exchangePoints = async (pts: number) => {
    const userInfo = Taro.getStorageSync('USER_INFO')
    if (!userInfo?.userId) return
    try {
      await api.post('/points/exchange', { userId: userInfo.userId, points: pts, type: 'coupon' })
      Taro.showToast({ title: '兑换成功', icon: 'success' })
      this.loadData()
    } catch { Taro.showToast({ title: '兑换失败', icon: 'error' }) }
  }

  goBack = () => Taro.navigateBack()

  formatTime = (t: string) => {
    if (!t) return ''
    const d = new Date(t)
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
  }

  render() {
    const { balance, history, loading } = this.state
    return (
      <View className="points-page">
        <View className="points-header-bar">
          <View className="points-back" onClick={this.goBack}><Text>‹</Text></View>
          <Text className="points-page-title">积分中心</Text>
          <View style={{ width: '32px' }} />
        </View>
        <ScrollView scrollY className="points-scroll">
          <View className="points-balance-card">
            <Text className="points-balance-num">{balance}</Text>
            <Text className="points-balance-label">我的积分</Text>
          </View>
          <View className="section-card">
            <View className="section-header"><Text className="section-title">积分兑换</Text></View>
            <View className="exchange-list">
              <View className="exchange-btn" onClick={() => this.exchangePoints(100)}><Text className="exchange-btn-text">100积分 → 满50减10券</Text></View>
              <View className="exchange-btn" onClick={() => this.exchangePoints(500)}><Text className="exchange-btn-text">500积分 → 满200减50券</Text></View>
            </View>
          </View>
          <View className="section-card">
            <View className="section-header"><Text className="section-title">积分明细</Text></View>
            {loading && <View className="loading-spinner" />}
            {!loading && history.map((h) => {
              const isPlus = h.points > 0
              return (
                <View key={h.id} className="points-item">
                  <View className="points-item-info">
                    <Text className="points-item-type">{h.type || h.description || '积分变动'}</Text>
                    <Text className="points-item-time">{this.formatTime(h.createTime)}</Text>
                  </View>
                  <Text className={`points-item-val ${isPlus ? 'plus' : 'minus'}`}>{isPlus ? '+' : ''}{h.points}</Text>
                </View>
              )
            })}
            {!loading && history.length === 0 && <View className="empty-state">暂无积分记录</View>}
          </View>
        </ScrollView>
      </View>
    )
  }
}
