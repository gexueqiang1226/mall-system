import { Component } from 'react'
import { View, ScrollView, Text, Image, Picker } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.css'
import api from '@/services/api'

interface Product {
  id: number
  productName: string
  mainImage: string
  salePrice: number
  sellableStock: number
  isOnline: number
}

interface ProductListState {
  products: Product[]
  categories: Array<{ id: number; name: string }>
  selectedCategory: number
  sortBy: string
  page: number
  size: number
  total: number
  loading: boolean
  hasMore: boolean
}

export default class ProductList extends Component<{}, ProductListState> {
  constructor(props) {
    super(props)
    this.state = {
      products: [],
      categories: [
        { id: 0, name: '全部分类' },
        { id: 1, name: '电子产品' },
        { id: 2, name: '服装鞋帽' },
        { id: 3, name: '美妆护肤' },
        { id: 4, name: '食品饮料' },
        { id: 5, name: '家居生活' },
      ],
      selectedCategory: 0,
      sortBy: 'new',
      page: 1,
      size: 20,
      total: 0,
      loading: false,
      hasMore: true,
    }
  }

  componentDidMount() {
    this.loadProducts()
  }

  loadProducts = async () => {
    const { page, size, selectedCategory, sortBy, loading, hasMore } = this.state

    if (loading || !hasMore) return

    this.setState({ loading: true })

    try {
      const params: any = {
        page,
        size,
        isOnline: 1,
      }

      if (selectedCategory > 0) {
        params.categoryId = selectedCategory
      }

      if (sortBy === 'price-asc') {
        params.sortBy = 'sale_price'
        params.order = 'asc'
      } else if (sortBy === 'price-desc') {
        params.sortBy = 'sale_price'
        params.order = 'desc'
      } else if (sortBy === 'hot') {
        params.sortBy = 'sold_count'
        params.order = 'desc'
      } else {
        params.sortBy = 'create_time'
        params.order = 'desc'
      }

      const response = await api.get('/products', params)

      const newProducts = page === 1 ? response.data?.items || [] : [...this.state.products, ...(response.data?.items || [])]

      this.setState({
        products: newProducts,
        total: response.data?.total || 0,
        loading: false,
        hasMore: newProducts.length < (response.data?.total || 0),
      })
    } catch (error) {
      console.error('加载商品列表失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'error',
      })
      this.setState({ loading: false })
    }
  }

  handleCategoryChange = (e) => {
    const selectedIndex = e.detail.value
    const categoryId = this.state.categories[selectedIndex].id
    this.setState(
      {
        selectedCategory: categoryId,
        page: 1,
        products: [],
      },
      () => {
        this.loadProducts()
      }
    )
  }

  handleSortChange = (e) => {
    const sortOptions = ['new', 'hot', 'price-asc', 'price-desc']
    const sortBy = sortOptions[e.detail.value]
    this.setState(
      {
        sortBy,
        page: 1,
        products: [],
      },
      () => {
        this.loadProducts()
      }
    )
  }

  handleLoadMore = () => {
    const { page, hasMore } = this.state
    if (hasMore) {
      this.setState(
        {
          page: page + 1,
        },
        () => {
          this.loadProducts()
        }
      )
    }
  }

  goToProductDetail = (productId: number) => {
    Taro.navigateTo({
      url: `/pages/product/detail/index?id=${productId}`,
    })
  }

  render() {
    const { products, categories, selectedCategory, sortBy, loading, hasMore } = this.state
    const selectedCategoryIndex = categories.findIndex((c) => c.id === selectedCategory)
    const sortOptions = ['最新', '热销', '价格低到高', '价格高到低']
    const sortIndex = sortOptions.indexOf(['new', 'hot', 'price-asc', 'price-desc'].indexOf(sortBy))

    return (
      <View className="product-list-container">
        {/* 筛选栏 */}
        <View className="filter-bar">
          <Picker
            range={categories}
            rangeKey="name"
            value={selectedCategoryIndex}
            onChange={this.handleCategoryChange}
          >
            <View className="filter-item">
              <Text>分类</Text>
              <Text className="arrow">▼</Text>
            </View>
          </Picker>

          <Picker
            range={sortOptions}
            value={sortIndex >= 0 ? sortIndex : 0}
            onChange={this.handleSortChange}
          >
            <View className="filter-item">
              <Text>排序</Text>
              <Text className="arrow">▼</Text>
            </View>
          </Picker>
        </View>

        {/* 商品列表 */}
        <ScrollView
          scrollY
          className="products-scroll"
          onScrollToLower={this.handleLoadMore}
          scrollWithAnimation
        >
          <View className="products-container">
            {products.length > 0 ? (
              products.map((product) => (
                <View
                  key={product.id}
                  className="product-item"
                  onClick={() => this.goToProductDetail(product.id)}
                >
                  <Image
                    src={product.mainImage}
                    mode="aspectFill"
                    className="product-thumbnail"
                  />
                  <View className="product-details">
                    <Text className="product-name">{product.productName}</Text>
                    <View className="product-footer">
                      <View>
                        <Text className="price">¥{product.salePrice}</Text>
                        {product.sellableStock <= 20 && (
                          <Text className="stock-text">仅剩{product.sellableStock}件</Text>
                        )}
                      </View>
                      <View className="buy-btn">
                        {product.sellableStock > 0 ? '购买' : '缺货'}
                      </View>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View className="empty-state">
                <Text>暂无商品</Text>
              </View>
            )}

            {/* 加载状态 */}
            {loading && (
              <View className="loading">
                <Text>加载中...</Text>
              </View>
            )}

            {!hasMore && products.length > 0 && (
              <View className="loading">
                <Text>已全部加载</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    )
  }
}
