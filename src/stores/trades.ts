import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/lib/api'

interface Trade {
  id: number
  material_id: number
  material_title?: string
  responder_id: number
  requester_id: number
  requester_name?: string
  responder_name?: string
  from_user_id?: number
  from_username?: string
  to_user_id?: number
  to_username?: string
  offer_material_id?: number
  offer_material_title?: string
  type: 'buy' | 'swap'
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled'
  price?: number
  message?: string
  created_at: string
  updated_at: string
}

interface TradePagination {
  page: number
  pageSize: number
  total: number
}

export const useTradesStore = defineStore('trades', () => {
  const trades = ref<Trade[]>([])
  const currentTrade = ref<Trade | null>(null)
  const pagination = ref<TradePagination>({ page: 1, pageSize: 10, total: 0 })
  const loading = ref(false)

  async function fetchTrades() {
    loading.value = true
    try {
      const params = {
        page: pagination.value.page,
        pageSize: pagination.value.pageSize,
      }
      const res: any = await api.get('/trades', { params })
      trades.value = res.data?.items || res.data?.list || res.data || []
      pagination.value.total = res.data?.total || 0
    } finally {
      loading.value = false
    }
  }

  async function createTrade(data: Partial<Trade>) {
    const res: any = await api.post('/trades', data)
    return res.data
  }

  async function updateTradeStatus(id: number, status: Trade['status']) {
    const res: any = await api.put(`/trades/${id}/status`, { status })
    return res.data
  }

  async function reviewTrade(id: number, rating: number, comment: string) {
    const res: any = await api.post(`/trades/${id}/review`, { rating, comment })
    return res.data
  }

  return {
    trades,
    currentTrade,
    pagination,
    loading,
    fetchTrades,
    createTrade,
    updateTradeStatus,
    reviewTrade,
  }
})
