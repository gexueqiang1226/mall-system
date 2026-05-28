import request from '@/utils/request'

export const listCategories = (params?: any) => {
  return request.get('/admin/api/categories', { params })
}

export const getCategory = (id: number) => {
  return request.get(`/admin/api/categories/${id}`)
}

export const createCategory = (data: any) => {
  return request.post('/admin/api/categories', data)
}

export const updateCategory = (id: number, data: any) => {
  return request.put(`/admin/api/categories/${id}`, data)
}

export const deleteCategory = (id: number) => {
  return request.delete(`/admin/api/categories/${id}`)
}
