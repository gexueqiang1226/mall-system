import request from '@/utils/request'

export const updateInventory = (id: number, data: any) => {
  return request.put(`/admin/api/products/${id}/inventory`, data)
}

export const getInventoryLogs = (productId?: number, page = 1, size = 20) => {
  return request.get('/admin/api/inventory-logs', { params: { productId, page, size } })
}
