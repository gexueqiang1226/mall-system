import { Component } from 'react'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.css'
import api from '@/services/api'

interface FavItem {
  id: number
  productId: number
  productName: string
  productImage: string
  productPrice: number
}

interface FavoritesState {
  favorites: FavItem[]
  loading: boolean
}

export default class Favorites extends Component<{}, FavoritesState> {
  constructor(props) {
    super(props)
    this.state = { favorites: [], loading: false }
  }

  componentDidMount() { this.loadFavorites() }

  loadFavorites = async () => {
    const userInfo = Taro.getStorageSync('USER_INFO')
    if (!userInfo?.userId) { Taro.showToast({ title: '请先登录', icon: 'error' }); return }
    this.setState({ loading: true })
    try {
      const res = await api.get('/favorites', { userId: userInfo.userId })
      this.setState({ favorites: res.data || [], loading: false })
    } catch { this.setState({ loading: false }) }
  }

  removeFavorite = async (id: number, e: any) => {
    e.stopPropagation()
    try {
      await api.delete(`/favorites/${id}`)
      Taro.showToast({ title: '已取消收藏', icon: 'success' })
      this.loadFavorites()
    } catch { Taro.showToast({ title: '操作失败', icon: 'error' }) }
  }

  goToDetail = (productId: number) => Taro.navigateTo({ url: `/pages/product/detail/index?id=${productId}` })
  goBack = () => Taro.navigateBack()

  render() {
    const { favorites, loading } = this.state
    return (
      <View className="favorites-page">
        <View className="fav-header">
          <View className="fav-back" onClick={this.goBack}><Text>‹</Text></View>
          <Text className="fav-title">我的收藏</Text>
          <View style={{ width: '32px' }} />
        </View>
        <ScrollView scrollY className="fav-scroll">
          {loading && <View className="loading-spinner" />}
          {favorites.map((f) => (
            <View key={f.id} className="fav-card" onClick={() => this.goToDetail(f.productId)}>
              {f.productImage ? (
                <Image src={f.productImage} mode="aspectFill" className="fav-img" />
              ) : (
                <View className="fav-img" style={{ background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: '20px' }}>📦</Text></View>
              )}
              <View className="fav-info">
                <Text className="fav-name" numberOfLines={2}>{f.productName}</Text>
                <Text className="fav-price">¥{f.productPrice}</Text>
              </View>
              <View className="fav-del" onClick={(e) => this.removeFavorite(f.id, e)}>
                <Text className="fav-del-text">取消</Text>
              </View>
            </View>
          ))}
          {!loading && favorites.length === 0 && <View className="empty-state">暂无收藏</View>}
        </ScrollView>
      </View>
    )
  }
}
