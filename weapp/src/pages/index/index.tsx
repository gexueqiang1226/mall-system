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
  sellableStock: number
  isOnline: number
}

interface CategoryItem {
  id: number
  name: string
  icon: string
}

interface HomePageState {
  banners: Banner[]
  categories: CategoryItem[]
  flashProducts: Product[]
  hotProducts: Product[]
  loading: boolean
  countdown: { hours: number; minutes: number; seconds: number }
  failedImages: Set<number>
}

export default class Index extends Component<{}, HomePageState> {
  private countdownTimer: ReturnType<typeof setInterval> | null = null

  constructor(props) {
    super(props)
    this.state = {
      banners: [
        { id: 1, imageUrl: '', title: '新品上市' },
        { id: 2, imageUrl: '', title: '限时优惠' },
        { id: 3, imageUrl: '', title: '热卖商品' },
      ],
      categories: [
        { id: 1, name: '电子产品', icon: 'electronics' },
        { id: 2, name: '服装鞋帽', icon: 'clothing' },
        { id: 3, name: '美妆护肤', icon: 'beauty' },
        { id: 4, name: '食品饮料', icon: 'food' },
        { id: 5, name: '家居生活', icon: 'home' },
        { id: 6, name: '母婴用品', icon: 'baby' },
        { id: 7, name: '运动户外', icon: 'sports' },
        { id: 8, name: '更多分类', icon: 'more' },
      ],
      flashProducts: [],
      hotProducts: [],
      loading: true,
      countdown: { hours: 2, minutes: 30, seconds: 0 },
      failedImages: new Set(),
    }
  }

  componentDidMount() {
    this.loadProducts()
    this.startCountdown()
  }

  componentWillUnmount() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer)
    }
  }

  startCountdown = () => {
    this.countdownTimer = setInterval(() => {
      this.setState((prev) => {
        let { hours, minutes, seconds } = prev.countdown
        seconds--
        if (seconds < 0) {
          seconds = 59
          minutes--
        }
        if (minutes < 0) {
          minutes = 59
          hours--
        }
        if (hours < 0) {
          return { countdown: { hours: 2, minutes: 30, seconds: 0 } }
        }
        return { countdown: { hours, minutes, seconds } }
      })
    }, 1000)
  }

  loadProducts = async () => {
    try {
      const hotRes = await api.get('/products', { isOnline: 1, page: 1, size: 6 })
      const flashRes = await api.get('/products', { isOnline: 1, page: 1, size: 8 })

      this.setState({
        hotProducts: (hotRes.data?.items || []).map((p: Product) => ({
          ...p,
          mainImage: p.mainImage || '',
        })),
        flashProducts: (flashRes.data?.items || []).map((p: Product) => ({
          ...p,
          mainImage: p.mainImage || '',
        })),
        loading: false,
      })
    } catch (error) {
      console.error('加载商品失败:', error)
      this.setState({ loading: false })
    }
  }

  goToProductDetail = (productId: number) => {
    Taro.navigateTo({ url: `/pages/product/detail/index?id=${productId}` })
  }

  goToCategory = (categoryId: number) => {
    Taro.switchTab({ url: '/pages/product/list/index' })
  }

  goToProductList = () => {
    Taro.switchTab({ url: '/pages/product/list/index' })
  }

  handleImageError = (productId: number) => {
    this.setState((prev) => {
      const failedImages = new Set(prev.failedImages)
      failedImages.add(productId)
      return { failedImages }
    })
  }

  addToCart = async (product: Product, e: any) => {
    e.stopPropagation()
    try {
      const cart = Taro.getStorageSync('CART') || []
      const existItem = cart.find((item) => item.productId === product.id)
      if (existItem) {
        existItem.quantity += 1
      } else {
        cart.push({
          productId: product.id,
          productName: product.productName,
          mainImage: product.mainImage,
          salePrice: product.salePrice,
          quantity: 1,
        })
      }
      Taro.setStorageSync('CART', cart)
      Taro.showToast({ title: '已加入购物车', icon: 'success' })
    } catch (error) {
      Taro.showToast({ title: '操作失败', icon: 'error' })
    }
  }

  renderCategoryIcon = (icon: string) => {
    const icons: Record<string, string> = {
      electronics: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="4" width="24" height="32" rx="3" stroke="#0056B3" stroke-width="2"/><line x1="16" y1="32" x2="24" y2="32" stroke="#0056B3" stroke-width="2" stroke-linecap="round"/><rect x="12" y="9" width="16" height="18" rx="1" fill="#E3F2FD"/></svg>`,
      clothing: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 10L4 16L8 18L10 14V34H30V14L32 18L36 16L30 10C28 8 26 7 24 6C22 5 22 9 20 9C18 9 18 5 16 6C14 7 12 8 10 10Z" stroke="#0056B3" stroke-width="2" fill="#E3F2FD"/></svg>`,
      beauty: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="20" cy="22" rx="12" ry="14" stroke="#0056B3" stroke-width="2" fill="#E3F2FD"/><path d="M14 12C14 8 16 4 20 4C24 4 26 8 26 12" stroke="#0056B3" stroke-width="2"/><path d="M20 8V14" stroke="#0056B3" stroke-width="2" stroke-linecap="round"/></svg>`,
      food: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="22" r="14" stroke="#0056B3" stroke-width="2" fill="#E3F2FD"/><path d="M14 20C14 16 17 14 20 14C23 14 26 16 26 20" stroke="#0056B3" stroke-width="2" stroke-linecap="round"/><path d="M20 10V14" stroke="#0056B3" stroke-width="2" stroke-linecap="round"/></svg>`,
      home: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 20L20 6L34 20" stroke="#0056B3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 18V34H30V18" stroke="#0056B3" stroke-width="2"/><rect x="16" y="24" width="8" height="10" rx="1" fill="#E3F2FD" stroke="#0056B3" stroke-width="2"/></svg>`,
      baby: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="14" stroke="#0056B3" stroke-width="2" fill="#E3F2FD"/><circle cx="16" cy="18" r="2" fill="#0056B3"/><circle cx="24" cy="18" r="2" fill="#0056B3"/><path d="M16 24C16 24 18 27 20 27C22 27 24 24 24 24" stroke="#0056B3" stroke-width="2" stroke-linecap="round"/></svg>`,
      sports: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="14" stroke="#0056B3" stroke-width="2" fill="#E3F2FD"/><path d="M20 6L20 34" stroke="#0056B3" stroke-width="2"/><path d="M6 20L34 20" stroke="#0056B3" stroke-width="2"/><ellipse cx="20" cy="20" rx="6" ry="14" stroke="#0056B3" stroke-width="2"/></svg>`,
      more: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="14" cy="14" r="4" fill="#0056B3"/><circle cx="26" cy="14" r="4" fill="#0056B3"/><circle cx="14" cy="26" r="4" fill="#0056B3"/><circle cx="26" cy="26" r="4" fill="#0056B3"/></svg>`,
    }
    return icons[icon] || icons['more']
  }

  padZero = (n: number) => (n < 10 ? `0${n}` : `${n}`)

  render() {
    const { banners, categories, flashProducts, hotProducts, countdown, failedImages } = this.state

    return (
      <View className="home-page">
        {/* Search Bar */}
        <View className="search-bar">
          <View className="search-input-wrap">
            <View className="search-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="#999" strokeWidth="2" />
                <path d="M16 16L21 21" stroke="#999" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </View>
            <Text className="search-placeholder">搜索商品</Text>
          </View>
        </View>

        <ScrollView scrollY className="home-scroll">
          {/* Banner Swiper */}
          <View className="banner-section">
            <Swiper className="banner-swiper" indicatorDots autoplay interval={4000} circular indicatorColor="rgba(255,255,255,0.4)" indicatorActiveColor="#FFFFFF">
              {banners.map((banner) => (
                <SwiperItem key={banner.id}>
                  <View className="banner-img" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#fff', fontSize: '32px', fontWeight: 'bold', textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>{banner.title}</Text>
                  </View>
                </SwiperItem>
              ))}
            </Swiper>
          </View>

          {/* Category Grid */}
          <View className="section-card category-section">
            <View className="category-grid">
              {categories.map((cat) => (
                <View key={cat.id} className="category-item" onClick={() => this.goToCategory(cat.id)}>
                  <View className="category-icon-circle" dangerouslySetInnerHTML={{ __html: this.renderCategoryIcon(cat.icon) }} />
                  <Text className="category-name">{cat.name}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Flash Sale */}
          <View className="section-card flash-section">
            <View className="section-header">
              <View className="section-header-left">
                <Text className="flash-title">限时抢购</Text>
                <View className="countdown-wrap">
                  <Text className="countdown-num">{this.padZero(countdown.hours)}</Text>
                  <Text className="countdown-sep">:</Text>
                  <Text className="countdown-num">{this.padZero(countdown.minutes)}</Text>
                  <Text className="countdown-sep">:</Text>
                  <Text className="countdown-num">{this.padZero(countdown.seconds)}</Text>
                </View>
              </View>
              <Text className="more-link" onClick={this.goToProductList}>更多 ›</Text>
            </View>
            <ScrollView scrollX className="flash-scroll">
              {flashProducts.map((product) => (
                <View key={product.id} className="flash-card" onClick={() => this.goToProductDetail(product.id)}>
                  {failedImages.has(product.id) || !product.mainImage ? (
                    <View className="flash-img" style={{ background: '#F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
                      <Text style={{ fontSize: '24px', color: '#999', fontWeight: 'bold' }}>{(product.productName || '?')[0]}</Text>
                    </View>
                  ) : (
                    <Image src={product.mainImage} mode="aspectFill" className="flash-img" onError={() => this.handleImageError(product.id)} />
                  )}
                  <Text className="flash-name" numberOfLines={1}>{product.productName}</Text>
                  <Text className="flash-price">¥{product.salePrice}</Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Hot Recommendations */}
          <View className="section-card recommend-section">
            <View className="section-header">
              <Text className="section-title">热卖推荐</Text>
              <Text className="more-link" onClick={this.goToProductList}>更多 ›</Text>
            </View>
            <View className="recommend-grid">
              {hotProducts.map((product) => (
                <View key={product.id} className="recommend-card" onClick={() => this.goToProductDetail(product.id)}>
                  {failedImages.has(product.id) || !product.mainImage ? (
                    <View className="recommend-img" style={{ background: '#F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
                      <Text style={{ fontSize: '28px', color: '#999', fontWeight: 'bold' }}>{(product.productName || '?')[0]}</Text>
                    </View>
                  ) : (
                    <Image src={product.mainImage} mode="aspectFill" className="recommend-img" onError={() => this.handleImageError(product.id)} />
                  )}
                  <View className="recommend-info">
                    <Text className="recommend-name" numberOfLines={2}>{product.productName}</Text>
                    <View className="recommend-bottom">
                      <View className="recommend-price-wrap">
                        <Text className="recommend-price">¥</Text>
                        <Text className="recommend-price-val">{product.salePrice}</Text>
                      </View>
                      <View className="add-cart-btn" onClick={(e) => this.addToCart(product, e)}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <circle cx="9" cy="21" r="1.5" fill="#fff" />
                          <circle cx="20" cy="21" r="1.5" fill="#fff" />
                          <path d="M1 1H5L7.68 14.39C7.78 14.85 8.19 15.18 8.66 15.18H19.4C19.87 15.18 20.28 14.85 20.38 14.39L22 6H6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Footer */}
          <View className="home-footer">
            <Text className="footer-text">— 已经到底了 —</Text>
          </View>
        </ScrollView>
      </View>
    )
  }
}
