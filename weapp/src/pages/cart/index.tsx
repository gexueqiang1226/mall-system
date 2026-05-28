import { Component } from 'react'
import { View, ScrollView, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.css'

interface CartItem {
  productId: number
  productName: string
  mainImage: string
  salePrice: number
  quantity: number
  selected?: boolean
}

interface CartState {
  items: CartItem[]
  selectedAll: boolean
  totalPrice: number
  failedImages: Set<number>
}

export default class Cart extends Component<{}, CartState> {
  constructor(props) {
    super(props)
    this.state = {
      items: [],
      selectedAll: false,
      totalPrice: 0,
      failedImages: new Set(),
    }
  }

  componentDidMount() {
    this.loadCart()
  }

  componentDidShow() {
    this.loadCart()
  }

  loadCart = () => {
    const cart = Taro.getStorageSync('CART') || []
    const items = cart.map((item: CartItem) => ({
      ...item,
      mainImage: item.mainImage || '',
      selected: true,
    }))
    const selectedAll = items.length > 0
    this.setState({ items, selectedAll }, () => this.calculateTotal())
  }

  toggleItemSelect = (productId: number) => {
    this.setState(
      (prevState) => {
        const items = prevState.items.map((item) =>
          item.productId === productId ? { ...item, selected: !item.selected } : item
        )
        return {
          items,
          selectedAll: items.every((item) => item.selected),
        }
      },
      () => this.calculateTotal()
    )
  }

  toggleSelectAll = () => {
    this.setState(
      (prevState) => {
        const selectedAll = !prevState.selectedAll
        return {
          items: prevState.items.map((item) => ({ ...item, selected: selectedAll })),
          selectedAll,
        }
      },
      () => this.calculateTotal()
    )
  }

  updateQuantity = (productId: number, quantity: number) => {
    if (quantity < 1) {
      this.removeItem(productId)
      return
    }
    this.setState(
      (prevState) => ({
        items: prevState.items.map((item) =>
          item.productId === productId ? { ...item, quantity } : item
        ),
      }),
      () => this.saveCart()
    )
  }

  removeItem = (productId: number) => {
    Taro.showModal({
      title: '提示',
      content: '确定要删除该商品吗？',
      confirmText: '删除',
      confirmColor: '#E53935',
      success: (res) => {
        if (res.confirm) {
          this.setState(
            (prevState) => ({
              items: prevState.items.filter((item) => item.productId !== productId),
            }),
            () => this.saveCart()
          )
        }
      },
    })
  }

  saveCart = () => {
    const { items } = this.state
    const cartData = items.map(({ selected, ...rest }) => rest)
    Taro.setStorageSync('CART', cartData)
    this.calculateTotal()
  }

  handleImageError = (productId: number) => {
    this.setState((prev) => {
      const failedImages = new Set(prev.failedImages)
      failedImages.add(productId)
      return { failedImages }
    })
  }

  calculateTotal = () => {
    const { items } = this.state
    const totalPrice = items
      .filter((item) => item.selected)
      .reduce((sum, item) => sum + item.salePrice * item.quantity, 0)
    this.setState({ totalPrice })
  }

  checkout = () => {
    const { items, totalPrice } = this.state
    const selectedItems = items.filter((item) => item.selected)

    if (selectedItems.length === 0) {
      Taro.showToast({ title: '请选择商品', icon: 'error' })
      return
    }

    Taro.setStorageSync('TEMP_ORDER', { items: selectedItems, totalPrice })
    Taro.navigateTo({ url: '/pages/order/list/index' })
  }

  render() {
    const { items, selectedAll, totalPrice, failedImages } = this.state
    const selectedCount = items.filter((i) => i.selected).length

    if (items.length === 0) {
      return (
        <View className="cart-page">
          <View className="cart-empty">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
              <path d="M9 6L9 4C9 3.44772 9.44772 3 10 3L14 3C14.5523 3 15 3.44772 15 4L15 6" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M20 6L4 6M20 6V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V6M20 6L18 6" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <Text className="empty-title">购物车是空的</Text>
            <Text className="empty-desc">去逛逛，发现好物吧~</Text>
            <View className="empty-btn" onClick={() => Taro.switchTab({ url: '/pages/index/index' })}>
              <Text className="empty-btn-text">去购物</Text>
            </View>
          </View>
        </View>
      )
    }

    return (
      <View className="cart-page">
        <ScrollView scrollY className="cart-scroll">
          {items.map((item) => (
            <View key={item.productId} className="cart-item">
              {/* Checkbox */}
              <View className="cart-checkbox" onClick={() => this.toggleItemSelect(item.productId)}>
                <View className={`check-circle ${item.selected ? 'checked' : ''}`}>
                  {item.selected && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12L10 17L19 7" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </View>
              </View>

              {/* Image */}
              {failedImages.has(item.productId) || !item.mainImage ? (
                <View className="cart-item-img" style={{ background: '#F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
                  <Text style={{ fontSize: '20px', color: '#999', fontWeight: 'bold' }}>{(item.productName || '?')[0]}</Text>
                </View>
              ) : (
                <Image src={item.mainImage} mode="aspectFill" className="cart-item-img" onError={() => this.handleImageError(item.productId)} />
              )}

              {/* Info */}
              <View className="cart-item-info">
                <Text className="cart-item-name" numberOfLines={2}>{item.productName}</Text>
                <View className="cart-item-bottom">
                  <Text className="cart-item-price">¥{item.salePrice}</Text>
                  <View className="qty-stepper">
                    <View className="stepper-btn" onClick={() => this.updateQuantity(item.productId, item.quantity - 1)}>
                      <Text className="stepper-btn-text">−</Text>
                    </View>
                    <Text className="stepper-value">{item.quantity}</Text>
                    <View className="stepper-btn" onClick={() => this.updateQuantity(item.productId, item.quantity + 1)}>
                      <Text className="stepper-btn-text">+</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Delete */}
              <View className="cart-delete" onClick={() => this.removeItem(item.productId)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M3 6H5H21M8 6V4C8 3.44772 8.44772 3 9 3H15C15.5523 3 16 3.44772 16 4V6M19 6V20C19 20.5523 18.5523 21 18 21H6C5.44772 21 5 20.5523 5 20V6" stroke="#999" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Fixed Bottom */}
        <View className="cart-footer">
          <View className="footer-left" onClick={this.toggleSelectAll}>
            <View className={`check-circle ${selectedAll ? 'checked' : ''}`}>
              {selectedAll && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12L10 17L19 7" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </View>
            <Text className="select-all-text">全选</Text>
          </View>
          <View className="footer-right">
            <View className="total-wrap">
              <Text className="total-label">合计:</Text>
              <Text className="total-symbol">¥</Text>
              <Text className="total-value">{totalPrice.toFixed(2)}</Text>
            </View>
            <View className={`checkout-btn ${selectedCount === 0 ? 'disabled' : ''}`} onClick={this.checkout}>
              <Text className="checkout-text">结算({selectedCount})</Text>
            </View>
          </View>
        </View>
      </View>
    )
  }
}
