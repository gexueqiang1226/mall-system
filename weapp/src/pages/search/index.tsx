import { Component } from 'react'
import { View, Text, Input, ScrollView, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.css'
import api from '@/services/api'

interface Product {
  id: number
  productName: string
  mainImage: string
  salePrice: number
  sellableStock: number
}

interface SearchState {
  keyword: string
  products: Product[]
  total: number
  loading: boolean
  searched: boolean
  failedImages: Set<number>
}

export default class Search extends Component<{}, SearchState> {
  constructor(props) {
    super(props)
    this.state = { keyword: '', products: [], total: 0, loading: false, searched: false, failedImages: new Set() }
  }

  componentDidMount() {
    const pages = Taro.getCurrentPages()
    const currentPage = pages[pages.length - 1]
    const keyword = currentPage.options?.keyword || ''
    if (keyword) {
      this.setState({ keyword }, () => this.doSearch())
    }
  }

  doSearch = async () => {
    const { keyword } = this.state
    if (!keyword.trim()) return
    this.setState({ loading: true, searched: true })
    try {
      const res = await api.get('/products', { keyword: keyword.trim(), size: 100 })
      const products = (res.data?.items || []).map((p: Product) => ({ ...p, mainImage: p.mainImage || '' }))
      this.setState({ products, total: res.data?.total || 0, loading: false })
    } catch (e) {
      this.setState({ loading: false })
    }
  }

  handleInput = (e) => this.setState({ keyword: e.detail.value })

  goToDetail = (id: number) => Taro.navigateTo({ url: `/pages/product/detail/index?id=${id}` })

  addToCart = async (p: Product, e: any) => {
    e.stopPropagation()
    const userInfo = Taro.getStorageSync('USER_INFO')
    if (!userInfo?.userId) { Taro.showToast({ title: '请先登录', icon: 'error' }); return }
    try {
      await api.post('/cart', { userId: userInfo.userId, productId: p.id, quantity: 1 })
      Taro.showToast({ title: '已加入购物车', icon: 'success' })
    } catch { Taro.showToast({ title: '操作失败', icon: 'error' }) }
  }

  handleImageError = (id: number) => {
    this.setState((prev) => { const s = new Set(prev.failedImages); s.add(id); return { failedImages: s } })
  }

  goBack = () => Taro.navigateBack()

  render() {
    const { keyword, products, total, loading, searched, failedImages } = this.state
    return (
      <View className="search-page">
        <View className="search-header">
          <View className="search-bar-row">
            <View className="search-back" onClick={this.goBack}><Text>‹</Text></View>
            <View className="search-input-box">
              <Input className="search-input" placeholder="搜索商品" value={keyword} onInput={this.handleInput} confirmType="search" onConfirm={this.doSearch} autoFocus />
            </View>
            <View className="search-btn" onClick={this.doSearch}><Text className="search-btn-text">搜索</Text></View>
          </View>
        </View>
        <ScrollView scrollY className="search-scroll">
          {searched && <Text className="search-count">搜索"{keyword}"，共{total}件商品</Text>}
          {loading && <View className="loading-spinner" />}
          {!loading && products.map((p) => {
            const soldOut = p.sellableStock !== undefined && p.sellableStock <= 0
            return (
              <View key={p.id} className="search-card" onClick={() => this.goToDetail(p.id)}>
                {failedImages.has(p.id) || !p.mainImage ? (
                  <View className="search-card-img" style={{ background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: '24px' }}>📦</Text></View>
                ) : (
                  <Image src={p.mainImage} mode="aspectFill" className="search-card-img" onError={() => this.handleImageError(p.id)} />
                )}
                <View className="search-card-info">
                  <Text className="search-card-name" numberOfLines={2}>{p.productName}</Text>
                  <View className="search-card-bottom">
                    <Text className="search-card-price">¥{p.salePrice}</Text>
                    {soldOut ? <Text className="search-card-soldout">已售罄</Text> : (
                      <View className="search-add-btn" onClick={(e) => this.addToCart(p, e)}><Text style={{ color: '#fff', fontSize: '14px' }}>+</Text></View>
                    )}
                  </View>
                </View>
              </View>
            )
          })}
          {!loading && searched && products.length === 0 && <View className="empty-state">未找到相关商品</View>}
        </ScrollView>
      </View>
    )
  }
}
