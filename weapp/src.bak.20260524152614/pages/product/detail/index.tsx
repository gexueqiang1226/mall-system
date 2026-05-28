import { Component } from 'react'
import { View, Text, Image, ScrollView, Swiper, SwiperItem } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.css'
import api from '@/services/api'

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
  canReturn: number
  returnDays: number
}

interface DetailState {
  product: Product | null
  quantity: number
  selectedImages: string[]
  loading: boolean
  currentSwiper: number
  failedImages: Set<number>
}

export default class ProductDetail extends Component<{}, DetailState> {
  private params: any = {}

  constructor(props) {
    super(props)
    this.state = {
      product: null,
      quantity: 1,
      selectedImages: [],
      loading: true,
      currentSwiper: 0,
      failedImages: new Set(),
    }
  }

  componentDidMount() {
    const pages = Taro.getCurrentPages()
    const currentPage = pages[pages.length - 1]
    this.params = currentPage.options
    this.loadProductDetail()
  }

  loadProductDetail = async () => {
    try {
      const { id } = this.params
      if (!id) {
        Taro.showToast({ title: '商品不存在', icon: 'error' })
        return
      }

      const response = await api.get(`/products/${id}`)
      const product = response.data

      const images = [product.mainImage || '']
      if (product.detailImages && product.detailImages.length > 0) {
        images.push(...product.detailImages)
      }

      this.setState({
        product,
        selectedImages: images,
        loading: false,
      })
    } catch (error) {
      console.error('加载商品详情失败:', error)
      Taro.showToast({ title: '加载失败', icon: 'error' })
      this.setState({ loading: false })
    }
  }

  increaseQuantity = () => {
    const { quantity, product } = this.state
    if (product && quantity < product.sellableStock) {
      this.setState({ quantity: quantity + 1 })
    }
  }

  decreaseQuantity = () => {
    const { quantity } = this.state
    if (quantity > 1) {
      this.setState({ quantity: quantity - 1 })
    }
  }

  addToCart = async () => {
    const { product, quantity } = this.state
    if (!product) return

    try {
      const cart = Taro.getStorageSync('CART') || []
      const existItem = cart.find((item) => item.productId === product.id)
      if (existItem) {
        if (existItem.quantity + quantity > product.sellableStock) {
          Taro.showToast({ title: '超出库存', icon: 'error' })
          return
        }
        existItem.quantity += quantity
      } else {
        cart.push({
          productId: product.id,
          productName: product.productName,
          mainImage: product.mainImage || '',
          salePrice: product.salePrice,
          quantity,
        })
      }
      Taro.setStorageSync('CART', cart)
      Taro.showToast({ title: '已加入购物车', icon: 'success' })
    } catch (error) {
      Taro.showToast({ title: '操作失败', icon: 'error' })
    }
  }

  buyNow = () => {
    const { product, quantity } = this.state
    if (!product) return

    Taro.setStorageSync('TEMP_ORDER', {
      items: [{
        productId: product.id,
        productName: product.productName,
        mainImage: product.mainImage,
        salePrice: product.salePrice,
        quantity,
      }],
      totalPrice: product.salePrice * quantity,
    })

    Taro.navigateTo({ url: '/pages/order/list/index' })
  }

  handleImageError = (index: number) => {
    this.setState((prev) => {
      const failedImages = new Set(prev.failedImages)
      failedImages.add(index)
      return { failedImages }
    })
  }

  onSwiperChange = (e) => {
    this.setState({ currentSwiper: e.detail.current })
  }

  render() {
    const { product, quantity, selectedImages, currentSwiper, loading, failedImages } = this.state

    if (loading || !product) {
      return (
        <View className="detail-loading">
          <View className="loading-spinner" />
          <Text className="loading-text">加载中...</Text>
        </View>
      )
    }

    const discount = product.marketPrice
      ? Math.round(((product.marketPrice - product.salePrice) / product.marketPrice) * 100)
      : 0

    return (
      <View className="detail-page">
        <ScrollView scrollY className="detail-scroll">
          {/* Image Swiper */}
          <View className="img-swiper-section">
            <Swiper
              className="img-swiper"
              onChange={this.onSwiperChange}
              circular
              autoplay={false}
            >
              {selectedImages.map((img, index) => (
                <SwiperItem key={index}>
                  {failedImages.has(index) || !img ? (
                    <View className="detail-main-img" style={{ background: '#F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: '48px', color: '#999', fontWeight: 'bold' }}>{(product?.productName || '?')[0]}</Text>
                    </View>
                  ) : (
                    <Image src={img} mode="aspectFill" className="detail-main-img" onError={() => this.handleImageError(index)} />
                  )}
                </SwiperItem>
              ))}
            </Swiper>
            <View className="img-counter">
              <Text className="img-counter-text">{currentSwiper + 1}/{selectedImages.length}</Text>
            </View>
          </View>

          {/* Price Section */}
          <View className="detail-card price-card">
            <View className="price-row-main">
              <View className="sale-price-group">
                <Text className="price-symbol">¥</Text>
                <Text className="price-number">{product.salePrice}</Text>
              </View>
              {product.marketPrice && product.marketPrice > product.salePrice && (
                <Text className="market-price">¥{product.marketPrice}</Text>
              )}
            </View>
            {discount > 0 && (
              <View className="discount-badge">
                <Text className="discount-text">省{Math.round(product.marketPrice - product.salePrice)}元 · {discount}%OFF</Text>
              </View>
            )}
          </View>

          {/* Product Info */}
          <View className="detail-card info-card">
            <Text className="product-title">{product.productName}</Text>
            {product.description && (
              <Text className="product-desc">{product.description}</Text>
            )}

            {/* Stock */}
            <View className="info-row">
              <Text className="info-label">库存</Text>
              {product.sellableStock > 20 ? (
                <Text className="stock-ok">充足</Text>
              ) : product.sellableStock > 0 ? (
                <Text className="stock-warn">仅剩 {product.sellableStock} 件</Text>
              ) : (
                <Text className="stock-out">已售罄</Text>
              )}
            </View>

            {/* Spec */}
            {product.productCode && (
              <View className="info-row">
                <Text className="info-label">编号</Text>
                <Text className="info-value">{product.productCode}</Text>
              </View>
            )}

            {/* Return */}
            {product.canReturn === 1 && (
              <View className="return-tag">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#2E7D32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <Text className="return-text">支持{product.returnDays}天无理由退货</Text>
              </View>
            )}
          </View>

          {/* Quantity Selector */}
          <View className="detail-card quantity-card">
            <Text className="qty-label">购买数量</Text>
            <View className="qty-control">
              <View className="qty-btn" onClick={this.decreaseQuantity}>
                <Text className="qty-btn-text">−</Text>
              </View>
              <Text className="qty-value">{quantity}</Text>
              <View className="qty-btn" onClick={this.increaseQuantity}>
                <Text className="qty-btn-text">+</Text>
              </View>
            </View>
          </View>

          {/* Bottom spacer for fixed bar */}
          <View className="bottom-spacer" />
        </ScrollView>

        {/* Fixed Bottom Bar */}
        <View className="detail-bottom-bar">
          <View className="bar-action bar-service">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <Text className="bar-action-label">客服</Text>
          </View>
          {product.sellableStock > 0 ? (
            <>
              <View className="bar-btn bar-cart" onClick={this.addToCart}>
                <Text className="bar-cart-text">加入购物车</Text>
              </View>
              <View className="bar-btn bar-buy" onClick={this.buyNow}>
                <Text className="bar-buy-text">立即购买</Text>
              </View>
            </>
          ) : (
            <View className="bar-btn bar-soldout">
              <Text className="bar-soldout-text">已售罄</Text>
            </View>
          )}
        </View>
      </View>
    )
  }
}
