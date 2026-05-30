import request from '@/utils/request'

export interface UserParams {
  page?: number
  size?: number
  keyword?: string
}

export const listUsers = (params: UserParams) => {
  return request.get('/admin/api/users', { params })
}

export const getUser = (id: number) => {
  return request.get(`/admin/api/users/${id}`)
}

export const updateUser = (id: number, data: any) => {
  return request.put(`/admin/api/users/${id}`, data)
}
