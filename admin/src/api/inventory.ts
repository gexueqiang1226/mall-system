import axios from 'axios'

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

export const updateInventory = (id: number, data: any) => {
  return axios.put(`${BASE}/admin/api/products/${id}/inventory`, data)
}

export const getInventoryLogs = (productId: number, page = 1, size = 20) => {
  return axios.get(`${BASE}/admin/api/inventory-logs`, { params: { productId, page, size } })
}
