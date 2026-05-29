import { Component } from 'react'
import { View, ScrollView, Text, Image, Swiper, SwiperItem } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.css'
import api from '@/services/api'

interface Banner {
  id: number
  imageUrl: string
  title: string
}

interface Product {
  id: number
  productName: string
  mainImage: string
  salePrice: number
  marketPrice: number
  costPrice: number
  sellableStock: number
  isOnline: number
  isRecommend: number
  soldCount: number
  categoryId: number
}

interface CategoryItem {
  id: number
  categoryName: string
  parentId: number
}

interface HomePageState {
  banners: Banner[]
  categories: CategoryItem[]
  allProducts: Product[]
  flashProducts: Product[]
  hotProducts: Product[]
  newProducts: Product[]
  recommendProducts: Product[]
  loading: boolean
  countdown: { hours: number; minutes: number; seconds: number }
  failedImages: Set<number>
}

const CAT_EMOJIS: Record<string, string> = {
  '水果': '🍎', '蔬菜': '🥬', '肉类': '🍗', '粮油': '🌾', '牛奶': '🥛',
  '零食': '🍬', '饮料': '🥤', '海鲜': '🦐', '母婴': '👶', '个护': '🧴',
  '家居': '🏠', '禽蛋': '🥚', '电子产品': '📱', '服装鞋帽': '👔',
  '美妆护肤': '💄', '食品饮料': '🍔', '家居生活': '🏡', '母婴用品': '🍼',
  '运动户外': '⚽', '更多分类': '📦',
}

export default class Index extends Component<{}, HomePageState> {
  private countdownTimer: ReturnType<typeof setInterval> | null = null

  constructor(props) {
    super(props)
    this.state = {
      banners: [
        { id: 1, imageUrl: '', title: '新人专享 首单立减50' },
        { id: 2, imageUrl: '', title: '限时特卖 全场5折起' },
        { id: 3, imageUrl: '', title: '会员日 双倍积分' },
      ],
      categories: [],
      allProducts: [],
      flashProducts: [],
      hotProducts: [],
      newProducts: [],
      recommendProducts: [],
      loading: true,
      countdown: { hours: 0, minutes: 0, seconds: 0 },
      failedImages: new Set(),
    }
  }

  componentDidMount() {
    this.loadData()
    this.startCountdown()
  }

  componentWillUnmount() {
    if (this.countdownTimer) clearInterval(this.countdownTimer)
  }

  startCountdown = () => {
    const calcEndOfDay = () => {
      const now = new Date()
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
      return Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000))
    }
    const update = () => {
      const diff = calcEndOfDay()
      this.setState({
        countdown: {
          hours: Math.floor(diff / 3600),
          minutes: Math.floor((diff % 3600) / 60),
          seconds: diff % 60,
        },
      })
    }
    update()
    this.countdownTimer = setInterval(update, 1000)
  }

  loadData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get('/products', { size: 100, isOnline: 1 }),
        api.get('/categories'),
      ])
      const allProducts: Product[] = (prodRes.data?.items || []).map((p: Product) => ({
        ...p, mainImage: p.mainImage || '',
      }))
      const categories: CategoryItem[] = catRes.data || []

      const flashProducts = allProducts.slice(0, 4)

      let hotProducts = allProducts.filter((p) => p.isRecommend === 1)
      if (hotProducts.length < 4) {
        hotProducts = [...allProducts].sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0)).slice(0, 6)
      } else {
        hotProducts = hotProducts.slice(0, 6)
      }

      const newProducts = [...allProducts].sort((a, b) => (b.id || 0) - (a.id || 0)).slice(0, 6)

      const browseHistory: number[] = JSON.parse(Taro.getStorageSync('SAM_BROWSE') || '[]')
      let recommendProducts: Product[] = []
      if (browseHistory.length > 0) {
        const catFreq: Record<number, number> = {}
        browseHistory.forEach((pid) => {
          const p = allProducts.find((x) => x.id === pid)
          if (p && p.categoryId) catFreq[p.categoryId] = (catFreq[p.categoryId] || 0) + 1
        })
        const topCats = Object.keys(catFreq).sort((a, b) => catFreq[+b] - catFreq[+a]).slice(0, 3)
        recommendProducts = allProducts.filter((p) => topCats.includes(String(p.categoryId))).slice(0, 6)
      }
      if (recommendProducts.length < 4) {
        recommendProducts = [...allProducts].sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0)).slice(0, 6)
      }

      this.setState({
        allProducts, categories, flashProducts, hotProducts, newProducts, recommendProducts, loading: false,
      })
    } catch (error) {
      console.error('加载数据失败:', error)
      this.setState({ loading: false })
    }
  }

  goToProductDetail = (productId: number) => {
    Taro.navigateTo({ url: `/pages/product/detail/index?id=${productId}` })
  }

  goToSearch = () => {
    Taro.navigateTo({ url: '/pages/search/index' })
  }

  goToCategory = (categoryId: number) => {
    Taro.switchTab({ url: '/pages/product/list/index' })
  }

  addToCart = async (product: Product, e: any) => {
    e.stopPropagation()
    const userInfo = Taro.getStorageSync('USER_INFO')
    if (!userInfo || !userInfo.userId) {
      Taro.showToast({ title: '请先登录', icon: 'error' })
      setTimeout(() => Taro.navigateTo({ url: '/pages/login/index' }), 1000)
      return
    }
    try {
      await api.post('/cart', { userId: userInfo.userId, productId: product.id, quantity: 1 })
      Taro.showToast({ title: '已加入购物车', icon: 'success' })
    } catch (error) {
      Taro.showToast({ title: '操作失败', icon: 'error' })
    }
  }

  handleImageError = (productId: number) => {
    this.setState((prev) => {
      const failedImages = new Set(prev.failedImages)
      failedImages.add(productId)
      return { failedImages }
    })
  }

  padZero = (n: number) => (n < 10 ? `0${n}` : `${n}`)

  renderProductImage = (product: Product, className: string) => {
    const { failedImages } = this.state
    if (failedImages.has(product.id) || !product.mainImage) {
      return (
        <View className={className} style={{ background: '#F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: '28px' }}>📦</Text>
        </View>
      )
    }
    return <Image src={product.mainImage} mode="aspectFill" className={className} onError={() => this.handleImageError(product.id)} />
  }

  render() {
    const { banners, categories, flashProducts, hotProducts, newProducts, recommendProducts, countdown, loading } = this.state

    if (loading) {
      return (
        <View className="home-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
          <View className="loading-spinner" />
        </View>
      )
    }

    const parentCats = categories.filter((c) => !c.parentId || c.parentId === 0).slice(0, 12)
    const displayCats = parentCats.length > 0 ? parentCats : categories.slice(0, 12)

    return (
      <View className="home-page">
        {/* Search Bar */}
        <View className="search-bar" onClick={this.goToSearch}>
          <View className="search-input-wrap">
            <Text className="search-placeholder">搜索商品</Text>
          </View>
        </View>

        <ScrollView scrollY className="home-scroll">
          {/* Banner Swiper — matching old .banner-section */}
          <View className="banner-section">
            <Swiper className="banner-swiper" indicatorDots autoplay interval={3000} circular indicatorColor="rgba(255,255,255,0.5)" indicatorActiveColor="#FFFFFF">
              {banners.map((banner) => (
                <SwiperItem key={banner.id}>
                  <View className="banner-slide" style={{ background: 'linear-gradient(135deg, #0056B3 0%, #0078E7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '150px' }}>
                    <View className="banner-text">
                      <Text style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>{banner.title}</Text>
                    </View>
                  </View>
                </SwiperItem>
              ))}
            </Swiper>
          </View>

          {/* Category Grid */}
          {displayCats.length > 0 && (
            <View className="section-card category-section">
              <View className="category-grid">
                {displayCats.map((cat) => (
                  <View key={cat.id} className="category-item" onClick={() => this.goToCategory(cat.id)}>
                    <View className="category-icon-circle">
                      <Text style={{ fontSize: '28px' }}>{CAT_EMOJIS[cat.categoryName] || '📦'}</Text>
                    </View>
                    <Text className="category-name">{cat.categoryName}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Flash Sale / Seckill */}
          {flashProducts.length > 0 && (
            <View className="section-card flash-section">
              <View className="section-header">
                <View className="section-header-left">
                  <Text className="flash-title">限时秒杀</Text>
                  <View className="countdown-wrap">
                    <Text className="countdown-num">{this.padZero(countdown.hours)}</Text>
                    <Text className="countdown-sep">:</Text>
                    <Text className="countdown-num">{this.padZero(countdown.minutes)}</Text>
                    <Text className="countdown-sep">:</Text>
                    <Text className="countdown-num">{this.padZero(countdown.seconds)}</Text>
                  </View>
                </View>
              </View>
              <ScrollView scrollX className="flash-scroll">
                {flashProducts.map((product) => {
                  const seckillPrice = (product.salePrice * 0.6).toFixed(2)
                  const soldPercent = Math.min(95, Math.round(Math.random() * 60 + 30))
                  return (
                    <View key={product.id} className="seckill-card" onClick={() => this.goToProductDetail(product.id)}>
                      {this.renderProductImage(product, 'seckill-card-img')}
                      <View className="seckill-card-body">
                        <Text className="seckill-card-name" numberOfLines={1}>{product.productName}</Text>
                        <View className="seckill-card-prices">
                          <Text className="seckill-card-seckill">¥{seckillPrice}</Text>
                          <Text className="seckill-card-original">¥{product.salePrice}</Text>
                        </View>
                        <View className="seckill-progress-wrap">
                          <View className="seckill-progress-bar" style={{ width: `${soldPercent}%` }} />
                        </View>
                        <Text className="seckill-progress-text">已抢{soldPercent}%</Text>
                        <View className="seckill-card-btn" onClick={(e) => this.addToCart(product, e)}>
                          <Text className="seckill-card-btn-text">马上抢</Text>
                        </View>
                      </View>
                    </View>
                  )
                })}
              </ScrollView>
            </View>
          )}

          {/* Hot / Popular Recommendations */}
          {hotProducts.length > 0 && (
            <View className="section-card recommend-section">
              <View className="section-header">
                <Text className="section-title">人气推荐</Text>
              </View>
              <View className="recommend-grid">
                {hotProducts.map((product) => {
                  const soldOut = product.sellableStock !== undefined && product.sellableStock <= 0
                  return (
                    <View key={product.id} className="recommend-card" onClick={() => this.goToProductDetail(product.id)}>
                      <View className="recommend-img-wrap">
                        {this.renderProductImage(product, 'recommend-img')}
                        {soldOut && <View className="sold-out-badge"><Text className="sold-out-text">已售罄</Text></View>}
                      </View>
                      <View className="recommend-info">
                        <Text className="recommend-name" numberOfLines={2}>{product.productName}</Text>
                        <View className="recommend-bottom">
                          <View className="recommend-price-wrap">
                            <Text className="recommend-price">¥</Text>
                            <Text className="recommend-price-val">{product.salePrice}</Text>
                          </View>
                          {!soldOut && (
                            <View className="add-cart-btn" onClick={(e) => this.addToCart(product, e)}>
                              <Text style={{ color: '#fff', fontSize: '16px' }}>+</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  )
                })}
              </View>
            </View>
          )}

          {/* New Arrivals */}
          {newProducts.length > 0 && (
            <View className="section-card">
              <View className="section-header">
                <Text className="section-title">新品首发</Text>
              </View>
              <ScrollView scrollX className="flash-scroll">
                {newProducts.map((product) => (
                  <View key={product.id} className="new-arrival-card" onClick={() => this.goToProductDetail(product.id)}>
                    {this.renderProductImage(product, 'new-arrival-img')}
                    <Text className="new-arrival-name" numberOfLines={1}>{product.productName}</Text>
                    <Text className="new-arrival-price">¥{product.salePrice}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* VIP Card — matching old .member-card structure */}
          <View className="vip-card" onClick={() => Taro.switchTab({ url: '/pages/user/index' })}>
            <View className="vip-card-content">
              <View className="vip-icon">⭐</View>
              <View className="vip-info">
                <Text className="vip-title">卓越会员</Text>
                <Text className="vip-desc">享2%积分返利 · 专属优惠</Text>
              </View>
              <View className="vip-btn">
                <Text className="vip-btn-text">查看权益</Text>
              </View>
            </View>
          </View>

          {/* Personalized Recommendations */}
          {recommendProducts.length > 0 && (
            <View className="section-card recommend-section">
              <View className="section-header">
                <Text className="section-title">为你推荐</Text>
              </View>
              <View className="recommend-grid">
                {recommendProducts.map((product) => {
                  const soldOut = product.sellableStock !== undefined && product.sellableStock <= 0
                  return (
                    <View key={product.id} className="recommend-card" onClick={() => this.goToProductDetail(product.id)}>
                      <View className="recommend-img-wrap">
                        {this.renderProductImage(product, 'recommend-img')}
                        {soldOut && <View className="sold-out-badge"><Text className="sold-out-text">已售罄</Text></View>}
                      </View>
                      <View className="recommend-info">
                        <Text className="recommend-name" numberOfLines={2}>{product.productName}</Text>
                        <View className="recommend-bottom">
                          <View className="recommend-price-wrap">
                            <Text className="recommend-price">¥</Text>
                            <Text className="recommend-price-val">{product.salePrice}</Text>
                          </View>
                          {!soldOut && (
                            <View className="add-cart-btn" onClick={(e) => this.addToCart(product, e)}>
                              <Text style={{ color: '#fff', fontSize: '16px' }}>+</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  )
                })}
              </View>
            </View>
          )}

          {/* Footer */}
          <View className="home-footer">
            <Text className="footer-text">— 已经到底了 —</Text>
          </View>
        </ScrollView>
      </View>
    )
  }
}
