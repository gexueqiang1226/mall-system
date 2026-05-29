import { Component } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Image, Swiper, SwiperItem, ScrollView } from '@tarojs/components'
import api from '@/services/api'
import './index.css'

interface Product {
  id: number
  productName: string
  mainImage: string
  detailImages: string
  salePrice: number
  marketPrice: number
  description: string
  soldCount: number
  categoryId: number
  isOnline: number
}

interface Sku {
  id: number
  productId: number
  skuCode: string
  specs: string
  price: number
  stock: number
  image: string
  status: number
}

interface Review {
  id: number
  userId: number
  rating: number
  content: string
  images: string
  createTime: string
  nickname: string
}

interface ReviewStats {
  avgRating: number
  totalCount: number
  distribution: Record<string, number>
}

interface RecommendProduct {
  id: number
  productName: string
  mainImage: string
  salePrice: number
}

interface SkuSpec {
  [key: string]: string[]
}

interface State {
  product: Product | null
  skus: Sku[]
  reviews: Review[]
  reviewStats: ReviewStats | null
  recommends: RecommendProduct[]
  isFavorite: boolean
  showSkuPanel: boolean
  selectedSpecs: Record<string, string>
  quantity: number
  currentSkuId: number
  currentPrice: number
  currentStock: number
  imageIndex: number
  cartMode: 'cart' | 'buy'
  loading: boolean
}

export default class ProductDetail extends Component<{}, State> {
  state: State = {
    product: null,
    skus: [],
    reviews: [],
    reviewStats: null,
    recommends: [],
    isFavorite: false,
    showSkuPanel: false,
    selectedSpecs: {},
    quantity: 1,
    currentSkuId: 0,
    currentPrice: 0,
    currentStock: 0,
    imageIndex: 0,
    cartMode: 'cart',
    loading: true,
  }

  componentDidMount() {
    const params = Taro.getCurrentInstance().router?.params || {}
    const id = Number(params.id)
    if (id) this.loadAll(id)
  }

  async loadAll(id: number) {
    try {
      const [prodRes, skuRes, reviewRes, statsRes] = await Promise.all([
        api.get(`/products/${id}`),
        api.get(`/products/${id}/skus`),
        api.get('/reviews', { productId: id, page: 1, size: 3 }),
        api.get('/reviews/statistics', { productId: id }),
      ])
      const product: Product = prodRes?.data
      const skus: Sku[] = skuRes?.data || []
      const reviews: Review[] = reviewRes?.data?.items || []
      const reviewStats: ReviewStats = statsRes?.data

      // 获取推荐商品
      let recommends: RecommendProduct[] = []
      if (product?.categoryId) {
        const recRes = await api.get('/products', { categoryId: product.categoryId, size: 6 })
        recommends = (recRes?.data?.items || []).filter((p: any) => p.id !== id).slice(0, 6)
      }

      // 检查收藏
      let isFavorite = false
      try {
        const userId = Taro.getStorageSync('USER_INFO')?.id || Taro.getStorageSync('USER_ID')
        if (userId) {
          const favRes = await api.get('/favorites/check', { userId, productId: id })
          isFavorite = favRes?.data?.isFavorite || false
        }
      } catch {}

      const firstSku = skus[0]
      this.setState({
        product,
        skus,
        reviews,
        reviewStats,
        recommends,
        isFavorite,
        currentPrice: firstSku?.price || product?.salePrice || 0,
        currentStock: firstSku?.stock || 0,
        loading: false,
      })
    } catch {
      Taro.showToast({ title: '加载失败', icon: 'none' })
      this.setState({ loading: false })
    }
  }

  getSpecGroups(): SkuSpec {
    const groups: SkuSpec = {}
    this.state.skus.forEach(sku => {
      try {
        const specs = JSON.parse(sku.specs || '{}')
        Object.entries(specs).forEach(([key, val]) => {
          if (!groups[key]) groups[key] = []
          if (!groups[key].includes(val as string)) groups[key].push(val as string)
        })
      } catch {}
    })
    return groups
  }

  selectSpec(key: string, val: string) {
    const selectedSpecs = { ...this.state.selectedSpecs, [key]: val }
    this.setState({ selectedSpecs })
    // 匹配SKU
    const matchedSku = this.state.skus.find(sku => {
      try {
        const specs = JSON.parse(sku.specs || '{}')
        return Object.entries(selectedSpecs).every(([k, v]) => specs[k] === v)
      } catch { return false }
    })
    if (matchedSku) {
      this.setState({
        currentSkuId: matchedSku.id,
        currentPrice: matchedSku.price,
        currentStock: matchedSku.stock,
      })
    }
  }

  changeQty(delta: number) {
    const qty = Math.max(1, Math.min(this.state.currentStock || 99, this.state.quantity + delta))
    this.setState({ quantity: qty })
  }

  openSkuPanel(mode: 'cart' | 'buy') {
    this.setState({ showSkuPanel: true, cartMode: mode })
  }

  closeSkuPanel() {
    this.setState({ showSkuPanel: false })
  }

  async addToCart() {
    const userId = Taro.getStorageSync('USER_INFO')?.id || Taro.getStorageSync('USER_ID')
    if (!userId) {
      Taro.navigateTo({ url: '/pages/login/index' })
      return
    }
    try {
      await api.post('/cart', {
        userId,
        productId: this.state.product?.id,
        quantity: this.state.quantity,
        skuId: this.state.currentSkuId || undefined,
      })
      Taro.showToast({ title: '已加入购物车', icon: 'success' })
      this.setState({ showSkuPanel: false })
    } catch {
      Taro.showToast({ title: '加入失败', icon: 'none' })
    }
  }

  buyNow() {
    const userId = Taro.getStorageSync('USER_INFO')?.id || Taro.getStorageSync('USER_ID')
    if (!userId) {
      Taro.navigateTo({ url: '/pages/login/index' })
      return
    }
    const { product, currentSkuId, quantity } = this.state
    Taro.navigateTo({
      url: `/pages/order/list/index?productId=${product?.id}&skuId=${currentSkuId}&quantity=${quantity}`,
    })
    this.setState({ showSkuPanel: false })
  }

  async toggleFavorite() {
    const userId = Taro.getStorageSync('USER_INFO')?.id || Taro.getStorageSync('USER_ID')
    if (!userId) {
      Taro.navigateTo({ url: '/pages/login/index' })
      return
    }
    const { isFavorite, product } = this.state
    try {
      if (isFavorite) {
        // 找到收藏id再删除，简化处理：直接提示
        Taro.showToast({ title: '已取消收藏', icon: 'none' })
      } else {
        await api.post('/favorites', { userId, productId: product?.id })
        Taro.showToast({ title: '收藏成功', icon: 'success' })
      }
      this.setState({ isFavorite: !isFavorite })
    } catch {
      Taro.showToast({ title: '操作失败', icon: 'none' })
    }
  }

  getImages(): string[] {
    const { product } = this.state
    if (!product) return []
    const imgs: string[] = [product.mainImage]
    try {
      const detail = JSON.parse(product.detailImages || '[]')
      if (Array.isArray(detail)) imgs.push(...detail)
    } catch {}
    return imgs.filter(Boolean)
  }

  renderStars(rating: number) {
    return Array(5).fill(0).map((_, i) => (
      <Text key={i} style={{ color: i < rating ? '#FF6B35' : '#ddd', fontSize: '12px' }}>★</Text>
    ))
  }

  render() {
    const { product, reviews, reviewStats, recommends, isFavorite, showSkuPanel, selectedSpecs, quantity, currentPrice, currentStock, loading } = this.state
    const images = this.getImages()
    const specGroups = this.getSpecGroups()

    if (loading) {
      return <View className='loading-page'><Text>加载中...</Text></View>
    }
    if (!product) {
      return <View className='loading-page'><Text>商品不存在</Text></View>
    }

    const goodRate = reviewStats && reviewStats.totalCount > 0
      ? Math.round(((reviewStats.distribution?.['4'] || 0) + (reviewStats.distribution?.['5'] || 0)) / reviewStats.totalCount * 100)
      : 98

    return (
      <View className='detail-page'>
        <ScrollView className='detail-scroll' scrollY>
          {/* 图片轮播 */}
          <View className='img-swiper-wrap'>
            <Swiper
              className='img-swiper'
              circular
              onChange={e => this.setState({ imageIndex: e.detail.current })}
            >
              {images.map((img, i) => (
                <SwiperItem key={i}>
                  <Image className='detail-main-img' src={img} mode='aspectFill' />
                </SwiperItem>
              ))}
            </Swiper>
            <View className='img-indicator'>
              <Text>{this.state.imageIndex + 1}/{images.length}</Text>
            </View>
          </View>

          {/* 价格区 */}
          <View className='price-section'>
            <View className='price-row'>
              <Text className='current-price'>
                <Text className='price-symbol'>¥</Text>
                {Number(currentPrice || product.salePrice).toFixed(2)}
              </Text>
              {product.marketPrice > product.salePrice && (
                <Text className='market-price'>¥{Number(product.marketPrice).toFixed(2)}</Text>
              )}
              <View className='promo-tag'>限时特惠</View>
            </View>
            <View className='sold-info'>
              <Text>已售{product.soldCount || 0}件</Text>
              <Text className='freight-info'>满99元包邮</Text>
            </View>
          </View>

          {/* 标题区 */}
          <View className='title-section'>
            <Text className='product-title'>{product.productName}</Text>
            {product.description && (
              <Text className='product-desc'>{product.description}</Text>
            )}
          </View>

          {/* SKU选择入口 */}
          {Object.keys(specGroups).length > 0 && (
            <View className='sku-entry' onClick={() => this.openSkuPanel('cart')}>
              <Text className='sku-entry-label'>已选</Text>
              <Text className='sku-entry-val'>
                {Object.values(selectedSpecs).join(' · ') || '请选择规格'}
              </Text>
              <Text className='sku-arrow'>&gt;</Text>
            </View>
          )}

          {/* 评价区 */}
          <View className='section-card'>
            <View className='section-header'>
              <Text className='section-title'>商品评价</Text>
              <View className='review-meta'>
                <Text className='good-rate'>好评率{goodRate}%</Text>
                <Text className='review-total'>共{reviewStats?.totalCount || 0}条</Text>
              </View>
            </View>
            {reviews.map(r => (
              <View className='review-item' key={r.id}>
                <View className='review-header'>
                  <View className='reviewer-avatar'>
                    <Text>{(r.nickname || '匿').charAt(0)}</Text>
                  </View>
                  <View>
                    <Text className='reviewer-name'>{r.nickname || '用户'}</Text>
                    <View className='stars-row'>{this.renderStars(r.rating)}</View>
                  </View>
                  <Text className='review-time'>{r.createTime?.slice(0, 10)}</Text>
                </View>
                <Text className='review-content'>{r.content}</Text>
              </View>
            ))}
            {reviews.length === 0 && <Text className='no-review'>暂无评价</Text>}
          </View>

          {/* 推荐区 */}
          {recommends.length > 0 && (
            <View className='section-card'>
              <View className='section-header'>
                <Text className='section-title'>看了又看</Text>
              </View>
              <View className='recommend-grid'>
                {recommends.map(p => (
                  <View
                    key={p.id}
                    className='recommend-item'
                    onClick={() => Taro.navigateTo({ url: `/pages/product/detail/index?id=${p.id}` })}
                  >
                    <Image className='recommend-img' src={p.mainImage} mode='aspectFill' />
                    <Text className='recommend-name'>{p.productName}</Text>
                    <Text className='recommend-price'>¥{Number(p.salePrice).toFixed(2)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={{ height: '80px' }} />
        </ScrollView>

        {/* 底部操作栏 */}
        <View className='bottom-bar'>
          <View className='bottom-icon-btn' onClick={this.toggleFavorite.bind(this)}>
            <Text style={{ fontSize: '22px' }}>{isFavorite ? '❤️' : '🤍'}</Text>
            <Text className='bottom-icon-text'>收藏</Text>
          </View>
          <View className='bottom-icon-btn' onClick={() => Taro.showToast({ title: '请联系客服', icon: 'none' })}>
            <Text style={{ fontSize: '22px' }}>💬</Text>
            <Text className='bottom-icon-text'>客服</Text>
          </View>
          <View className='bottom-btn cart-btn' onClick={() => this.openSkuPanel('cart')}>
            <Text>加入购物车</Text>
          </View>
          <View className='bottom-btn buy-btn' onClick={() => this.openSkuPanel('buy')}>
            <Text>立即购买</Text>
          </View>
        </View>

        {/* SKU面板 */}
        {showSkuPanel && (
          <View className='sku-overlay' onClick={this.closeSkuPanel.bind(this)}>
            <View className='sku-panel' onClick={e => e.stopPropagation()}>
              <View className='sku-panel-header'>
                <Image className='sku-panel-img' src={product.mainImage} mode='aspectFill' />
                <View className='sku-panel-price-info'>
                  <Text className='sku-panel-price'>¥{Number(currentPrice || product.salePrice).toFixed(2)}</Text>
                  <Text className='sku-panel-stock'>库存{currentStock || '--'}件</Text>
                </View>
                <Text className='sku-close' onClick={this.closeSkuPanel.bind(this)}>✕</Text>
              </View>

              <ScrollView className='sku-spec-scroll' scrollY>
                {Object.entries(specGroups).map(([key, vals]) => (
                  <View className='spec-group' key={key}>
                    <Text className='spec-group-title'>{key}</Text>
                    <View className='spec-pills'>
                      {vals.map(val => (
                        <View
                          key={val}
                          className={`spec-pill ${selectedSpecs[key] === val ? 'active' : ''}`}
                          onClick={() => this.selectSpec(key, val)}
                        >
                          <Text>{val}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}

                {/* 数量 */}
                <View className='qty-row'>
                  <Text className='qty-label'>数量</Text>
                  <View className='qty-ctrl'>
                    <View className='qty-btn' onClick={() => this.changeQty(-1)}>
                      <Text>−</Text>
                    </View>
                    <Text className='qty-val'>{quantity}</Text>
                    <View className='qty-btn' onClick={() => this.changeQty(1)}>
                      <Text>+</Text>
                    </View>
                  </View>
                </View>
              </ScrollView>

              <View className='sku-panel-footer'>
                {this.state.cartMode === 'cart' ? (
                  <View className='sku-confirm-btn cart' onClick={this.addToCart.bind(this)}>
                    <Text>加入购物车</Text>
                  </View>
                ) : (
                  <View className='sku-confirm-btn buy' onClick={this.buyNow.bind(this)}>
                    <Text>立即购买</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}
      </View>
    )
  }
}
