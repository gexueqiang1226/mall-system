import request from '@/utils/request'

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
  return request.get('/admin/api/products', { params })
}

export const getProduct = (id: number) => {
  return request.get(`/admin/api/products/${id}`)
}

export const createProduct = (data: any) => {
  return request.post('/admin/api/products', data)
}

export const updateProduct = (id: number, data: any) => {
  return request.put(`/admin/api/products/${id}`, data)
}

export const onlineProduct = (id: number) => {
  return request.post(`/admin/api/products/${id}/online`)
}

export const offlineProduct = (id: number) => {
  return request.post(`/admin/api/products/${id}/offline`)
}
