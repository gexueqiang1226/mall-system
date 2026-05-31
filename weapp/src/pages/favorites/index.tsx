import { Component } from 'react'
import Taro from '@tarojs/taro'
import { getStorage } from '@/utils/storage'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import api from '@/services/api'
import './index.css'

interface Favorite {
  id: number
  userId: number
  productId: number
  productName: string
  mainImage: string
  salePrice: number
}

interface State {
  favorites: Favorite[]
  loading: boolean
  userId: number
}

export default class Favorites extends Component<{}, State> {
  state: State = {
    favorites: [],
    loading: false,
    userId: 0,
  }

  componentDidMount() {
    const userInfo = getStorage('USER_INFO')
    const userId = userInfo?.id || getStorage('USER_ID') || 0
    this.setState({ userId }, () => { if (userId) this.loadFavorites() })
  }

  async loadFavorites() {
    const { userId } = this.state
    this.setState({ loading: true })
    try {
      const res = await api.get('/favorites', { userId })
      this.setState({ favorites: res?.data || [], loading: false })
    } catch {
      Taro.showToast({ title: '加载失败', icon: 'none' })
      this.setState({ loading: false })
    }
  }

  async removeFavorite(fav: Favorite) {
    try {
      await api.delete(`/favorites/${fav.id}`)
      this.setState(prev => ({ favorites: prev.favorites.filter(f => f.id !== fav.id) }))
      Taro.showToast({ title: '已取消收藏', icon: 'success' })
    } catch {
      Taro.showToast({ title: '操作失败', icon: 'none' })
    }
  }

  goProduct(productId: number) {
    Taro.navigateTo({ url: `/pages/product/detail/index?id=${productId}` })
  }

  goBack() {
    const pages = Taro.getCurrentPages()
    if (pages.length > 1) {
      Taro.navigateBack()
    } else {
      Taro.switchTab({ url: '/pages/user/index' })
    }
  }

  render() {
    const { favorites, loading } = this.state

    return (
      <View className='favorites-page'>
        <View className='detail-nav-bar'>
          <View className='detail-back-btn' onClick={this.goBack.bind(this)}>
            <Text className='detail-back-icon'>‹</Text>
          </View>
          <Text className='detail-nav-title'>我的收藏</Text>
        </View>
        <ScrollView className='fav-scroll' scrollY>
          {favorites.map(fav => (
            <View className='fav-item' key={fav.id} onClick={() => this.goProduct(fav.productId)}>
              <Image className='fav-img' src={fav.mainImage} mode='aspectFill' />
              <View className='fav-info'>
                <Text className='fav-name'>{fav.productName}</Text>
                <Text className='fav-price'>¥{Number(fav.salePrice).toFixed(2)}</Text>
              </View>
              <View className='fav-actions'>
                <View className='cart-btn' onClick={e => {
                  e.stopPropagation()
                  Taro.navigateTo({ url: `/pages/product/detail/index?id=${fav.productId}` })
                }}>
                  <Text>加购</Text>
                </View>
                <View className='remove-btn' onClick={e => { e.stopPropagation(); this.removeFavorite(fav) }}>
                  <Text>取消收藏</Text>
                </View>
              </View>
            </View>
          ))}

          {!loading && favorites.length === 0 && (
            <View className='empty-tip'>
              <Text className='empty-icon'>❤️</Text>
              <Text className='empty-text'>还没有收藏任何商品</Text>
              <View className='go-shop-btn' onClick={() => Taro.switchTab({ url: '/pages/index/index' })}>
                <Text>去逛逛</Text>
              </View>
            </View>
          )}
          {loading && <View className='loading-tip'>加载中...</View>}
        </ScrollView>
      </View>
    )
  }
}
