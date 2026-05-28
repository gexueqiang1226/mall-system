import Taro from '@tarojs/taro'

const API_BASE_URL = 'http://localhost:8080/api'

interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers?: Record<string, string>
  data?: any
}

class Api {
  private baseUrl: string = API_BASE_URL

  request = async (url: string, config: RequestConfig = {}) => {
    const { method = 'GET', headers = {}, data } = config

    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    }

    // 获取token
    const token = Taro.getStorageSync('TOKEN')
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`
    }

    try {
      const response = await Taro.request({
        url: `${this.baseUrl}${url}`,
        method: method as any,
        header: defaultHeaders,
        data,
      })

      if (response.statusCode === 200) {
        return response.data
      } else if (response.statusCode === 401) {
        // 未授权，清除token并跳转登录
        Taro.removeStorageSync('TOKEN')
        Taro.removeStorageSync('USER_INFO')
        Taro.navigateTo({
          url: '/pages/user/index',
        })
        throw new Error('未授权')
      } else {
        throw new Error(response.data?.message || '请求失败')
      }
    } catch (error) {
      console.error('API Error:', error)
      throw error
    }
  }

  get = (url: string, params?: Record<string, any>) => {
    let queryUrl = url
    if (params) {
      const queryString = Object.entries(params)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&')
      queryUrl = `${url}?${queryString}`
    }
    return this.request(queryUrl, { method: 'GET' })
  }

  post = (url: string, data?: any) => {
    return this.request(url, { method: 'POST', data })
  }

  put = (url: string, data?: any) => {
    return this.request(url, { method: 'PUT', data })
  }

  delete = (url: string, data?: any) => {
    return this.request(url, { method: 'DELETE', data })
  }
}

const api = new Api()

export default api
