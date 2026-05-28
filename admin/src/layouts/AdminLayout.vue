<template>
  <el-container class="layout-container">
    <el-aside width="220px" class="layout-aside">
      <div class="logo">Mall Admin</div>
      <el-menu
        :default-active="activeMenu"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
      >
        <el-menu-item index="/dashboard">
          <span>仪表板</span>
        </el-menu-item>
        <el-sub-menu index="product-menu">
          <template #title><span>商品管理</span></template>
          <el-menu-item index="/product">商品列表</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="order-menu">
          <template #title><span>订单管理</span></template>
          <el-menu-item index="/order">订单列表</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="category-menu">
          <template #title><span>分类管理</span></template>
          <el-menu-item index="/category">分类列表</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="inventory-menu">
          <template #title><span>库存管理</span></template>
          <el-menu-item index="/inventory-log">库存日志</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="layout-header">
        <div class="header-right">
          <span class="username">{{ authStore.userInfo?.realName || authStore.userInfo?.username || '' }}</span>
          <el-button type="text" @click="onLogout">退出登录</el-button>
        </div>
      </el-header>
      <el-main class="layout-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const activeMenu = computed(() => route.path)

const onLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}
.layout-aside {
  background-color: #304156;
  overflow-y: auto;
}
.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 20px;
  font-weight: bold;
  background-color: #263445;
}
.layout-header {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  background: #fff;
  border-bottom: 1px solid #e6e6e6;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.username {
  color: #606266;
  font-size: 14px;
}
.layout-main {
  background: #f5f7fa;
  overflow-y: auto;
}
</style>
