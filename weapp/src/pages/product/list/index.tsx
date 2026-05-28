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
  soldCount: number
  isOnline: number
}

interface Category {
  id: number
  categoryName: string
  parentId: number
}

interface ProductListState {
  products: Product[]
  categories: Category[]
  parentCategories: Category[]
  subCategories: Category[]
  selectedCategory: number
  selectedSubCategory: number | null
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
      categories: [],
      parentCategories: [],
      subCategories: [],
      selectedCategory: 0,
      selectedSubCategory: null,
      sortBy: 'default',
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
      const cats: Category[] = (res.data || []).map((c: any) => ({
        id: c.id, categoryName: c.categoryName || c.name, parentId: c.parentId || 0,
      }))
      const parentCats = cats.filter((c) => !c.parentId || c.parentId === 0)
      this.setState({
        categories: cats,
        parentCategories: [{ id: 0, categoryName: '全部', parentId: 0 }, ...parentCats],
      })
    } catch {}
  }

  loadProducts = async () => {
    const { page, size, selectedCategory, selectedSubCategory, sortBy, loading, hasMore } = this.state
    if (loading || !hasMore) return
    this.setState({ loading: true })
    try {
      const params: any = { page, size, isOnline: 1 }
      if (selectedSubCategory) params.categoryId = selectedSubCategory
      else if (selectedCategory > 0) params.categoryId = selectedCategory
      if (sortBy === 'price-asc') { params.sortBy = 'sale_price'; params.order = 'asc' }
      else if (sortBy === 'price-desc') { params.sortBy = 'sale_price'; params.order = 'desc' }
      else if (sortBy === 'hot') { params.sortBy = 'sold_count'; params.order = 'desc' }
      else if (sortBy === 'new') { params.sortBy = 'id'; params.order = 'desc' }

      const response = await api.get('/products', params)
      const items = (response.data?.items || []).map((p: Product) => ({ ...p, mainImage: p.mainImage || '' }))
      const newProducts = page === 1 ? items : [...this.state.products, ...items]
      this.setState({
        products: newProducts,
        total: response.data?.total || 0,
        loading: false,
        hasMore: newProducts.length < (response.data?.total || 0),
      })
    } catch (error) {
      Taro.showToast({ title: '加载失败', icon: 'error' })
      this.setState({ loading: false })
    }
  }

  selectCategory = (id: number) => {
    const { categories } = this.state
    const subCats = id > 0 ? categories.filter((c) => c.parentId === id) : []
    this.setState({
      selectedCategory: id, selectedSubCategory: null, subCategories: subCats,
      page: 1, products: [], hasMore: true,
    }, () => this.loadProducts())
  }

  selectSubCategory = (id: number | null) => {
    this.setState({ selectedSubCategory: id, page: 1, products: [], hasMore: true }, () => this.loadProducts())
  }

  selectSort = (sort: string) => {
    this.setState({ sortBy: sort, page: 1, products: [], hasMore: true }, () => this.loadProducts())
  }

  handleLoadMore = () => {
    const { page, hasMore } = this.state
    if (hasMore) this.setState({ page: page + 1 }, () => this.loadProducts())
  }

  handleImageError = (productId: number) => {
    this.setState((prev) => { const s = new Set(prev.failedImages); s.add(productId); return { failedImages: s } })
  }

  goToProductDetail = (productId: number) => {
    Taro.navigateTo({ url: `/pages/product/detail/index?id=${productId}` })
  }

  addToCart = async (product: Product, e: any) => {
    e.stopPropagation()
    const userInfo = Taro.getStorageSync('USER_INFO')
    if (!userInfo?.userId) { Taro.showToast({ title: '请先登录', icon: 'error' }); return }
    try {
      await api.post('/cart', { userId: userInfo.userId, productId: product.id, quantity: 1 })
      Taro.showToast({ title: '已加入购物车', icon: 'success' })
    } catch { Taro.showToast({ title: '操作失败', icon: 'error' }) }
  }

  render() {
    const { products, parentCategories, subCategories, selectedCategory, selectedSubCategory, sortBy, loading, hasMore, failedImages } = this.state

    return (
      <View className="plist-page">
        {/* Category Tabs */}
        <ScrollView scrollX className="category-tabs">
          {parentCategories.map((cat) => (
            <View key={cat.id} className={`tab-item ${selectedCategory === cat.id ? 'active' : ''}`} onClick={() => this.selectCategory(cat.id)}>
              <Text>{cat.categoryName}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Sub Category Tags */}
        {subCategories.length > 0 && (
          <ScrollView scrollX className="sub-cat-bar">
            <View className={`sub-cat-tag ${!selectedSubCategory ? 'active' : ''}`} onClick={() => this.selectSubCategory(null)}>
              <Text>全部</Text>
            </View>
            {subCategories.map((sc) => (
              <View key={sc.id} className={`sub-cat-tag ${selectedSubCategory === sc.id ? 'active' : ''}`} onClick={() => this.selectSubCategory(sc.id)}>
                <Text>{sc.categoryName}</Text>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Sort Bar */}
        <View className="sort-bar">
          {[
            { key: 'default', label: '默认' },
            { key: 'new', label: '最新' },
            { key: 'hot', label: '热销' },
            { key: 'price-asc', label: '价格 ↑' },
            { key: 'price-desc', label: '价格 ↓' },
          ].map((item) => (
            <View key={item.key} className={`sort-item ${sortBy === item.key ? 'active' : ''}`} onClick={() => this.selectSort(item.key)}>
              <Text>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Product Grid */}
        <ScrollView scrollY className="plist-scroll" onScrollToLower={this.handleLoadMore} scrollWithAnimation>
          <View className="plist-grid">
            {products.map((product) => {
              const soldOut = product.sellableStock !== undefined && product.sellableStock <= 0
              return (
                <View key={product.id} className="plist-card" onClick={() => this.goToProductDetail(product.id)}>
                  <View className="plist-card-img-wrap">
                    {failedImages.has(product.id) || !product.mainImage ? (
                      <View className="plist-card-img" style={{ background: '#F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: '28px', color: '#999' }}>📦</Text>
                      </View>
                    ) : (
                      <Image src={product.mainImage} mode="aspectFill" className="plist-card-img" onError={() => this.handleImageError(product.id)} />
                    )}
                    {soldOut && (
                      <View className="sold-out-corner"><Text className="sold-out-corner-text">已售罄</Text></View>
                    )}
                    {!soldOut && product.sellableStock > 0 && product.sellableStock <= 20 && (
                      <View className="stock-tag"><Text className="stock-tag-text">仅剩{product.sellableStock}件</Text></View>
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
                      {soldOut ? (
                        <Text className="plist-soldout-text">售罄</Text>
                      ) : (
                        <View className="plist-add-btn" onClick={(e) => this.addToCart(product, e)}>
                          <Text style={{ color: '#fff', fontSize: '14px' }}>+</Text>
                        </View>
                      )}
                    </View>
                    {product.soldCount > 0 && (
                      <Text className="plist-sold-count">销量{product.soldCount}</Text>
                    )}
                  </View>
                </View>
              )
            })}
          </View>

          {products.length === 0 && !loading && (
            <View className="plist-empty"><Text className="plist-empty-text">暂无商品</Text></View>
          )}
          {loading && <View className="plist-loading"><Text className="plist-loading-text">加载中...</Text></View>}
          {!hasMore && products.length > 0 && <View className="plist-loading"><Text className="plist-loading-text">— 已加载全部 —</Text></View>}
        </ScrollView>
      </View>
    )
  }
}
