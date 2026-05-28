import { Component } from 'react'
import { View, ScrollView, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import api from '@/services/api'
import './index.css'

interface CartItem {
  id: number
  productId: number
  productName: string
  mainImage: string
  salePrice: number
  skuPrice?: number
  quantity: number
  checked: number
  skuSpecs?: string
}

interface CartState {
  items: CartItem[]
  loading: boolean
  failedImages: Set<number>
}

export default class Cart extends Component<{}, CartState> {
  constructor(props) {
    super(props)
    this.state = {
      items: [],
      loading: true,
      failedImages: new Set(),
    }
  }

  componentDidMount() {
    this.loadCart()
  }

  componentDidShow() {
    this.loadCart()
  }

  getUserId = (): number | null => {
    const userInfo = Taro.getStorageSync('USER_INFO')
    return userInfo?.userId || null
  }

  loadCart = async () => {
    const userId = this.getUserId()
    if (!userId) {
      this.setState({ items: [], loading: false })
      return
    }
    try {
      this.setState({ loading: true })
      const res = await api.get('/cart', { userId })
      const items: CartItem[] = res.data || res || []
      this.setState({ items, loading: false })
    } catch (err) {
      console.error('Failed to load cart:', err)
      this.setState({ loading: false })
      Taro.showToast({ title: '加载购物车失败', icon: 'error' })
    }
  }

  getUnitPrice = (item: CartItem): number => {
    return item.skuPrice || item.salePrice || 0
  }

  isAllChecked = (): boolean => {
    const { items } = this.state
    return items.length > 0 && items.every((item) => item.checked === 1)
  }

  getCheckedCount = (): number => {
    return this.state.items.filter((item) => item.checked === 1).length
  }

  getTotalPrice = (): number => {
    return this.state.items
      .filter((item) => item.checked === 1)
      .reduce((sum, item) => sum + this.getUnitPrice(item) * item.quantity, 0)
  }

  toggleItemCheck = async (item: CartItem) => {
    const newChecked = item.checked === 1 ? 0 : 1
    try {
      await api.put(`/cart/${item.id}`, { checked: newChecked })
      this.setState((prev) => ({
        items: prev.items.map((i) =>
          i.id === item.id ? { ...i, checked: newChecked } : i
        ),
      }))
    } catch (err) {
      console.error('Toggle check failed:', err)
      Taro.showToast({ title: '操作失败', icon: 'error' })
    }
  }

  toggleSelectAll = async () => {
    const userId = this.getUserId()
    if (!userId) return
    const newChecked = this.isAllChecked() ? 0 : 1
    try {
      await api.put('/cart/checkAll', { userId, checked: newChecked })
      this.setState((prev) => ({
        items: prev.items.map((item) => ({ ...item, checked: newChecked })),
      }))
    } catch (err) {
      console.error('Toggle all check failed:', err)
      Taro.showToast({ title: '操作失败', icon: 'error' })
    }
  }

  updateQuantity = async (item: CartItem, newQty: number) => {
    if (newQty < 1) {
      this.removeItem(item)
      return
    }
    try {
      await api.put(`/cart/${item.id}`, { quantity: newQty })
      this.setState((prev) => ({
        items: prev.items.map((i) =>
          i.id === item.id ? { ...i, quantity: newQty } : i
        ),
      }))
    } catch (err) {
      console.error('Update quantity failed:', err)
      Taro.showToast({ title: '修改数量失败', icon: 'error' })
    }
  }

  removeItem = (item: CartItem) => {
    Taro.showModal({
      title: '提示',
      content: '确定要删除该商品吗？',
      confirmText: '删除',
      confirmColor: '#E53935',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.delete(`/cart/${item.id}`)
            this.setState((prev) => ({
              items: prev.items.filter((i) => i.id !== item.id),
            }))
          } catch (err) {
            console.error('Delete item failed:', err)
            Taro.showToast({ title: '删除失败', icon: 'error' })
          }
        }
      },
    })
  }

  handleImageError = (id: number) => {
    this.setState((prev) => {
      const failedImages = new Set(prev.failedImages)
      failedImages.add(id)
      return { failedImages }
    })
  }

  checkout = () => {
    const checkedItems = this.state.items.filter((item) => item.checked === 1)
    if (checkedItems.length === 0) {
      Taro.showToast({ title: '请选择商品', icon: 'error' })
      return
    }
    Taro.navigateTo({ url: '/pages/order/list/index' })
  }

  goShopping = () => {
    Taro.switchTab({ url: '/pages/index/index' })
  }

  render() {
    const { items, loading, failedImages } = this.state

    if (loading) {
      return (
        <View className="cart-page">
          <View className="cart-loading">
            <Text className="cart-loading-text">加载中...</Text>
          </View>
        </View>
      )
    }

    if (items.length === 0) {
      return (
        <View className="cart-page">
          <View className="cart-empty">
            <svg className="empty-icon" width="80" height="80" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 6L9 4C9 3.44772 9.44772 3 10 3L14 3C14.5523 3 15 3.44772 15 4L15 6"
                stroke="#ccc"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M20 6L4 6M20 6V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V6M20 6L18 6"
                stroke="#ccc"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <Text className="empty-title">购物车是空的</Text>
            <Text className="empty-desc">去逛逛，发现好物吧~</Text>
            <View className="empty-btn" onClick={this.goShopping}>
              <Text className="empty-btn-text">去购物</Text>
            </View>
          </View>
        </View>
      )
    }

    const selectedAll = this.isAllChecked()
    const checkedCount = this.getCheckedCount()
    const totalPrice = this.getTotalPrice()

    return (
      <View className="cart-page">
        <ScrollView scrollY className="cart-scroll">
          {items.map((item) => {
            const unitPrice = this.getUnitPrice(item)
            return (
              <View key={item.id} className="cart-item">
                {/* Checkbox */}
                <View className="cart-checkbox" onClick={() => this.toggleItemCheck(item)}>
                  <View className={`check-circle ${item.checked === 1 ? 'checked' : ''}`}>
                    {item.checked === 1 && (
                      <svg className="check-icon" width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M5 12L10 17L19 7" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </View>
                </View>

                {/* Image */}
                {failedImages.has(item.id) || !item.mainImage ? (
                  <View className="cart-item-img-fallback">
                    <Text className="fallback-letter">{(item.productName || '?')[0]}</Text>
                  </View>
                ) : (
                  <Image
                    src={item.mainImage}
                    mode="aspectFill"
                    className="cart-item-img"
                    onError={() => this.handleImageError(item.id)}
                  />
                )}

                {/* Info */}
                <View className="cart-item-info">
                  <Text className="cart-item-name" numberOfLines={2}>{item.productName}</Text>
                  {item.skuSpecs ? (
                    <Text className="cart-item-specs">{item.skuSpecs}</Text>
                  ) : null}
                  <View className="cart-item-bottom">
                    <Text className="cart-item-price">&yen;{unitPrice.toFixed(2)}</Text>
                    <View className="qty-stepper">
                      <View className="stepper-btn" onClick={() => this.updateQuantity(item, item.quantity - 1)}>
                        <Text className={`stepper-btn-text ${item.quantity <= 1 ? 'disabled' : ''}`}>&minus;</Text>
                      </View>
                      <Text className="stepper-value">{item.quantity}</Text>
                      <View className="stepper-btn" onClick={() => this.updateQuantity(item, item.quantity + 1)}>
                        <Text className="stepper-btn-text">+</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Delete */}
                <View className="cart-delete" onClick={() => this.removeItem(item)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M3 6H5H21M8 6V4C8 3.44772 8.44772 3 9 3H15C15.5523 3 16 3.44772 16 4V6M19 6V20C19 20.5523 18.5523 21 18 21H6C5.44772 21 5 20.5523 5 20V6"
                      stroke="#999"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </View>
              </View>
            )
          })}
        </ScrollView>

        {/* Fixed Footer */}
        <View className="cart-footer">
          <View className="footer-left" onClick={this.toggleSelectAll}>
            <View className={`check-circle ${selectedAll ? 'checked' : ''}`}>
              {selectedAll && (
                <svg className="check-icon" width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12L10 17L19 7" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </View>
            <Text className="select-all-text">全选</Text>
          </View>
          <View className="footer-right">
            <View className="total-wrap">
              <Text className="total-label">合计:</Text>
              <Text className="total-symbol">&yen;</Text>
              <Text className="total-value">{totalPrice.toFixed(2)}</Text>
            </View>
            <View className={`checkout-btn ${checkedCount === 0 ? 'disabled' : ''}`} onClick={this.checkout}>
              <Text className="checkout-text">结算({checkedCount})</Text>
            </View>
          </View>
        </View>
      </View>
    )
  }
}
