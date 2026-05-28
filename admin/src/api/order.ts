import request from '@/utils/request'

export const listOrders = (params: any) => {
  return request.get('/admin/api/orders', { params })
}

export const getOrder = (id: number) => {
  return request.get(`/admin/api/orders/${id}`)
}

export const shipOrder = (id: number) => {
  return request.put(`/admin/api/orders/${id}/ship`)
}

export const refundOrder = (id: number) => {
  return request.put(`/admin/api/orders/${id}/refund`)
}
