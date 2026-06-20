import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/lib/api'

interface Message {
  id: number
  from_user_id: number
  from_username: string
  from_avatar?: string
  to_user_id: number
  content: string
  trade_id?: number
  is_read: boolean
  created_at: string
}

export const useMessagesStore = defineStore('messages', () => {
  const messages = ref<Message[]>([])
  const loading = ref(false)

  const unreadCount = computed(() => messages.value.filter(m => !m.is_read).length)

  async function fetchMessages() {
    loading.value = true
    try {
      const res: any = await api.get('/messages')
      const data = res.data?.list || res.data || []
      messages.value = Array.isArray(data) ? data : []
    } finally {
      loading.value = false
    }
  }

  async function markAsRead(id: number) {
    await api.put(`/messages/${id}/read`)
    const msg = messages.value.find(m => m.id === id)
    if (msg) {
      msg.is_read = true
    }
  }

  return {
    messages,
    loading,
    unreadCount,
    fetchMessages,
    markAsRead,
  }
})
