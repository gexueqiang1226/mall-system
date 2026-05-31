import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/store/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    component: () => import('@/layouts/AdminLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
      },
      {
        path: 'product',
        name: 'ProductList',
        component: () => import('@/views/product/ProductList.vue'),
      },
      {
        path: 'product/create',
        name: 'ProductCreate',
        component: () => import('@/views/product/ProductEdit.vue'),
      },
      {
        path: 'product/edit/:id',
        name: 'ProductEdit',
        component: () => import('@/views/product/ProductEdit.vue'),
      },
      {
        path: 'product/seckill',
        name: 'SeckillManage',
        component: () => import('@/views/product/SeckillManage.vue'),
      },
      {
        path: 'product/new',
        name: 'NewManage',
        component: () => import('@/views/product/NewManage.vue'),
      },
      {
        path: 'product/recommend',
        name: 'RecommendManage',
        component: () => import('@/views/product/RecommendManage.vue'),
      },
      {
        path: 'order',
        name: 'OrderList',
        component: () => import('@/views/order/OrderList.vue'),
      },
      {
        path: 'order/:id',
        name: 'OrderDetail',
        component: () => import('@/views/order/OrderDetail.vue'),
      },
      {
        path: 'category',
        name: 'CategoryList',
        component: () => import('@/views/category/CategoryList.vue'),
      },
      {
        path: 'inventory-log',
        name: 'InventoryLog',
        component: () => import('@/views/inventory/InventoryLogList.vue'),
      },
      {
        path: 'user',
        name: 'UserList',
        component: () => import('@/views/user/UserList.vue'),
      },
      {
        path: 'coupon',
        name: 'CouponList',
        component: () => import('@/views/coupon/CouponList.vue'),
      },
      {
        path: 'review',
        name: 'ReviewList',
        component: () => import('@/views/review/ReviewList.vue'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  if (to.meta.public) {
    next()
    return
  }
  const authStore = useAuthStore()
  if (!authStore.isLoggedIn()) {
    next('/login')
  } else {
    next()
  }
})

export default router
