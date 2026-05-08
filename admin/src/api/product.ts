import axios from 'axios'

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

export interface ProductParams {
  page?: number
  size?: number
  isOnline?: number
  categoryId?: number
  keyword?: string
  sortBy?: string
  order?: string
}

export const listProducts = (params: ProductParams) => {
  return axios.get(`${BASE}/admin/api/products`, { params })
}

export const getProduct = (id: number) => {
  return axios.get(`${BASE}/admin/api/products/${id}`)
}

export const createProduct = (data: any) => {
  return axios.post(`${BASE}/admin/api/products`, data)
}

export const updateProduct = (id: number, data: any) => {
  return axios.put(`${BASE}/admin/api/products/${id}`, data)
}

export const onlineProduct = (id: number) => {
  return axios.post(`${BASE}/admin/api/products/${id}/online`)
}

export const offlineProduct = (id: number) => {
  return axios.post(`${BASE}/admin/api/products/${id}/offline`)
}
