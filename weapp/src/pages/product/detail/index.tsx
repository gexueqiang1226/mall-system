import { Component } from 'react'
import { View, Text, Image, Button, ScrollView, Input } from '@tarojs/components'
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
  activeImageIndex: number
}

export default class ProductDetail extends Component<{}, DetailState> {
  private params = {}

  constructor(props) {
    super(props)
    this.state = {
      product: null,
      quantity: 1,
      selectedImages: [],
      loading: true,
      activeImageIndex: 0,
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
      const { id } = this.params as any
      if (!id) {
        Taro.showToast({
          title: '商品不存在',
          icon: 'error',
        })
        return
      }

      const response = await api.get(`/products/${id}`)
      const product = response.data

      this.setState({
        product,
        selectedImages: [product.mainImage, ...(product.detailImages || [])],
        loading: false,
      })
    } catch (error) {
      console.error('加载商品详情失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'error',
      })
      this.setState({ loading: false })
    }
  }

  handleQuantityChange = (e) => {
    const quantity = parseInt(e.detail.value) || 1
    const { product } = this.state
    if (product && quantity > product.sellableStock) {
      Taro.showToast({
        title: '超出库存',
        icon: 'error',
      })
      return
    }
    this.setState({ quantity: Math.max(1, quantity) })
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
      // 从本地存储获取购物车
      const cart = Taro.getStorageSync('CART') || []
      const existItem = cart.find((item) => item.productId === product.id)

      if (existItem) {
        if (existItem.quantity + quantity > product.sellableStock) {
          Taro.showToast({
            title: '超出库存',
            icon: 'error',
          })
          return
        }
        existItem.quantity += quantity
      } else {
        cart.push({
          productId: product.id,
          productName: product.productName,
          mainImage: product.mainImage,
          salePrice: product.salePrice,
          quantity,
        })
      }

      Taro.setStorageSync('CART', cart)
      Taro.showToast({
        title: '已加入购物车',
        icon: 'success',
      })
    } catch (error) {
      console.error('加入购物车失败:', error)
      Taro.showToast({
        title: '操作失败',
        icon: 'error',
      })
    }
  }

  buyNow = () => {
    const { product, quantity } = this.state
    if (!product) return

    // 临时保存订单信息
    Taro.setStorageSync('TEMP_ORDER', {
      items: [
        {
          productId: product.id,
          productName: product.productName,
          mainImage: product.mainImage,
          salePrice: product.salePrice,
          quantity,
        },
      ],
      totalPrice: product.salePrice * quantity,
    })

    Taro.navigateTo({
      url: '/pages/order/list/index',
    })
  }

  handleImageClick = (index: number) => {
    this.setState({ activeImageIndex: index })
  }

  render() {
    const { product, quantity, selectedImages, activeImageIndex, loading } = this.state

    if (loading || !product) {
      return (
        <View className="detail-loading">
          <Text>加载中...</Text>
        </View>
      )
    }

    const discount = product.marketPrice ? Math.round(((product.marketPrice - product.salePrice) / product.marketPrice) * 10) : 0

    return (
      <View className="detail-container">
        <ScrollView scrollY className="detail-scroll">
          {/* 图片轮播 */}
          <View className="image-section">
            <Image
              src={selectedImages[activeImageIndex]}
              mode="aspectFill"
              className="main-image"
            />
            <View className="image-indicators">
              {selectedImages.map((_, index) => (
                <View
                  key={index}
                  className={`indicator ${index === activeImageIndex ? 'active' : ''}`}
                  onClick={() => this.handleImageClick(index)}
                />
              ))}
            </View>
          </View>

          {/* 商品信息 */}
          <View className="info-section">
            {/* 价格 */}
            <View className="price-section">
              <View className="price-row">
                <Text className="price">¥{product.salePrice}</Text>
                {product.marketPrice && (
                  <View className="original-price">
                    <Text>¥{product.marketPrice}</Text>
                    {discount > 0 && <Text className="discount">省{discount}元</Text>}
                  </View>
                )}
              </View>
            </View>

            {/* 库存状态 */}
            <View className="stock-section">
              <Text className="label">库存:</Text>
              {product.sellableStock > 20 ? (
                <Text className="stock-text-normal">充足</Text>
              ) : product.sellableStock > 0 ? (
                <Text className="stock-text-warning">仅剩{product.sellableStock}件</Text>
              ) : (
                <Text className="stock-text-danger">已售罄</Text>
              )}
            </View>

            {/* 商品描述 */}
            <View className="description-section">
              <Text className="label">商品介绍:</Text>
              <Text className="description">{product.description || '暂无描述'}</Text>
            </View>

            {/* 退货信息 */}
            {product.canReturn === 1 && (
              <View className="return-info">
                <Text className="return-badge">✓ 支持{product.returnDays}天无理由退货</Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* 底部操作栏 */}
        <View className="bottom-bar">
          {product.sellableStock > 0 ? (
            <View className="quantity-control">
              <Text className="label">数量:</Text>
              <Button size="mini" onClick={this.decreaseQuantity}>
                -
              </Button>
              <Input
                type="number"
                value={String(quantity)}
                onChange={this.handleQuantityChange}
                className="quantity-input"
              />
              <Button size="mini" onClick={this.increaseQuantity}>
                +
              </Button>
            </View>
          ) : null}

          <View className="action-buttons">
            {product.sellableStock > 0 ? (
              <>
                <Button className="btn btn-add-cart" onClick={this.addToCart}>
                  加入购物车
                </Button>
                <Button className="btn btn-buy-now" onClick={this.buyNow}>
                  立即购买
                </Button>
              </>
            ) : (
              <Button className="btn btn-disabled" disabled>
                已售罄
              </Button>
            )}
          </View>
        </View>
      </View>
    )
  }
}
