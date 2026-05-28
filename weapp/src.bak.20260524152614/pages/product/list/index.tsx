import { Component } from 'react'
import { View, ScrollView, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.css'
import api from '@/services/api'

interface Product {
  id: number
  productName: string
  mainImage: string
  salePrice: number
  marketPrice: number
  sellableStock: number
  isOnline: number
}

interface Category {
  id: number
  name: string
}

interface ProductListState {
  products: Product[]
  categories: Category[]
  selectedCategory: number
  sortBy: string
  page: number
  size: number
  total: number
  loading: boolean
  hasMore: boolean
  failedImages: Set<number>
}

export default class ProductList extends Component<{}, ProductListState> {
  constructor(props) {
    super(props)
    this.state = {
      products: [],
      categories: [{ id: 0, name: '全部' }],
      selectedCategory: 0,
      sortBy: 'new',
      page: 1,
      size: 20,
      total: 0,
      loading: false,
      hasMore: true,
      failedImages: new Set(),
    }
  }

  componentDidMount() {
    this.loadCategories()
    this.loadProducts()
  }

  loadCategories = async () => {
    try {
      const res = await api.get('/categories')
      const cats = (res.data || []).map((c: any) => ({ id: c.id, name: c.name }))
      this.setState({ categories: [{ id: 0, name: '全部' }, ...cats] })
    } catch (e) {
      // keep default categories
    }
  }

  loadProducts = async () => {
    const { page, size, selectedCategory, sortBy, loading, hasMore } = this.state
    if (loading || !hasMore) return

    this.setState({ loading: true })
    try {
      const params: any = { page, size, isOnline: 1 }
      if (selectedCategory > 0) params.categoryId = selectedCategory
      if (sortBy === 'price-asc') { params.sortBy = 'sale_price'; params.order = 'asc' }
      else if (sortBy === 'price-desc') { params.sortBy = 'sale_price'; params.order = 'desc' }
      else if (sortBy === 'hot') { params.sortBy = 'sold_count'; params.order = 'desc' }
      else { params.sortBy = 'create_time'; params.order = 'desc' }

      const response = await api.get('/products', params)
      const items = (response.data?.items || []).map((p: Product) => ({
        ...p,
        mainImage: p.mainImage || '',
      }))

      const newProducts = page === 1 ? items : [...this.state.products, ...items]
      this.setState({
        products: newProducts,
        total: response.data?.total || 0,
        loading: false,
        hasMore: newProducts.length < (response.data?.total || 0),
      })
    } catch (error) {
      console.error('加载商品列表失败:', error)
      Taro.showToast({ title: '加载失败', icon: 'error' })
      this.setState({ loading: false })
    }
  }

  selectCategory = (id: number) => {
    this.setState({ selectedCategory: id, page: 1, products: [], hasMore: true }, () => {
      this.loadProducts()
    })
  }

  selectSort = (sort: string) => {
    this.setState({ sortBy: sort, page: 1, products: [], hasMore: true }, () => {
      this.loadProducts()
    })
  }

  handleLoadMore = () => {
    const { page, hasMore } = this.state
    if (hasMore) {
      this.setState({ page: page + 1 }, () => this.loadProducts())
    }
  }

  handleImageError = (productId: number) => {
    this.setState((prev) => {
      const failedImages = new Set(prev.failedImages)
      failedImages.add(productId)
      return { failedImages }
    })
  }

  goToProductDetail = (productId: number) => {
    Taro.navigateTo({ url: `/pages/product/detail/index?id=${productId}` })
  }

  render() {
    const { products, categories, selectedCategory, sortBy, loading, hasMore, failedImages } = this.state

    return (
      <View className="plist-page">
        {/* Category Tabs */}
        <ScrollView scrollX className="category-tabs">
          {categories.map((cat) => (
            <View
              key={cat.id}
              className={`tab-item ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => this.selectCategory(cat.id)}
            >
              <Text>{cat.name}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Sort Bar */}
        <View className="sort-bar">
          {[
            { key: 'new', label: '最新' },
            { key: 'hot', label: '热销' },
            { key: 'price-asc', label: '价格 ↑' },
            { key: 'price-desc', label: '价格 ↓' },
          ].map((item) => (
            <View
              key={item.key}
              className={`sort-item ${sortBy === item.key ? 'active' : ''}`}
              onClick={() => this.selectSort(item.key)}
            >
              <Text>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Product Grid */}
        <ScrollView
          scrollY
          className="plist-scroll"
          onScrollToLower={this.handleLoadMore}
          scrollWithAnimation
        >
          <View className="plist-grid">
            {products.map((product) => (
              <View
                key={product.id}
                className="plist-card"
                onClick={() => this.goToProductDetail(product.id)}
              >
                <View className="plist-card-img-wrap">
                  {failedImages.has(product.id) || !product.mainImage ? (
                    <View className="plist-card-img" style={{ background: '#F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
                      <Text style={{ fontSize: '28px', color: '#999', fontWeight: 'bold' }}>{(product.productName || '?')[0]}</Text>
                    </View>
                  ) : (
                    <Image src={product.mainImage} mode="aspectFill" className="plist-card-img" onError={() => this.handleImageError(product.id)} />
                  )}
                  {product.sellableStock > 0 && product.sellableStock <= 20 && (
                    <View className="stock-tag">
                      <Text className="stock-tag-text">仅剩{product.sellableStock}件</Text>
                    </View>
                  )}
                </View>
                <View className="plist-card-info">
                  <Text className="plist-card-name" numberOfLines={2}>{product.productName}</Text>
                  <View className="plist-card-bottom">
                    <View className="plist-price-group">
                      <Text className="plist-price-symbol">¥</Text>
                      <Text className="plist-price-value">{product.salePrice}</Text>
                      {product.marketPrice && product.marketPrice > product.salePrice && (
                        <Text className="plist-market-price">¥{product.marketPrice}</Text>
                      )}
                    </View>
                    {product.sellableStock > 0 && (
                      <View className="plist-add-btn">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M12 5V19M5 12H19" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
                        </svg>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>

          {products.length === 0 && !loading && (
            <View className="plist-empty">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                <path d="M20 7L4 7M20 7V17C20 18.1046 19.1046 19 18 19H6C4.89543 19 4 18.1046 4 17V7M20 7L17 3H7L4 7" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <Text className="plist-empty-text">暂无商品</Text>
            </View>
          )}

          {loading && (
            <View className="plist-loading">
              <Text className="plist-loading-text">加载中...</Text>
            </View>
          )}

          {!hasMore && products.length > 0 && (
            <View className="plist-loading">
              <Text className="plist-loading-text">— 已加载全部 —</Text>
            </View>
          )}
        </ScrollView>
      </View>
    )
  }
}
