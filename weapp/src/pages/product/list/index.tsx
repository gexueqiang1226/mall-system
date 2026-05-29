import { Component } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import api from '@/services/api'
import './index.css'

interface Category {
  id: number
  name: string
  parentId: number
  level: number
}

interface Product {
  id: number
  productName: string
  mainImage: string
  salePrice: number
  marketPrice: number
  soldCount: number
  categoryId: number
}

interface State {
  leftCategories: Category[]
  subCategories: Category[]
  products: Product[]
  selectedLeftId: number
  selectedSubId: number
  sortBy: string
  order: string
  page: number
  hasMore: boolean
  loading: boolean
  keyword: string
}

export default class ProductList extends Component<{}, State> {
  state: State = {
    leftCategories: [],
    subCategories: [],
    products: [],
    selectedLeftId: 0,
    selectedSubId: 0,
    sortBy: 'default',
    order: 'desc',
    page: 1,
    hasMore: true,
    loading: false,
    keyword: '',
  }

  componentDidMount() {
    const params = Taro.getCurrentInstance().router?.params || {}
    const categoryId = params.categoryId ? Number(params.categoryId) : 0
    const keyword = params.keyword || ''
    this.setState({ keyword }, () => {
      this.loadCategories(categoryId)
    })
  }

  async loadCategories(initCatId?: number) {
    try {
      const res = await api.get('/categories')
      const allCats: Category[] = res?.data || []
      const leftCats = allCats.filter(c => !c.parentId || c.parentId === 0)
      const firstId = initCatId || (leftCats[0]?.id ?? 0)
      this.setState({ leftCategories: leftCats, selectedLeftId: firstId }, () => {
        this.loadSubAndProducts(firstId)
      })
    } catch {
      Taro.showToast({ title: '加载分类失败', icon: 'none' })
    }
  }

  async loadSubAndProducts(parentId: number) {
    try {
      const res = await api.get(`/categories/${parentId}/children`)
      const subs: Category[] = res?.data || []
      this.setState({ subCategories: subs, selectedSubId: 0 }, () => {
        this.loadProducts(true)
      })
    } catch {
      this.loadProducts(true)
    }
  }

  async loadProducts(reset = false) {
    const { selectedLeftId, selectedSubId, sortBy, order, page, keyword } = this.state
    const catId = selectedSubId || selectedLeftId
    const nextPage = reset ? 1 : page + 1
    this.setState({ loading: true })
    try {
      const params: any = { page: nextPage, size: 20, order }
      if (catId) params.categoryId = catId
      if (keyword) params.keyword = keyword
      if (sortBy !== 'default') params.sortBy = sortBy
      const res = await api.get('/products', params)
      const items: Product[] = res?.data?.items || []
      this.setState(prev => ({
        products: reset ? items : [...prev.products, ...items],
        page: nextPage,
        hasMore: items.length >= 20,
        loading: false,
      }))
    } catch {
      Taro.showToast({ title: '加载商品失败', icon: 'none' })
      this.setState({ loading: false })
    }
  }

  selectLeftCat(cat: Category) {
    if (cat.id === this.state.selectedLeftId) return
    this.setState({ selectedLeftId: cat.id, selectedSubId: 0, products: [] }, () => {
      this.loadSubAndProducts(cat.id)
    })
  }

  selectSub(subId: number) {
    this.setState({ selectedSubId: subId }, () => this.loadProducts(true))
  }

  setSort(sortBy: string, order: string) {
    this.setState({ sortBy, order }, () => this.loadProducts(true))
  }

  goProduct(id: number) {
    Taro.navigateTo({ url: `/pages/product/detail/index?id=${id}` })
  }

  goSearch() {
    Taro.navigateTo({ url: '/pages/search/index' })
  }

  render() {
    const { leftCategories, subCategories, products, selectedLeftId, selectedSubId, sortBy, order, loading } = this.state

    return (
      <View className='category-page'>
        {/* 顶部搜索 */}
        <View className='search-bar' onClick={this.goSearch.bind(this)}>
          <View className='search-input-wrap'>
            <Text className='search-icon'>🔍</Text>
            <Text className='search-placeholder'>搜索商品</Text>
          </View>
        </View>

        <View className='body-wrap'>
          {/* 左侧分类 */}
          <ScrollView className='left-nav' scrollY>
            {leftCategories.map(cat => (
              <View
                key={cat.id}
                className={`left-nav-item ${selectedLeftId === cat.id ? 'active' : ''}`}
                onClick={() => this.selectLeftCat(cat)}
              >
                <Text className='left-nav-text'>{cat.name}</Text>
              </View>
            ))}
          </ScrollView>

          {/* 右侧内容 */}
          <View className='right-content'>
            {/* 子分类Tab */}
            {subCategories.length > 0 && (
              <ScrollView scrollX className='sub-cat-scroll'>
                <View
                  className={`sub-cat-item ${selectedSubId === 0 ? 'active' : ''}`}
                  onClick={() => this.selectSub(0)}
                >
                  <Text>全部</Text>
                </View>
                {subCategories.map(sub => (
                  <View
                    key={sub.id}
                    className={`sub-cat-item ${selectedSubId === sub.id ? 'active' : ''}`}
                    onClick={() => this.selectSub(sub.id)}
                  >
                    <Text>{sub.name}</Text>
                  </View>
                ))}
              </ScrollView>
            )}

            {/* 排序栏 */}
            <View className='sort-bar'>
              <Text
                className={`sort-item ${sortBy === 'default' ? 'active' : ''}`}
                onClick={() => this.setSort('default', 'desc')}
              >综合</Text>
              <Text
                className={`sort-item ${sortBy === 'soldCount' ? 'active' : ''}`}
                onClick={() => this.setSort('soldCount', 'desc')}
              >销量</Text>
              <Text
                className={`sort-item ${sortBy === 'salePrice' ? 'active' : ''}`}
                onClick={() => this.setSort('salePrice', order === 'asc' ? 'desc' : 'asc')}
              >
                价格{sortBy === 'salePrice' ? (order === 'asc' ? '↑' : '↓') : ''}
              </Text>
            </View>

            {/* 商品网格 */}
            <ScrollView
              className='product-scroll'
              scrollY
              onScrollToLower={() => this.loadProducts(false)}
            >
              <View className='product-grid'>
                {products.map(p => (
                  <View className='product-card' key={p.id} onClick={() => this.goProduct(p.id)}>
                    <Image className='product-img' src={p.mainImage} mode='aspectFill' />
                    <View className='product-info'>
                      <Text className='product-name'>{p.productName}</Text>
                      <Text className='product-price'>¥{Number(p.salePrice).toFixed(2)}</Text>
                      {p.marketPrice > p.salePrice && (
                        <Text className='product-market-price'>¥{Number(p.marketPrice).toFixed(2)}</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
              {loading && <View className='loading-tip'>加载中...</View>}
              {!loading && !this.state.hasMore && products.length > 0 && (
                <View className='no-more-tip'>— 已经到底了 —</View>
              )}
              {!loading && products.length === 0 && (
                <View className='empty-tip'>
                  <Text>暂无商品</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </View>
    )
  }
}
