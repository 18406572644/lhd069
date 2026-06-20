import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/lib/api'

interface MessageExtraData {
  type?: string
  wanted_id?: number
  match_count?: number
  [key: string]: any
}

interface Message {
  id: number
  user_id: number
  type: string
  title: string
  content: string
  is_read: boolean
  related_id: string
  extra_data: MessageExtraData | null
  created_at: string
}

export const useMessagesStore = defineStore('messages', () => {
  const messages = ref<Message[]>([])
  const loading = ref(false)
  const unreadCount = ref(0)

  async function fetchMessages() {
    loading.value = true
    try {
      const res: any = await api.get('/messages')
      const data = res.data
      messages.value = data?.items || []
      unreadCount.value = data?.unreadCount || 0
    } finally {
      loading.value = false
    }
  }

  async function markAsRead(id: number) {
    try {
      await api.put(`/messages/${id}/read`)
      const msg = messages.value.find(m => m.id === id)
      if (msg) {
        msg.is_read = true
      }
      if (unreadCount.value > 0) {
        unreadCount.value--
      }
    } catch (e) {
      console.error('标记已读失败', e)
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
