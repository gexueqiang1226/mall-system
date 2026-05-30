import request from '@/utils/request'

export interface CouponParams {
  page?: number
  size?: number
  keyword?: string
  status?: number
}

export const listCoupons = (params: CouponParams) => {
  return request.get('/admin/api/coupons', { params })
}

export const getCoupon = (id: number) => {
  return request.get(`/admin/api/coupons/${id}`)
}

export const createCoupon = (data: any) => {
  return request.post('/admin/api/coupons', data)
}

export const updateCoupon = (id: number, data: any) => {
  return request.put(`/admin/api/coupons/${id}`, data)
}

export const deleteCoupon = (id: number) => {
  return request.delete(`/admin/api/coupons/${id}`)
}

export const disableCoupon = (id: number) => {
  return request.post(`/admin/api/coupons/${id}/disable`)
}

export const enableCoupon = (id: number) => {
  return request.post(`/admin/api/coupons/${id}/enable`)
}
