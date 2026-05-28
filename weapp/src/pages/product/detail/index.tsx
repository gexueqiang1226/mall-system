import { Component } from 'react'
import { View, Text, Image, ScrollView, Swiper, SwiperItem } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.css'
import api from '@/services/api'

/* ========== Interfaces ========== */

interface Product {
  id: number
  productName: string
  productCode: string
  mainImage: string
  detailImages: string[]
  salePrice: number
  marketPrice: number
  costPrice: number
  description: string
  sellableStock: number
  categoryId: number
  soldCount: number
  isOnline: number
  canReturn: number
  returnDays: number
}

interface SkuItem {
  id: number
  productId: number
  price: number
  stock: number
  specs: string | Record<string, string>
  image: string
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
  sellableStock: number
  categoryId: number
}

interface DetailState {
  product: Product | null
  loading: boolean
  currentSwiper: number
  failedImages: Set<number>

  // SKU panel
  skuPanelOpen: boolean
  skuMode: 'cart' | 'buy'
  skuList: SkuItem[]
  specMap: Record<string, string[]>
  skuSelected: Record<string, string>
  skuQuantity: number
  selectedSku: SkuItem | null

  // Favorite
  isFavorite: boolean

  // Review stats
  reviewStats: ReviewStats | null

  // Look again
  recommendList: RecommendProduct[]
}

const formatPrice = (n: number): string => n.toFixed(2)

export default class ProductDetail extends Component<{}, DetailState> {
  private productId: number = 0

  constructor(props) {
    super(props)
    this.state = {
      product: null,
      loading: true,
      currentSwiper: 0,
      failedImages: new Set(),
      skuPanelOpen: false,
      skuMode: 'cart',
      skuList: [],
      specMap: {},
      skuSelected: {},
      skuQuantity: 1,
      selectedSku: null,
      isFavorite: false,
      reviewStats: null,
      recommendList: [],
    }
  }

  componentDidMount() {
    const pages = Taro.getCurrentPages()
    const currentPage = pages[pages.length - 1]
    const id = currentPage.options.id
    if (!id) {
      Taro.showToast({ title: '商品不存在', icon: 'error' })
      return
    }
    this.productId = Number(id)
    this.loadAll()
  }

  /* ========== Data Loading ========== */

  loadAll = async () => {
    try {
      const id = this.productId

      // 1. Load product detail
      const response = await api.get(`/products/${id}`)
      const product: Product = response.data || response
      this.setState({ product, loading: false })

      // 2. Record browse history
      this.recordBrowse(id)

      // 3. Check favorite (parallel-safe)
      this.checkFavorite()

      // 4. Load review stats
      this.loadReviewStats()

      // 5. Load look-again recommendations
      this.loadLookAgain(product)
    } catch (error) {
      console.error('加载商品详情失败:', error)
      Taro.showToast({ title: '加载失败', icon: 'error' })
      this.setState({ loading: false })
    }
  }

  /* ========== Browse History ========== */

  recordBrowse = (productId: number) => {
    try {
      const history: number[] = Taro.getStorageSync('SAM_BROWSE') || []
      const idx = history.indexOf(productId)
      if (idx >= 0) history.splice(idx, 1)
      history.push(productId)
      if (history.length > 20) {
        const trimmed = history.slice(-20)
        Taro.setStorageSync('SAM_BROWSE', trimmed)
      } else {
        Taro.setStorageSync('SAM_BROWSE', history)
      }
    } catch (e) {
      // ignore storage errors
    }
  }

  /* ========== Favorite ========== */

  getUserId = (): number | null => {
    try {
      const userInfo = Taro.getStorageSync('USER_INFO')
      if (userInfo && userInfo.id) return Number(userInfo.id)
      const token = Taro.getStorageSync('TOKEN')
      if (!token) return null
      return null
    } catch {
      return null
    }
  }

  checkFavorite = async () => {
    const uid = this.getUserId()
    if (!uid) return
    try {
      const res = await api.get('/favorites/check', {
        userId: uid,
        productId: this.productId,
      })
      this.setState({ isFavorite: !!res })
    } catch {
      // ignore
    }
  }

  toggleFavorite = async () => {
    const uid = this.getUserId()
    if (!uid) {
      Taro.showToast({ title: '请先登录', icon: 'none' })
      Taro.navigateTo({ url: '/pages/login/index' })
      return
    }
    const { isFavorite } = this.state
    try {
      if (isFavorite) {
        // Find the favorite id first
        const favs = await api.get('/favorites', { userId: uid })
        const favList = Array.isArray(favs) ? favs : (favs?.data || [])
        const fav = favList.find((f) => f.productId === this.productId)
        if (fav) {
          await api.delete(`/favorites/${fav.id}`)
        }
        this.setState({ isFavorite: false })
        Taro.showToast({ title: '已取消收藏', icon: 'none' })
      } else {
        await api.post('/favorites', {
          userId: uid,
          productId: this.productId,
        })
        this.setState({ isFavorite: true })
        Taro.showToast({ title: '已收藏', icon: 'none' })
      }
    } catch {
      Taro.showToast({ title: '操作失败', icon: 'error' })
    }
  }

  /* ========== Review Stats ========== */

  loadReviewStats = async () => {
    try {
      const res = await api.get('/reviews/statistics', {
        productId: this.productId,
      })
      const stats = res.data || res
      if (stats) {
        this.setState({ reviewStats: stats as ReviewStats })
      }
    } catch {
      // ignore
    }
  }

  /* ========== Look Again (Recommendations) ========== */

  loadLookAgain = async (product: Product) => {
    try {
      const res = await api.get('/products', {
        categoryId: product.categoryId,
        page: 1,
        size: 10,
      })
      let products: RecommendProduct[] = []
      if (Array.isArray(res)) {
        products = res
      } else if (res?.data?.records) {
        products = res.data.records
      } else if (res?.records) {
        products = res.records
      } else if (res?.data) {
        products = Array.isArray(res.data) ? res.data : []
      }
      // Filter out current product, shuffle, take 4
      const filtered = products
        .filter((p) => p.id !== product.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 4)
      this.setState({ recommendList: filtered })
    } catch {
      // ignore
    }
  }

  /* ========== SKU Panel ========== */

  openSkuPanel = async (mode: 'cart' | 'buy') => {
    const { product } = this.state
    if (!product) return
    if (product.sellableStock <= 0) {
      Taro.showToast({ title: '商品已售罄', icon: 'none' })
      return
    }

    try {
      const res = await api.get(`/products/${product.id}/skus`)
      const skuList: SkuItem[] = Array.isArray(res) ? res : (res?.data || [])

      if (skuList.length === 0) {
        // No SKUs, add to cart directly
        if (mode === 'cart') {
          this.doAddToCart(null)
        } else {
          this.doBuyNow(null)
        }
        return
      }

      const specMap = this.parseSkuSpecs(skuList)
      this.setState({
        skuList,
        specMap,
        skuSelected: {},
        skuQuantity: 1,
        selectedSku: null,
        skuMode: mode,
        skuPanelOpen: true,
      })
    } catch {
      // No SKU endpoint or error — fallback to direct add
      if (mode === 'cart') {
        this.doAddToCart(null)
      } else {
        this.doBuyNow(null)
      }
    }
  }

  closeSkuPanel = () => {
    this.setState({ skuPanelOpen: false })
  }

  parseSkuSpecs = (skuList: SkuItem[]): Record<string, string[]> => {
    const specMap: Record<string, string[]> = {}
    skuList.forEach((sku) => {
      let specs: Record<string, string> = {}
      try {
        specs = typeof sku.specs === 'string' ? JSON.parse(sku.specs) : (sku.specs || {})
      } catch { /* ignore */ }
      Object.keys(specs).forEach((key) => {
        if (!specMap[key]) specMap[key] = []
        if (!specMap[key].includes(specs[key])) {
          specMap[key].push(specs[key])
        }
      })
    })
    return specMap
  }

  getSkuSpecValues = (sku: SkuItem): Record<string, string> => {
    try {
      return typeof sku.specs === 'string' ? JSON.parse(sku.specs) : (sku.specs || {})
    } catch {
      return {}
    }
  }

  isSpecCombinationAvailable = (specKey: string, specValue: string): boolean => {
    const { skuList, skuSelected } = this.state
    const tempSelected = { ...skuSelected }
    tempSelected[specKey] = specValue
    return skuList.some((sku) => {
      const specs = this.getSkuSpecValues(sku)
      return Object.keys(tempSelected).every((key) => tempSelected[key] === specs[key]) && sku.stock > 0
    })
  }

  findSelectedSku = (skuSelected: Record<string, string>): SkuItem | null => {
    const { skuList } = this.state
    return skuList.find((sku) => {
      const specs = this.getSkuSpecValues(sku)
      return Object.keys(specs).every((key) => skuSelected[key] === specs[key])
    }) || null
  }

  selectSkuSpec = (key: string, value: string) => {
    this.setState((prev) => {
      const skuSelected = { ...prev.skuSelected }
      if (skuSelected[key] === value) {
        delete skuSelected[key]
      } else {
        skuSelected[key] = value
      }
      const selectedSku = this.findSelectedSku(skuSelected)
      return { skuSelected, selectedSku }
    })
  }

  changeSkuQty = (delta: number) => {
    this.setState((prev) => {
      const { selectedSku, product } = prev
      const maxStock = selectedSku ? selectedSku.stock : (product?.sellableStock || 1)
      const newQty = Math.max(1, Math.min(prev.skuQuantity + delta, maxStock))
      return { skuQuantity: newQty }
    })
  }

  confirmSku = async () => {
    const { selectedSku, skuMode, skuQuantity, product } = this.state
    if (!selectedSku) {
      Taro.showToast({ title: '请选择完整规格', icon: 'none' })
      return
    }
    if (selectedSku.stock < skuQuantity) {
      Taro.showToast({ title: '库存不足', icon: 'none' })
      return
    }
    this.setState({ skuPanelOpen: false })
    if (skuMode === 'cart') {
      this.doAddToCart(selectedSku)
    } else {
      this.doBuyNow(selectedSku)
    }
  }

  /* ========== Cart & Buy ========== */

  doAddToCart = async (sku: SkuItem | null) => {
    const uid = this.getUserId()
    if (!uid) {
      Taro.showToast({ title: '请先登录', icon: 'none' })
      Taro.navigateTo({ url: '/pages/login/index' })
      return
    }
    const { product, skuQuantity } = this.state
    if (!product) return

    try {
      const body: any = {
        userId: uid,
        productId: product.id,
        quantity: sku ? this.state.skuQuantity : 1,
      }
      if (sku) body.skuId = sku.id
      await api.post('/cart', body)
      Taro.showToast({ title: '已加入购物车', icon: 'success' })
    } catch {
      Taro.showToast({ title: '加入购物车失败', icon: 'error' })
    }
  }

  doBuyNow = async (sku: SkuItem | null) => {
    const uid = this.getUserId()
    if (!uid) {
      Taro.showToast({ title: '请先登录', icon: 'none' })
      Taro.navigateTo({ url: '/pages/login/index' })
      return
    }
    const { product, skuQuantity } = this.state
    if (!product) return

    try {
      const body: any = {
        userId: uid,
        productId: product.id,
        quantity: sku ? skuQuantity : 1,
      }
      if (sku) body.skuId = sku.id
      await api.post('/cart', body)

      // Navigate to order page
      Taro.navigateTo({ url: '/pages/order/list/index' })
    } catch {
      Taro.showToast({ title: '操作失败', icon: 'error' })
    }
  }

  /* ========== Share ========== */

  handleShare = () => {
    const { product } = this.state
    const url = `/pages/product/detail/index?id=${this.productId}`
    Taro.setClipboardData({
      data: url,
      success: () => {
        Taro.showToast({ title: '链接已复制', icon: 'success' })
      },
    })
  }

  /* ========== Navigation ========== */

  goDetail = (id: number) => {
    Taro.navigateTo({ url: `/pages/product/detail/index?id=${id}` })
  }

  goBack = () => {
    Taro.navigateBack()
  }

  /* ========== Image Swiper ========== */

  onSwiperChange = (e) => {
    this.setState({ currentSwiper: e.detail.current })
  }

  handleImageError = (index: number) => {
    this.setState((prev) => {
      const failedImages = new Set(prev.failedImages)
      failedImages.add(index)
      return { failedImages }
    })
  }

  /* ========== Render Helpers ========== */

  getSwiperImages = (): string[] => {
    const { product } = this.state
    if (!product) return []
    const images: string[] = []
    // Parse detailImages
    if (product.detailImages) {
      if (typeof product.detailImages === 'string') {
        try {
          const parsed = JSON.parse(product.detailImages)
          if (Array.isArray(parsed)) images.push(...parsed)
        } catch { /* ignore */ }
      } else if (Array.isArray(product.detailImages)) {
        images.push(...product.detailImages)
      }
    }
    // Fallback to mainImage if no detail images
    if (images.length === 0 && product.mainImage) {
      images.push(product.mainImage)
    }
    return images
  }

  /* ========== Main Render ========== */

  render() {
    const {
      product,
      loading,
      currentSwiper,
      failedImages,
      isFavorite,
      reviewStats,
      recommendList,
      skuPanelOpen,
      specMap,
      skuSelected,
      skuQuantity,
      selectedSku,
      skuList,
    } = this.state

    if (loading || !product) {
      return (
        <View className="detail-loading">
          <View className="loading-spinner" />
          <Text className="loading-text">加载中...</Text>
        </View>
      )
    }

    const images = this.getSwiperImages()
    const isSoldOut = product.sellableStock !== undefined && product.sellableStock <= 0
    const discount = product.marketPrice && product.marketPrice > product.salePrice
      ? Math.round(((product.marketPrice - product.salePrice) / product.marketPrice) * 100)
      : 0
    const savedAmount = product.marketPrice && product.marketPrice > product.salePrice
      ? (product.marketPrice - product.salePrice)
      : 0

    // Current display price (SKU price overrides if a SKU is selected)
    const displayPrice = selectedSku
      ? (selectedSku.price || product.salePrice)
      : product.salePrice
    const displayStock = selectedSku
      ? selectedSku.stock
      : product.sellableStock

    return (
      <View className="detail-page">
        <ScrollView scrollY className="detail-scroll">

          {/* ===== Image Swiper ===== */}
          <View className="img-swiper-section">
            <Swiper
              className="img-swiper"
              onChange={this.onSwiperChange}
              circular
              autoplay
              interval={3000}
            >
              {images.map((img, index) => (
                <SwiperItem key={index}>
                  {failedImages.has(index) || !img ? (
                    <View className="detail-main-img detail-img-placeholder">
                      <Text className="detail-img-placeholder-text">
                        {(product.productName || '?')[0]}
                      </Text>
                    </View>
                  ) : (
                    <Image
                      src={img}
                      mode="aspectFill"
                      className="detail-main-img"
                      onError={() => this.handleImageError(index)}
                    />
                  )}
                </SwiperItem>
              ))}
            </Swiper>
            {/* Counter overlay */}
            {images.length > 1 && (
              <View className="img-counter">
                <Text className="img-counter-text">{currentSwiper + 1}/{images.length}</Text>
              </View>
            )}
            {/* Back button */}
            <View className="detail-back-btn" onClick={this.goBack}>
              <Text className="detail-back-icon">&lt;</Text>
            </View>
            {/* Sold out overlay */}
            {isSoldOut && (
              <View className="soldout-overlay">
                <Text className="soldout-overlay-text">已售罄</Text>
              </View>
            )}
          </View>

          {/* ===== Price Card ===== */}
          <View className="detail-card price-card">
            <View className="price-row-main">
              <View className="sale-price-group">
                <Text className="price-symbol">¥</Text>
                <Text className="price-number">{formatPrice(displayPrice)}</Text>
              </View>
              {product.marketPrice && product.marketPrice > product.salePrice && (
                <Text className="market-price">¥{formatPrice(product.marketPrice)}</Text>
              )}
            </View>
            {discount > 0 && (
              <View className="discount-badge">
                <Text className="discount-text">省{formatPrice(savedAmount)}元 · {discount}%OFF</Text>
              </View>
            )}
          </View>

          {/* ===== Product Info ===== */}
          <View className="detail-card info-card">
            <Text className="product-title">{product.productName}</Text>
            {product.description && (
              <Text className="product-desc">{product.description}</Text>
            )}

            {/* Stock */}
            <View className="info-row">
              <Text className="info-label">库存</Text>
              {displayStock > 20 ? (
                <Text className="stock-ok">充足</Text>
              ) : displayStock > 0 ? (
                <Text className="stock-warn">仅剩 {displayStock} 件</Text>
              ) : (
                <Text className="stock-out">已售罄</Text>
              )}
            </View>

            {/* Product code */}
            {product.productCode && (
              <View className="info-row">
                <Text className="info-label">编号</Text>
                <Text className="info-value">{product.productCode}</Text>
              </View>
            )}

            {/* Return policy */}
            {product.canReturn === 1 && (
              <View className="return-tag">
                <Text className="return-tag-icon">✓</Text>
                <Text className="return-text">支持{product.returnDays || 7}天无理由退货</Text>
              </View>
            )}
          </View>

          {/* ===== Product Params ===== */}
          <View className="detail-card params-card">
            <Text className="section-title">商品参数</Text>
            {product.categoryId ? (
              <View className="param-row">
                <Text className="param-label">分类ID</Text>
                <Text className="param-value">{product.categoryId}</Text>
              </View>
            ) : null}
            <View className="param-row">
              <Text className="param-label">销量</Text>
              <Text className="param-value">{product.soldCount || 0}件</Text>
            </View>
            {product.isOnline ? (
              <View className="param-row">
                <Text className="param-label">状态</Text>
                <Text className="param-value">在售</Text>
              </View>
            ) : null}
          </View>

          {/* ===== Review Stats ===== */}
          <View className="detail-card review-card">
            <View className="section-header">
              <Text className="section-title">用户评价</Text>
              {reviewStats && (
                <Text className="review-stat-summary">
                  {reviewStats.avgRating.toFixed(1)}分 {reviewStats.totalCount}条
                </Text>
              )}
            </View>
            {reviewStats ? (
              <View className="review-stats-body">
                <View className="review-stats-score">
                  <Text className="review-stats-avg">{reviewStats.avgRating.toFixed(1)}</Text>
                  <Text className="review-stats-count">{reviewStats.totalCount}条评价</Text>
                </View>
                <View className="review-stats-bars">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const percent = reviewStats.distribution
                      ? (reviewStats.distribution[String(star)] || 0)
                      : (star === 5 ? 100 : 0)
                    return (
                      <View className="star-bar-row" key={star}>
                        <Text className="star-bar-label">{star}星</Text>
                        <View className="star-bar-track">
                          <View className="star-bar-fill" style={{ width: `${percent}%` }} />
                        </View>
                      </View>
                    )
                  })}
                </View>
              </View>
            ) : (
              <Text className="review-empty">暂无评价</Text>
            )}
          </View>

          {/* ===== Look Again / Recommendations ===== */}
          {recommendList.length > 0 && (
            <View className="detail-card recommend-card">
              <Text className="section-title">看了又看</Text>
              <ScrollView scrollX className="recommend-scroll">
                <View className="recommend-row">
                  {recommendList.map((item) => (
                    <View
                      className="recommend-item"
                      key={item.id}
                      onClick={() => this.goDetail(item.id)}
                    >
                      {item.mainImage ? (
                        <Image src={item.mainImage} mode="aspectFill" className="recommend-item-img" />
                      ) : (
                        <View className="recommend-item-img recommend-item-img-placeholder">
                          <Text>{(item.productName || '?')[0]}</Text>
                        </View>
                      )}
                      <Text className="recommend-item-name">{item.productName}</Text>
                      <Text className="recommend-item-price">¥{formatPrice(item.salePrice)}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* ===== Bottom spacer ===== */}
          <View className="bottom-spacer" />
        </ScrollView>

        {/* ===== SKU Panel Overlay ===== */}
        {skuPanelOpen && (
          <View className="sku-overlay" onClick={this.closeSkuPanel}>
            <View className="sku-panel" onClick={(e) => e.stopPropagation()}>
              {/* Panel header with product image & price */}
              <View className="sku-header">
                {product.mainImage ? (
                  <Image src={product.mainImage} mode="aspectFill" className="sku-header-img" />
                ) : (
                  <View className="sku-header-img sku-header-img-placeholder">
                    <Text>{(product.productName || '?')[0]}</Text>
                  </View>
                )}
                <View className="sku-header-info">
                  <Text className="sku-header-price">
                    ¥{formatPrice(selectedSku ? (selectedSku.price || product.salePrice) : product.salePrice)}
                  </Text>
                  <Text className="sku-header-stock">
                    {selectedSku ? `库存: ${selectedSku.stock}` : '请选择规格'}
                  </Text>
                  {Object.keys(skuSelected).length > 0 && (
                    <Text className="sku-header-selected">
                      已选: {Object.values(skuSelected).join(' ')}
                    </Text>
                  )}
                </View>
                <View className="sku-close" onClick={this.closeSkuPanel}>
                  <Text className="sku-close-icon">✕</Text>
                </View>
              </View>

              {/* Spec groups */}
              <ScrollView scrollY className="sku-body">
                {Object.keys(specMap).map((key) => (
                  <View className="sku-group" key={key}>
                    <Text className="sku-group-title">{key}</Text>
                    <View className="sku-pills">
                      {specMap[key].map((val) => {
                        const available = this.isSpecCombinationAvailable(key, val)
                        const selected = skuSelected[key] === val
                        return (
                          <View
                            className={`sku-pill${selected ? ' selected' : ''}${!available ? ' disabled' : ''}`}
                            key={val}
                            onClick={() => available && this.selectSkuSpec(key, val)}
                          >
                            <Text className="sku-pill-text">{val}</Text>
                          </View>
                        )
                      })}
                    </View>
                  </View>
                ))}
              </ScrollView>

              {/* Quantity & Confirm */}
              <View className="sku-footer">
                <View className="sku-qty-row">
                  <Text className="sku-qty-label">数量</Text>
                  <View className="sku-qty-controls">
                    <View className="sku-qty-btn" onClick={() => this.changeSkuQty(-1)}>
                      <Text className="sku-qty-btn-text">−</Text>
                    </View>
                    <Text className="sku-qty-num">{skuQuantity}</Text>
                    <View className="sku-qty-btn" onClick={() => this.changeSkuQty(1)}>
                      <Text className="sku-qty-btn-text">+</Text>
                    </View>
                  </View>
                </View>
                <View className="sku-confirm-btn" onClick={this.confirmSku}>
                  <Text className="sku-confirm-btn-text">确定</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ===== Fixed Bottom Action Bar ===== */}
        <View className="detail-bottom-bar">
          {/* Favorite */}
          <View className="bar-action" onClick={this.toggleFavorite}>
            <Text className={`bar-fav-icon ${isFavorite ? 'active' : ''}`}>
              {isFavorite ? '♥' : '♡'}
            </Text>
            <Text className="bar-action-label">收藏</Text>
          </View>

          {/* Share */}
          <View className="bar-action" onClick={this.handleShare}>
            <Text className="bar-share-icon">↗</Text>
            <Text className="bar-action-label">分享</Text>
          </View>

          {isSoldOut ? (
            <View className="bar-btn bar-soldout">
              <Text className="bar-soldout-text">已售罄</Text>
            </View>
          ) : (
            <>
              <View className="bar-btn bar-cart" onClick={() => this.openSkuPanel('cart')}>
                <Text className="bar-cart-text">加入购物车</Text>
              </View>
              <View className="bar-btn bar-buy" onClick={() => this.openSkuPanel('buy')}>
                <Text className="bar-buy-text">立即购买</Text>
              </View>
            </>
          )}
        </View>
      </View>
    )
  }
}
