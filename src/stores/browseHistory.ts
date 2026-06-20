import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/lib/api'

export type BrowseTargetType = 'material' | 'work' | 'shop'

export interface BrowseHistoryItem {
  id: number
  user_id: number
  target_type: BrowseTargetType
  target_id: number
  title: string
  cover_image: string
  extra_data: Record<string, any> | null
  viewed_at: string
}

export const useBrowseHistoryStore = defineStore('browseHistory', () => {
  const items = ref<BrowseHistoryItem[]>([])
  const loading = ref(false)
  const total = ref(0)
  const page = ref(1)
  const pageSize = ref(20)
  const totalPages = ref(0)
  const retentionDays = ref(30)

  async function addBrowseRecord(
    targetType: BrowseTargetType,
    targetId: number,
    title: string,
    coverImage: string = '',
    extraData?: Record<string, any>
  ) {
    try {
      await api.post('/browse-history', {
        target_type: targetType,
        target_id: targetId,
        title,
        cover_image: coverImage,
        extra_data: extraData
      })
    } catch (e) {
      console.error('记录浏览历史失败', e)
    }
  }

  async function fetchBrowseHistory(targetType?: BrowseTargetType, pageNum: number = 1) {
    loading.value = true
    try {
      const params: Record<string, any> = {
        page: pageNum,
        pageSize: pageSize.value
      }
      if (targetType) {
        params.target_type = targetType
      }
      const res: any = await api.get('/browse-history', { params })
      const data = res.data
      items.value = data?.items || []
      total.value = data?.total || 0
      page.value = data?.page || 1
      totalPages.value = data?.totalPages || 0
      retentionDays.value = data?.retention_days || 30
    } finally {
      loading.value = false
    }
  }

  async function deleteRecord(id: number) {
    try {
      await api.delete(`/browse-history/${id}`)
      items.value = items.value.filter(item => item.id !== id)
      total.value--
    } catch (e) {
      console.error('删除浏览记录失败', e)
      throw e
    }
  }

  async function clearHistory(targetType?: BrowseTargetType) {
    try {
      await api.delete('/browse-history', {
        data: targetType ? { target_type: targetType } : {}
      })
      items.value = []
      total.value = 0
    } catch (e) {
      console.error('清空浏览历史失败', e)
      throw e
    }
  }

  function getTargetUrl(item: BrowseHistoryItem): string {
    switch (item.target_type) {
      case 'material':
        return `/market/${item.target_id}`
      case 'work':
        return `/works/${item.target_id}`
      case 'shop':
        return `/shop/${item.target_id}`
      default:
        return '/'
    }
  }

  function getTypeLabel(type: BrowseTargetType): string {
    switch (type) {
      case 'material':
        return '材料'
      case 'work':
        return '作品'
      case 'shop':
        return '店铺'
      default:
        return ''
    }
  }

  return {
    items,
    loading,
    total,
    page,
    pageSize,
    totalPages,
    retentionDays,
    addBrowseRecord,
    fetchBrowseHistory,
    deleteRecord,
    clearHistory,
    getTargetUrl,
    getTypeLabel
  }
})
