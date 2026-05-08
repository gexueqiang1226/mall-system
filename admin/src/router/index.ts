import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/dashboard',
    component: () => import('@/views/Dashboard.vue'),
  },
  {
    path: '/product',
    component: () => import('@/views/product/ProductList.vue'),
  },
  {
    path: '/product/create',
    component: () => import('@/views/product/ProductEdit.vue'),
  },
  {
    path: '/product/edit/:id',
    component: () => import('@/views/product/ProductEdit.vue'),
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
