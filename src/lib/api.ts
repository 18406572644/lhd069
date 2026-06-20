import axios from 'axios'
import { ElMessage } from 'element-plus'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response
      if (status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
        ElMessage.error('登录已过期，请重新登录')
      } else if (status === 403) {
        ElMessage.error('没有权限执行此操作')
      } else if (status === 404) {
        ElMessage.error('请求的资源不存在')
      } else if (status >= 500) {
        ElMessage.error('服务器错误，请稍后重试')
      } else {
        ElMessage.error(data?.message || '请求失败')
      }
    } else {
      ElMessage.error('网络错误，请检查网络连接')
    }
    return Promise.reject(error)
  }
)

export const postsApi = {
  getCategories: () => api.get('/posts/categories'),
  getBadges: () => api.get('/posts/badges'),
  getReportReasons: () => api.get('/posts/report-reasons'),

  getList: (params?: {
    page?: number
    pageSize?: number
    category?: string
    keyword?: string
    sort?: string
    userId?: number
  }) => api.get('/posts', { params }),

  getHot: (limit?: number) => api.get('/posts/hot', { params: { limit } }),
  getEssence: (limit?: number) => api.get('/posts/essence', { params: { limit } }),
  getExperts: (limit?: number) => api.get('/posts/experts', { params: { limit } }),

  getDetail: (id: number) => api.get(`/posts/${id}`),
  create: (data: {
    title: string
    content: string
    category: string
    images?: { url: string }[]
    tags?: string[]
    relatedMaterialIds?: number[]
    relatedWorkIds?: number[]
  }) => api.post('/posts', data),
  update: (
    id: number,
    data: {
      title?: string
      content?: string
      category?: string
      images?: { url: string }[]
      tags?: string[]
      relatedMaterialIds?: number[]
      relatedWorkIds?: number[]
    }
  ) => api.put(`/posts/${id}`, data),
  delete: (id: number) => api.delete(`/posts/${id}`),

  like: (id: number) => api.post(`/posts/${id}/like`),
  favorite: (id: number) => api.post(`/posts/${id}/favorite`),
  share: (id: number, shareType?: string) => api.post(`/posts/${id}/share`, { share_type: shareType }),

  getComments: (id: number, params?: { page?: number; pageSize?: number }) =>
    api.get(`/posts/${id}/comments`, { params }),
  addComment: (id: number, data: { content: string; parent_id?: number }) =>
    api.post(`/posts/${id}/comments`, data),
  likeComment: (commentId: number) => api.post(`/posts/comments/${commentId}/like`),
  deleteComment: (commentId: number) => api.delete(`/posts/comments/${commentId}`),

  reportPost: (id: number, data: { reason: string; description?: string }) =>
    api.post(`/posts/${id}/report`, data),
  reportComment: (commentId: number, data: { reason: string; description?: string }) =>
    api.post(`/posts/comments/${commentId}/report`, data),

  getFavorites: (params?: { page?: number; pageSize?: number }) =>
    api.get('/posts/user/favorites', { params }),
  getUserBadges: (userId: number) => api.get(`/posts/user/${userId}/badges`),
}

export default api
