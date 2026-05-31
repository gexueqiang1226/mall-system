import { Component } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Image, Swiper, SwiperItem, ScrollView } from '@tarojs/components'
import api from '@/services/api'
import './index.css'

interface Product {
  id: number
  productName: string
  mainImage: string
  salePrice: number
  marketPrice: number
  soldCount: number
  categoryId: number
}

interface Category {
  id: number
  name: string
  parentId: number
  level: number
}

interface State {
  banners: string[]
  categories: Category[]
  seckillProducts: Product[]
  recommendProducts: Product[]
  newProducts: Product[]
  guessProducts: Product[]
  page: number
  hasMore: boolean
  loading: boolean
  refreshing: boolean
  countdown: { h: string; m: string; s: string }
}

const CATEGORY_EMOJIS: Record<string, string> = {
  '电子产品': '📱', '手机数码': '📱', '服装鞋帽': '👔', '服装服饰': '👔',
  '美妆护肤': '💄', '食品饮料': '🍔', '食品生鲜': '🍔', '家居生活': '🏡',
  '家居家装': '🏡', '图书文娱': '📚', '游戏周边': '🎮', '母婴亲子': '🎁',
}

export default class Index extends Component<{}, State> {
  countdownTimer: any = null

  state: State = {
    banners: [
      'https://picsum.photos/800/300?random=10',
      'https://picsum.photos/800/300?random=11',
      'https://picsum.photos/800/300?random=12',
    ],
    categories: [],
    seckillProducts: [],
    recommendProducts: [],
    newProducts: [],
    guessProducts: [],
    page: 1,
    hasMore: true,
    loading: false,
    refreshing: false,
    countdown: { h: '02', m: '30', s: '00' },
  }

  componentDidMount() {
    this.loadData()
    this.startCountdown()
    this.initHorizontalDrag()
  }

  componentWillUnmount() {
    if (this.countdownTimer) clearInterval(this.countdownTimer)
  }

  // 桌面端鼠标拖拽水平滚动支持
  initHorizontalDrag() {
    const addDrag = (selector: string) => {
      const el = document.querySelector(selector) as HTMLElement | null
      if (!el) return
      let isDown = false, startX = 0, scrollLeft = 0, hasMoved = false
      el.addEventListener('mousedown', e => {
        isDown = true; hasMoved = false
        startX = e.pageX - el.offsetLeft
        scrollLeft = el.scrollLeft
        el.style.cursor = 'grabbing'
        e.preventDefault()
      })
      const stop = () => { isDown = false; el.style.cursor = '' }
      el.addEventListener('mouseleave', stop)
      el.addEventListener('mouseup', stop)
      el.addEventListener('mousemove', e => {
        if (!isDown) return
        e.preventDefault()
        const x = e.pageX - el.offsetLeft
        const walk = (x - startX) * 1.5
        if (Math.abs(walk) > 5) hasMoved = true
        el.scrollLeft = scrollLeft - walk
      })
      // 阻止拖拽时触发点击
      el.addEventListener('click', e => {
        if (hasMoved) { e.stopPropagation(); e.preventDefault() }
      }, true)
    }
    // 等DOM渲染完成后绑定
    setTimeout(() => {
      addDrag('.seckill-scroll')
      addDrag('.horizontal-scroll')
    }, 500)
  }

  startCountdown() {
    let total = 2 * 3600 + 30 * 60
    this.countdownTimer = setInterval(() => {
      total = total > 0 ? total - 1 : 7200
      const h = String(Math.floor(total / 3600)).padStart(2, '0')
      const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0')
      const s = String(total % 60).padStart(2, '0')
      this.setState({ countdown: { h, m, s } })
    }, 1000)
  }

  async loadData() {
    this.setState({ loading: true })
    try {
      const [catRes, seckillRes, newRes, recommendRes] = await Promise.all([
        api.get('/categories'),
        api.get('/products', { tag: 'seckill', page: 1, size: 6 }),
        api.get('/products', { tag: 'new', page: 1, size: 6 }),
        api.get('/products', { tag: 'recommend', page: 1, size: 8 }),
      ])
      const categories: Category[] = ((catRes?.data || []) as Category[])
        .filter(c => !c.parentId || c.parentId === 0)
        .slice(0, 8)
      const seckillProducts: Product[] = seckillRes?.data?.items || []
      const newProducts: Product[] = newRes?.data?.items || []
      const recommendProducts: Product[] = recommendRes?.data?.items || []
      this.setState({
        categories,
        seckillProducts,
        recommendProducts,
        newProducts,
        guessProducts: recommendProducts.slice(0, 10),
        page: 1,
        hasMore: recommendProducts.length >= 10,
        loading: false,
        refreshing: false,
      })
    } catch {
      Taro.showToast({ title: '加载失败', icon: 'none' })
      this.setState({ loading: false, refreshing: false })
    }
  }

  async loadMore() {
    if (!this.state.hasMore || this.state.loading) return
    const nextPage = this.state.page + 1
    this.setState({ loading: true })
    try {
      const res = await api.get('/products', { page: nextPage, size: 10 })
      const newItems: Product[] = res?.data?.items || []
      this.setState(prev => ({
        guessProducts: [...prev.guessProducts, ...newItems],
        page: nextPage,
        hasMore: newItems.length >= 10,
        loading: false,
      }))
    } catch {
      this.setState({ loading: false })
    }
  }

  onRefresh() {
    this.setState({ refreshing: true }, () => this.loadData())
  }

  goProduct(id: number) {
    Taro.navigateTo({ url: `/pages/product/detail/index?id=${id}` })
  }

  goSearch() {
    Taro.navigateTo({ url: '/pages/search/index' })
  }

  goCategory(catId?: number) {
    // 用URL hash参数传递，分类页componentDidShow中解析
    const hash = catId ? `#/pages/product/list/index?categoryId=${catId}` : '#/pages/product/list/index'
    location.hash = hash
  }

  goProductList(tag: string) {
    // 用URL hash传递tag参数
    location.hash = `#/pages/product/list/index?tag=${tag}`
  }

  render() {
    const { banners, categories, seckillProducts, recommendProducts, newProducts, guessProducts, countdown, refreshing } = this.state

    const displayCats = categories.length ? categories : Array(8).fill(null)

    return (
      <View className='page'>
        {/* 固定搜索栏 */}
        <View className='search-bar' onClick={this.goSearch.bind(this)}>
          <View className='search-input-wrap'>
            <Text className='search-icon'>🔍</Text>
            <Text className='search-placeholder'>搜索商品、品牌</Text>
          </View>
          <Text className='scan-icon'>📷</Text>
        </View>

        <ScrollView
          className='scroll-body'
          scrollY
          refresherEnabled
          refresherTriggered={refreshing}
          onRefresherRefresh={this.onRefresh.bind(this)}
          onScrollToLower={this.loadMore.bind(this)}
        >
          {/* Banner轮播 */}
          <Swiper
            className='banner'
            autoplay
            interval={3000}
            circular
            indicatorDots
            indicatorColor='rgba(255,255,255,0.5)'
            indicatorActiveColor='#fff'
          >
            {banners.map((b, i) => (
              <SwiperItem key={i}>
                <Image className='banner-img' src={b} mode='aspectFill' />
              </SwiperItem>
            ))}
          </Swiper>

          {/* 金刚区分类 */}
          <View className='section-card'>
            <View className='category-grid'>
              {displayCats.map((cat, i) => (
                <View
                  className='category-item'
                  key={i}
                  onClick={() => this.goCategory(cat?.id)}
                >
                  <View className='category-icon-circle'>{CATEGORY_EMOJIS[cat?.name] || '📦'}</View>
                  <Text className='category-label'>{cat?.name || '其他'}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* 限时秒杀 */}
          <View className='section-card seckill-section'>
            <View className='section-header'>
              <View className='seckill-title-wrap'>
                <Text className='seckill-title'>⚡ 限时秒杀</Text>
                <View className='countdown-wrap'>
                  <Text className='countdown-block'>{countdown.h}</Text>
                  <Text className='countdown-sep'>:</Text>
                  <Text className='countdown-block'>{countdown.m}</Text>
                  <Text className='countdown-sep'>:</Text>
                  <Text className='countdown-block'>{countdown.s}</Text>
                </View>
              </View>
              <Text className='more-link' onClick={() => this.goProductList('seckill')}>更多 &gt;</Text>
            </View>
            <View className='seckill-scroll'>
              {seckillProducts.map(p => {
                const pct = Math.min(85, 30 + (p.soldCount || 0) % 55)
                return (
                  <View className='seckill-card' key={p.id} onClick={() => this.goProduct(p.id)}>
                    <Image className='seckill-img' src={p.mainImage} mode='aspectFill' />
                    <Text className='seckill-price'>¥{Number(p.salePrice).toFixed(0)}</Text>
                    <View className='seckill-progress-bg'>
                      <View className='seckill-progress-fill' style={{ width: `${pct}%` }} />
                    </View>
                    <Text className='seckill-pct'>已抢{pct}%</Text>
                  </View>
                )
              })}
            </View>
          </View>

          {/* 人气推荐 */}
          <View className='section-card'>
            <View className='section-header'>
              <Text className='section-title'>🔥 人气推荐</Text>
              <Text className='more-link' onClick={() => this.goProductList('hot')}>更多 &gt;</Text>
            </View>
            <View className='horizontal-scroll'>
              {recommendProducts.map(p => (
                <View className='h-product-card' key={p.id} onClick={() => this.goProduct(p.id)}>
                  <Image className='h-product-img' src={p.mainImage} mode='aspectFill' />
                  <Text className='h-product-name'>{p.productName}</Text>
                  <Text className='h-product-price'>¥{Number(p.salePrice).toFixed(2)}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* 新品首发 */}
          <View className='section-card'>
            <View className='section-header'>
              <Text className='section-title'>✨ 新品首发</Text>
              <Text className='more-link' onClick={() => this.goProductList('new')}>更多 &gt;</Text>
            </View>
            <View className='horizontal-scroll'>
              {newProducts.map(p => (
                <View className='h-product-card' key={p.id} onClick={() => this.goProduct(p.id)}>
                  <View style={{ position: 'relative' }}>
                    <Image className='h-product-img' src={p.mainImage} mode='aspectFill' />
                    <View className='new-badge'>NEW</View>
                  </View>
                  <Text className='h-product-name'>{p.productName}</Text>
                  <Text className='h-product-price'>¥{Number(p.salePrice).toFixed(2)}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* 猜你喜欢 */}
          <View className='section-card guess-section'>
            <View className='section-header'>
              <Text className='section-title'>💡 猜你喜欢</Text>
            </View>
            <View className='guess-grid'>
              {guessProducts.map(p => (
                <View className='guess-card' key={p.id} onClick={() => this.goProduct(p.id)}>
                  <Image className='guess-img' src={p.mainImage} mode='aspectFill' />
                  <View className='guess-info'>
                    <Text className='guess-name'>{p.productName}</Text>
                    <Text className='guess-price'>¥{Number(p.salePrice).toFixed(2)}</Text>
                    <Text className='guess-sold'>已售{p.soldCount || 0}件</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View className='page-bottom'><Text>— 已经到底了 —</Text></View>
        </ScrollView>
      </View>
    )
  }
}
