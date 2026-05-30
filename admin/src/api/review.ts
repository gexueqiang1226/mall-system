import request from '@/utils/request'

export interface ReviewParams {
  page?: number
  size?: number
  productId?: number
  rating?: number
}

export const listReviews = (params: ReviewParams) => {
  return request.get('/admin/api/reviews', { params })
}

export const getReview = (id: number) => {
  return request.get(`/admin/api/reviews/${id}`)
}

export const deleteReview = (id: number) => {
  return request.delete(`/admin/api/reviews/${id}`)
}

export const getStatistics = () => {
  return request.get('/admin/api/reviews/statistics')
}
