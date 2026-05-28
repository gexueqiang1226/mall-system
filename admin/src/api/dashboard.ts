import request from '@/utils/request'

export const getDashboardStats = () => {
  return request.get('/admin/api/dashboard/stats')
}
