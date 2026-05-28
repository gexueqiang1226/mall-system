import { defineStore } from 'pinia'
import { ref } from 'vue'
import request from '@/utils/request'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('admin_token') || '')
  const userInfo = ref<any>(null)

  const initFromStorage = () => {
    const stored = localStorage.getItem('admin_user')
    if (stored) {
      try { userInfo.value = JSON.parse(stored) } catch {}
    }
  }

  const login = async (username: string, password: string) => {
    const res = await request.post('/admin/api/auth/login', { username, password })
    const data = res.data
    token.value = data.token
    userInfo.value = {
      userId: data.userId,
      username: data.username,
      realName: data.realName,
      role: data.role,
    }
    localStorage.setItem('admin_token', data.token)
    localStorage.setItem('admin_user', JSON.stringify(userInfo.value))
    return data
  }

  const logout = () => {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
  }

  const isLoggedIn = () => !!token.value

  initFromStorage()

  return { token, userInfo, login, logout, isLoggedIn }
})
