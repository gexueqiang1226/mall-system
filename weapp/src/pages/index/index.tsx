import { Component } from 'react'
import { View, ScrollView, Text, Image, Button, Swiper, SwiperItem } from '@tarojs/components'
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
  sellableStock: number
  isOnline: number
}

interface HomePageState {
  banners: Banner[]
  hotProducts: Product[]
  newProducts: Product[]
  loading: boolean
}

export default class Index extends Component<{}, HomePageState> {
  constructor(props) {
    super(props)
    this.state = {
      banners: [
        {
          id: 1,
          imageUrl: 'https://via.placeholder.com/375x200?text=Banner+1',
          title: '新品上市',
        },
        {
          id: 2,
          imageUrl: 'https://via.placeholder.com/375x200?text=Banner+2',
          title: '限时优惠',
        },
        {
          id: 3,
          imageUrl: 'https://via.placeholder.com/375x200?text=Banner+3',
          title: '热卖商品',
        },
      ],
      hotProducts: [],
      newProducts: [],
      loading: true,
    }
  }

  componentDidMount() {
    this.loadProducts()
  }

  loadProducts = async () => {
    try {
      // 加载热卖商品
      const hotRes = await api.get('/products', {
        isOnline: 1,
        page: 1,
        size: 6,
      })

      // 加载新品商品
      const newRes = await api.get('/products', {
        isOnline: 1,
        page: 1,
        size: 6,
      })

      this.setState({
        hotProducts: hotRes.data?.items || [],
        newProducts: newRes.data?.items || [],
        loading: false,
      })
    } catch (error) {
      console.error('加载商品失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'error',
      })
      this.setState({ loading: false })
    }
  }

  goToProductDetail = (productId: number) => {
    Taro.navigateTo({
      url: `/pages/product/detail/index?id=${productId}`,
    })
  }

  goToProductList = () => {
    Taro.navigateTo({
      url: '/pages/product/list/index',
    })
  }

  render() {
    const { banners, hotProducts, newProducts, loading } = this.state

    return (
      <ScrollView scrollY className="index-container">
        {/* 轮播图 */}
        <View className="banner-section">
          <Swiper
            className="swiper"
            indicatorDots
            autoplay
            interval={5000}
            circular
          >
            {banners.map((banner) => (
              <SwiperItem key={banner.id}>
                <Image
                  src={banner.imageUrl}
                  mode="aspectFill"
                  className="banner-image"
                />
              </SwiperItem>
            ))}
          </Swiper>
        </View>

        {/* 分类导航 */}
        <View className="category-section">
          <View className="category-title">分类浏览</View>
          <View className="category-grid">
            <View className="category-item" onClick={this.goToProductList}>
              <View className="category-icon">📱</View>
              <Text>电子产品</Text>
            </View>
            <View className="category-item" onClick={this.goToProductList}>
              <View className="category-icon">👗</View>
              <Text>服装鞋帽</Text>
            </View>
            <View className="category-item" onClick={this.goToProductList}>
              <View className="category-icon">💄</View>
              <Text>美妆护肤</Text>
            </View>
            <View className="category-item" onClick={this.goToProductList}>
              <View className="category-icon">🍔</View>
              <Text>食品饮料</Text>
            </View>
          </View>
        </View>

        {/* 热卖商品 */}
        <View className="product-section">
          <View className="section-header">
            <Text className="section-title">🔥 热卖商品</Text>
            <Text className="more-btn" onClick={this.goToProductList}>
              更多 ➜
            </Text>
          </View>
          <View className="product-grid">
            {hotProducts.map((product) => (
              <View
                key={product.id}
                className="product-card"
                onClick={() => this.goToProductDetail(product.id)}
              >
                <Image
                  src={product.mainImage}
                  mode="aspectFill"
                  className="product-image"
                />
                <View className="product-info">
                  <Text className="product-name" numberOfLines={2}>
                    {product.productName}
                  </Text>
                  <View className="product-price-row">
                    <Text className="product-price">¥{product.salePrice}</Text>
                    {product.sellableStock <= 20 && (
                      <Text className="stock-warning">仅剩{product.sellableStock}</Text>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 新品上市 */}
        <View className="product-section">
          <View className="section-header">
            <Text className="section-title">✨ 新品上市</Text>
            <Text className="more-btn" onClick={this.goToProductList}>
              更多 ➜
            </Text>
          </View>
          <View className="product-grid">
            {newProducts.map((product) => (
              <View
                key={product.id}
                className="product-card"
                onClick={() => this.goToProductDetail(product.id)}
              >
                <Image
                  src={product.mainImage}
                  mode="aspectFill"
                  className="product-image"
                />
                <View className="product-info">
                  <Text className="product-name" numberOfLines={2}>
                    {product.productName}
                  </Text>
                  <View className="product-price-row">
                    <Text className="product-price">¥{product.salePrice}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 底部 */}
        <View className="footer">
          <Text>© 2026 Mall System. All Rights Reserved.</Text>
        </View>
      </ScrollView>
    )
  }
}
