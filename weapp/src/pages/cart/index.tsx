import { Component } from 'react'
import { View, ScrollView, Text, Image, Button, Input } from '@tarojs/components'
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
}

export default class Cart extends Component<{}, CartState> {
  constructor(props) {
    super(props)
    this.state = {
      items: [],
      selectedAll: false,
      totalPrice: 0,
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
    const items = cart.map((item) => ({
      ...item,
      selected: true,
    }))
    this.setState({ items }, () => this.calculateTotal())
  }

  toggleItemSelect = (productId: number) => {
    this.setState(
      (prevState) => ({
        items: prevState.items.map((item) =>
          item.productId === productId ? { ...item, selected: !item.selected } : item
        ),
      }),
      () => this.calculateTotal()
    )
  }

  toggleSelectAll = () => {
    this.setState(
      (prevState) => {
        const selectedAll = !prevState.selectedAll
        return {
          items: prevState.items.map((item) => ({
            ...item,
            selected: selectedAll,
          })),
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
    this.setState(
      (prevState) => ({
        items: prevState.items.filter((item) => item.productId !== productId),
      }),
      () => this.saveCart()
    )
  }

  saveCart = () => {
    const { items } = this.state
    const cartData = items.map(({ selected, ...rest }) => rest)
    Taro.setStorageSync('CART', cartData)
    this.calculateTotal()
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
      Taro.showToast({
        title: '请选择商品',
        icon: 'error',
      })
      return
    }

    // 保存临时订单
    Taro.setStorageSync('TEMP_ORDER', {
      items: selectedItems,
      totalPrice,
    })

    Taro.navigateTo({
      url: '/pages/order/list/index',
    })
  }

  clearCart = () => {
    Taro.showModal({
      title: '确认清空购物车？',
      cancelText: '取消',
      confirmText: '确定',
      success: (res) => {
        if (res.confirm) {
          this.setState({ items: [] }, () => {
            Taro.setStorageSync('CART', [])
            Taro.showToast({
              title: '已清空',
              icon: 'success',
            })
          })
        }
      },
    })
  }

  render() {
    const { items, selectedAll, totalPrice } = this.state

    if (items.length === 0) {
      return (
        <View className="cart-empty">
          <View className="empty-icon">🛒</View>
          <Text>购物车为空</Text>
          <Button
            className="btn-shop"
            onClick={() => {
              Taro.switchTab({
                url: '/pages/index/index',
              })
            }}
          >
            去购物
          </Button>
        </View>
      )
    }

    return (
      <View className="cart-container">
        <ScrollView scrollY className="items-scroll">
          {/* 工具栏 */}
          <View className="cart-toolbar">
            <View className="select-all" onClick={this.toggleSelectAll}>
              <View className={`checkbox ${selectedAll ? 'checked' : ''}`}></View>
              <Text>全选</Text>
            </View>
            <Text className="clear-btn" onClick={this.clearCart}>
              清空
            </Text>
          </View>

          {/* 购物车项目 */}
          {items.map((item) => (
            <View key={item.productId} className="cart-item">
              <View
                className="checkbox-wrapper"
                onClick={() => this.toggleItemSelect(item.productId)}
              >
                <View className={`checkbox ${item.selected ? 'checked' : ''}`}></View>
              </View>

              <Image src={item.mainImage} className="item-image" />

              <View className="item-info">
                <Text className="item-name">{item.productName}</Text>
                <Text className="item-price">¥{item.salePrice}</Text>
              </View>

              <View className="quantity-control">
                <Button
                  size="mini"
                  onClick={() =>
                    this.updateQuantity(item.productId, item.quantity - 1)
                  }
                >
                  −
                </Button>
                <Input
                  type="number"
                  value={String(item.quantity)}
                  readOnly
                  className="qty-input"
                />
                <Button
                  size="mini"
                  onClick={() =>
                    this.updateQuantity(item.productId, item.quantity + 1)
                  }
                >
                  +
                </Button>
              </View>

              <Text
                className="remove-btn"
                onClick={() => this.removeItem(item.productId)}
              >
                🗑️
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* 底部结算 */}
        <View className="cart-footer">
          <View className="total-section">
            <Text>合计:</Text>
            <Text className="total-price">¥{totalPrice.toFixed(2)}</Text>
          </View>
          <Button className="btn-checkout" onClick={this.checkout}>
            结算 ({items.filter((i) => i.selected).length})
          </Button>
        </View>
      </View>
    )
  }
}
