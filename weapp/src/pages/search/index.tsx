import { Component } from 'react'
import Taro from '@tarojs/taro'
import { getStorage, setStorage, removeStorage } from '@/utils/storage'
import { View, Text, Input, Image, ScrollView } from '@tarojs/components'
import api from '@/services/api'
import './index.css'

interface Product {
  id: number
  productName: string
  mainImage: string
  salePrice: number
  marketPrice: number
  soldCount: number
}

const HOT_KEYWORDS = ['iPhone', 'Nike', '咖啡', '面膜', '零食', '耳机', '牛排', '有机食品']
const HISTORY_KEY = 'SEARCH_HISTORY'

interface State {
  keyword: string
  focused: boolean
  history: string[]
  products: Product[]
  searched: boolean
  loading: boolean
  sortBy: string
  order: string
  page: number
  hasMore: boolean
}

export default class Search extends Component<{}, State> {
  state: State = {
    keyword: '',
    focused: false,
    history: [],
    products: [],
    searched: false,
    loading: false,
    sortBy: 'default',
    order: 'desc',
    page: 1,
    hasMore: true,
  }

  componentDidMount() {
    const history = getStorage(HISTORY_KEY) || []
    this.setState({ history })
  }

  addHistory(kw: string) {
    const hist = [kw, ...this.state.history.filter(h => h !== kw)].slice(0, 10)
    this.setState({ history: hist })
    setStorage(HISTORY_KEY, hist)
  }

  clearHistory() {
    this.setState({ history: [] })
    setStorage(HISTORY_KEY, [])
  }

  async doSearch(kw?: string, reset = true) {
    const { loading } = this.state
    if (loading) return
    const keyword = kw !== undefined ? kw : this.state.keyword
    if (!keyword.trim()) return
    const { sortBy, order, page } = this.state
    const nextPage = reset ? 1 : page + 1
    if (reset) this.setState({ keyword, searched: true, loading: true, products: [] })
    else this.setState({ loading: true })
    this.addHistory(keyword.trim())
    try {
      const params: any = { keyword: keyword.trim(), page: nextPage, size: 20, order }
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
      Taro.showToast({ title: '搜索失败', icon: 'none' })
      this.setState({ loading: false })
    }
  }

  setSort(sortBy: string, order: string) {
    this.setState({ sortBy, order }, () => this.doSearch(undefined, true))
  }

  goProduct(id: number) {
    Taro.navigateTo({ url: `/pages/product/detail/index?id=${id}` })
  }

  render() {
    const { keyword, history, products, searched, loading, sortBy, order, hasMore } = this.state

    return (
      <View className='search-page'>
        {/* 搜索栏 */}
        <View className='search-header'>
          <Text className='back-btn' onClick={() => Taro.navigateBack()}>‹</Text>
          <View className='search-input-wrap'>
            <Text className='search-icon-inner'>🔍</Text>
            <Input
              className='search-input'
              placeholder='搜索商品、品牌'
              value={keyword}
              focus
              onInput={e => this.setState({ keyword: e.detail.value })}
              onConfirm={() => this.doSearch()}
            />
            {keyword.length > 0 && (
              <Text className='clear-btn' onClick={() => this.setState({ keyword: '', searched: false, products: [] })}>✕</Text>
            )}
          </View>
          <Text className='search-btn' onClick={() => this.doSearch()}>搜索</Text>
        </View>

        {!searched ? (
          <ScrollView className='search-body' scrollY>
            {/* 热门搜索 */}
            <View className='section-card'>
              <Text className='section-title'>热门搜索</Text>
              <View className='hot-tags'>
                {HOT_KEYWORDS.map((kw, i) => (
                  <View key={i} className={`hot-tag ${i < 3 ? 'hot' : ''}`} onClick={() => this.doSearch(kw)}>
                    <Text>{kw}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* 搜索历史 */}
            {history.length > 0 && (
              <View className='section-card'>
                <View className='history-header'>
                  <Text className='section-title'>搜索历史</Text>
                  <Text className='clear-history' onClick={this.clearHistory.bind(this)}>清空</Text>
                </View>
                <View className='history-list'>
                  {history.map((h, i) => (
                    <View key={i} className='history-item' onClick={() => this.doSearch(h)}>
                      <Text className='history-icon'>🕐</Text>
                      <Text className='history-text'>{h}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        ) : (
          <View className='result-wrap'>
            {/* 排序栏 */}
            <View className='sort-bar'>
              <Text className={`sort-item ${sortBy === 'default' ? 'active' : ''}`} onClick={() => this.setSort('default', 'desc')}>综合</Text>
              <Text className={`sort-item ${sortBy === 'soldCount' ? 'active' : ''}`} onClick={() => this.setSort('soldCount', 'desc')}>销量</Text>
              <Text
                className={`sort-item ${sortBy === 'salePrice' ? 'active' : ''}`}
                onClick={() => this.setSort('salePrice', order === 'asc' ? 'desc' : 'asc')}
              >
                价格{sortBy === 'salePrice' ? (order === 'asc' ? '↑' : '↓') : ''}
              </Text>
            </View>

            <ScrollView
              className='result-scroll'
              scrollY
              onScrollToLower={() => this.doSearch(undefined, false)}
            >
              <View className='product-grid'>
                {products.map(p => (
                  <View className='product-card' key={p.id} onClick={() => this.goProduct(p.id)}>
                    <Image className='product-img' src={p.mainImage} mode='aspectFill' />
                    <View className='product-info'>
                      <Text className='product-name'>{p.productName}</Text>
                      <Text className='product-price'>¥{Number(p.salePrice).toFixed(2)}</Text>
                      {p.marketPrice > p.salePrice && (
                        <Text className='product-mkt'>¥{Number(p.marketPrice).toFixed(2)}</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
              {loading && <View className='tip'>搜索中...</View>}
              {!loading && !hasMore && products.length > 0 && <View className='tip'>— 已经到底了 —</View>}
              {!loading && products.length === 0 && (
                <View className='empty-tip'>
                  <Text className='empty-icon'>🔍</Text>
                  <Text className='empty-text'>没有找到相关商品</Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </View>
    )
  }
}
