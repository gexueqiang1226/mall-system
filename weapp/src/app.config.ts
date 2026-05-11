export default definePageConfig({
  pages: [
    'pages/index/index',
    'pages/product/list/index',
    'pages/product/detail/index',
    'pages/cart/index',
    'pages/order/list/index',
    'pages/order/detail/index',
    'pages/order/myorders/index',
    'pages/user/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: 'Mall',
    navigationBarTextStyle: 'black',
  },
  tabBar: {
    color: '#999',
    selectedColor: '#FF6B6B',
    backgroundColor: '#fff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页',
        iconPath: 'assets/tab-home.png',
        selectedIconPath: 'assets/tab-home-active.png',
      },
      {
        pagePath: 'pages/product/list/index',
        text: '分类',
        iconPath: 'assets/tab-category.png',
        selectedIconPath: 'assets/tab-category-active.png',
      },
      {
        pagePath: 'pages/cart/index',
        text: '购物车',
        iconPath: 'assets/tab-cart.png',
        selectedIconPath: 'assets/tab-cart-active.png',
      },
      {
        pagePath: 'pages/user/index',
        text: '我的',
        iconPath: 'assets/tab-user.png',
        selectedIconPath: 'assets/tab-user-active.png',
      },
    ],
  },
})
