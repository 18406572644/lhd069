import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/lib/api'

interface PointsAccount {
  balance: number
  total_earned: number
  total_spent: number
  level: string
  level_info: { name: string; minPoints: number; icon: string }
  next_level: { name: string; minPoints: number; icon: string } | null
  progress_to_next: number
}

interface PointsRecord {
  id: number
  type: string
  amount: number
  balance_after: number
  source: string
  description: string
  related_id: string
  created_at: string
}

interface CheckInStatus {
  checked_in_today: boolean
  consecutive_days: number
  check_in_dates: string[]
}

export const usePointsStore = defineStore('points', () => {
  const account = ref<PointsAccount | null>(null)
  const records = ref<PointsRecord[]>([])
  const checkInStatus = ref<CheckInStatus | null>(null)
  const loading = ref(false)
  const totalRecords = ref(0)
  const page = ref(1)
  const pageSize = ref(20)
  const totalPages = ref(1)

  const checkedInToday = computed(() => checkInStatus.value?.checked_in_today ?? false)
  const consecutiveDays = computed(() => checkInStatus.value?.consecutive_days ?? 0)

  async function fetchAccount() {
    try {
      const res: any = await api.get('/points/account')
      account.value = res.data
    } catch {
      account.value = null
    }
  }

  async function fetchRecords(type?: string, p: number = 1) {
    loading.value = true
    try {
      const params: any = { page: p, pageSize: pageSize.value }
      if (type && (type === 'earn' || type === 'spend')) {
        params.type = type
      }
      const res: any = await api.get('/points/records', { params })
      records.value = res.data.items
      totalRecords.value = res.data.total
      page.value = res.data.page
      totalPages.value = res.data.totalPages
    } catch {
      records.value = []
    } finally {
      loading.value = false
    }
  }

  async function fetchCheckInStatus() {
    try {
      const res: any = await api.get('/points/check-in/status')
      checkInStatus.value = res.data
    } catch {
      checkInStatus.value = null
    }
  }

  async function checkIn() {
    try {
      const res: any = await api.post('/points/check-in')
      if (checkInStatus.value) {
        checkInStatus.value.checked_in_today = true
        checkInStatus.value.consecutive_days = res.data.consecutive_days
        checkInStatus.value.check_in_dates.unshift(new Date().toISOString().slice(0, 10))
      }
      if (account.value) {
        account.value.balance = res.data.balance
        account.value.level = res.data.level
        account.value.total_earned += res.data.points_earned
      }
      return res.data
    } catch (error: any) {
      throw error
    }
  }

  async function consumePoints(amount: number, source: string, description: string) {
    try {
      const res: any = await api.post('/points/consume', { amount, source, description })
      if (account.value) {
        account.value.balance = res.data.balance
        account.value.level = res.data.level
      }
      return res.data
    } catch (error: any) {
      throw error
    }
  }

  return {
    account,
    records,
    checkInStatus,
    loading,
    totalRecords,
    page,
    pageSize,
    totalPages,
    checkedInToday,
    consecutiveDays,
    fetchAccount,
    fetchRecords,
    fetchCheckInStatus,
    checkIn,
    consumePoints,
  }
})
