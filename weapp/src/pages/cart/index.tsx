import { Component } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import api from '@/services/api'
import './index.css'

interface CartItem {
  id: number
  userId: number
  productId: number
  productName: string
  mainImage: string
  salePrice: number
  quantity: number
  skuId: number
  checked: boolean
}

interface State {
  items: CartItem[]
  editMode: boolean
  loading: boolean
  userId: number
}

export default class Cart extends Component<{}, State> {
  debounceTimer: any = {}

  state: State = {
    items: [],
    editMode: false,
    loading: false,
    userId: 0,
  }

  componentDidShow() {
    const userInfo = Taro.getStorageSync('USER_INFO')
    const userId = userInfo?.id || Taro.getStorageSync('USER_ID') || 0
    this.setState({ userId }, () => {
      if (userId) this.loadCart()
    })
  }

  async loadCart() {
    const { userId } = this.state
    this.setState({ loading: true })
    try {
      const res = await api.get('/cart', { userId })
      const items: CartItem[] = (res?.data || []).map((i: any) => ({ ...i, checked: i.checked !== 0 }))
      this.setState({ items, loading: false })
    } catch {
      Taro.showToast({ title: '加载失败', icon: 'none' })
      this.setState({ loading: false })
    }
  }

  get checkedItems() {
    return this.state.items.filter(i => i.checked)
  }

  get totalPrice() {
    return this.checkedItems.reduce((sum, i) => sum + i.salePrice * i.quantity, 0)
  }

  get allChecked() {
    return this.state.items.length > 0 && this.state.items.every(i => i.checked)
  }

  async toggleCheck(item: CartItem) {
    const checked = !item.checked
    const items = this.state.items.map(i => i.id === item.id ? { ...i, checked } : i)
    this.setState({ items })
    try {
      await api.put(`/cart/${item.id}`, { quantity: item.quantity, checked: checked ? 1 : 0 })
    } catch {}
  }

  async toggleAll() {
    const checked = !this.allChecked
    const items = this.state.items.map(i => ({ ...i, checked }))
    this.setState({ items })
    try {
      await api.put(`/cart/checkAll?userId=${this.state.userId}&checked=${checked ? 1 : 0}`, {})
    } catch {}
  }

  changeQty(item: CartItem, delta: number) {
    const quantity = Math.max(1, item.quantity + delta)
    const items = this.state.items.map(i => i.id === item.id ? { ...i, quantity } : i)
    this.setState({ items })
    clearTimeout(this.debounceTimer[item.id])
    this.debounceTimer[item.id] = setTimeout(async () => {
      try {
        await api.put(`/cart/${item.id}`, { quantity, checked: item.checked ? 1 : 0 })
      } catch {}
    }, 600)
  }

  async deleteItem(item: CartItem) {
    try {
      await api.delete(`/cart/${item.id}`)
      const items = this.state.items.filter(i => i.id !== item.id)
      this.setState({ items })
      Taro.showToast({ title: '已删除', icon: 'success' })
    } catch {
      Taro.showToast({ title: '删除失败', icon: 'none' })
    }
  }

  async deleteChecked() {
    const toDelete = this.checkedItems
    if (toDelete.length === 0) return
    try {
      await Promise.all(toDelete.map(i => api.delete(`/cart/${i.id}`)))
      const deletedIds = new Set(toDelete.map(i => i.id))
      this.setState({ items: this.state.items.filter(i => !deletedIds.has(i.id)) })
      Taro.showToast({ title: '已删除', icon: 'success' })
    } catch {
      Taro.showToast({ title: '删除失败', icon: 'none' })
    }
  }

  checkout() {
    const checked = this.checkedItems
    if (checked.length === 0) {
      Taro.showToast({ title: '请选择商品', icon: 'none' })
      return
    }
    const items = checked.map(i => ({ productId: i.productId, quantity: i.quantity, skuId: i.skuId }))
    Taro.setStorageSync('CHECKOUT_ITEMS', items)
    Taro.navigateTo({ url: '/pages/order/list/index?fromCart=1' })
  }

  goProduct(productId: number) {
    Taro.navigateTo({ url: `/pages/product/detail/index?id=${productId}` })
  }

  render() {
    const { items, editMode, loading, userId } = this.state

    if (!userId) {
      return (
        <View className='cart-page'>
          <View className='cart-header'>
            <Text className='cart-title'>购物车</Text>
          </View>
          <View className='empty-cart'>
            <Text className='empty-icon'>🛒</Text>
            <Text className='empty-text'>请先登录</Text>
            <View className='go-shop-btn' onClick={() => Taro.navigateTo({ url: '/pages/login/index' })}>
              <Text>去登录</Text>
            </View>
          </View>
        </View>
      )
    }

    if (!loading && items.length === 0) {
      return (
        <View className='cart-page'>
          <View className='cart-header'>
            <Text className='cart-title'>购物车</Text>
          </View>
          <View className='empty-cart'>
            <Text className='empty-icon'>🛒</Text>
            <Text className='empty-text'>购物车是空的</Text>
            <View className='go-shop-btn' onClick={() => Taro.switchTab({ url: '/pages/index/index' })}>
              <Text>去逛逛</Text>
            </View>
          </View>
        </View>
      )
    }

    return (
      <View className='cart-page'>
        {/* 标题栏 */}
        <View className='cart-header'>
          <Text className='cart-title'>购物车</Text>
          <Text
            className='edit-btn'
            onClick={() => this.setState({ editMode: !editMode })}
          >
            {editMode ? '完成' : '编辑'}
          </Text>
        </View>

        <ScrollView className='cart-scroll' scrollY>
          {items.map(item => (
            <View className='cart-item' key={item.id}>
              {/* 复选框 */}
              <View
                className={`checkbox ${item.checked ? 'checked' : ''}`}
                onClick={() => this.toggleCheck(item)}
              >
                {item.checked && <Text className='check-mark'>✓</Text>}
              </View>

              {/* 商品图 */}
              <Image
                className='item-img'
                src={item.mainImage}
                mode='aspectFill'
                onClick={() => this.goProduct(item.productId)}
              />

              {/* 商品信息 */}
              <View className='item-info'>
                <Text className='item-name' onClick={() => this.goProduct(item.productId)}>
                  {item.productName}
                </Text>
                <Text className='item-price'>¥{Number(item.salePrice).toFixed(2)}</Text>

                <View className='item-bottom'>
                  {editMode ? (
                    <View className='delete-btn' onClick={() => this.deleteItem(item)}>
                      <Text>删除</Text>
                    </View>
                  ) : (
                    <View className='qty-ctrl'>
                      <View className='qty-btn' onClick={() => this.changeQty(item, -1)}>
                        <Text>−</Text>
                      </View>
                      <Text className='qty-num'>{item.quantity}</Text>
                      <View className='qty-btn' onClick={() => this.changeQty(item, 1)}>
                        <Text>+</Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            </View>
          ))}
          <View style={{ height: '80px' }} />
        </ScrollView>

        {/* 底部结算栏 */}
        <View className='checkout-bar'>
          <View className='all-check-wrap' onClick={this.toggleAll.bind(this)}>
            <View className={`checkbox ${this.allChecked ? 'checked' : ''}`}>
              {this.allChecked && <Text className='check-mark'>✓</Text>}
            </View>
            <Text className='all-check-text'>全选</Text>
          </View>

          {editMode ? (
            <View
              className={`checkout-btn delete-mode ${this.checkedItems.length > 0 ? '' : 'disabled'}`}
              onClick={this.deleteChecked.bind(this)}
            >
              <Text>删除({this.checkedItems.length})</Text>
            </View>
          ) : (
            <View className='total-checkout'>
              <View>
                <Text className='total-label'>合计：</Text>
                <Text className='total-price'>¥{this.totalPrice.toFixed(2)}</Text>
              </View>
              <View
                className={`checkout-btn ${this.checkedItems.length > 0 ? '' : 'disabled'}`}
                onClick={this.checkout.bind(this)}
              >
                <Text>结算({this.checkedItems.length})</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    )
  }
}
