import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/lib/api'

interface Tag {
  id: number
  name: string
  use_count?: number
  created_at?: string
}

interface Material {
  id: number
  title: string
  description: string
  category: string
  price: number
  images: string[]
  is_swappable?: number | boolean
  can_swap: boolean
  specs: { key: string; value: string }[]
  tags: Tag[]
  user_id: number
  username: string
  avatar?: string
  status: string
  created_at: string
  is_active?: number | boolean
  is_pinned?: boolean
  view_count?: number
  user?: {
    id: number
    username: string
    avatar?: string
    credit_score?: number
  }
}

interface Pagination {
  page: number
  pageSize: number
  total: number
}

interface Filters {
  category?: string
  keyword?: string
  minPrice?: number
  maxPrice?: number
  canSwap?: boolean
  sort?: string
}

export const useMaterialsStore = defineStore('materials', () => {
  const materials = ref<Material[]>([])
  const currentMaterial = ref<Material | null>(null)
  const pagination = ref<Pagination>({ page: 1, pageSize: 12, total: 0 })
  const filters = ref<Filters>({})
  const loading = ref(false)

  const totalPages = computed(() => Math.ceil(pagination.value.total / pagination.value.pageSize))

  async function fetchMaterials() {
    loading.value = true
    try {
      const params: Record<string, any> = {
        page: pagination.value.page,
        pageSize: pagination.value.pageSize,
        ...filters.value,
      }
      const res: any = await api.get('/materials', { params })
      const items = res.data?.items || res.data?.list || res.data || []
      materials.value = items.map((m: any) => ({
        ...m,
        is_swappable: !!m.is_swappable,
        can_swap: !!m.is_swappable,
        is_active: !!m.is_active,
        is_pinned: !!m.is_pinned,
        images: Array.isArray(m.images) ? m.images.map((img: any) => img.url || img) : [],
        tags: Array.isArray(m.tags) ? m.tags : [],
        user: {
          id: m.user_id,
          username: m.username,
          avatar: m.avatar,
          credit_score: m.credit_score
        }
      }))
      pagination.value.total = res.data?.total || 0
    } finally {
      loading.value = false
    }
  }

  async function fetchMaterial(id: number) {
    loading.value = true
    try {
      const res: any = await api.get(`/materials/${id}`)
      const m = res.data
      if (m) {
        currentMaterial.value = {
          ...m,
          is_swappable: !!m.is_swappable,
          can_swap: !!m.is_swappable,
          is_active: !!m.is_active,
          is_pinned: !!m.is_pinned,
          images: Array.isArray(m.images) ? m.images.map((img: any) => img.url || img) : [],
          tags: Array.isArray(m.tags) ? m.tags : [],
          user: {
            id: m.user_id,
            username: m.username,
            avatar: m.avatar,
            credit_score: m.credit_score
          }
        }
      } else {
        currentMaterial.value = null
      }
    } finally {
      loading.value = false
    }
  }

  async function createMaterial(data: Partial<Material>) {
    const res: any = await api.post('/materials', data)
    return res.data
  }

  async function updateMaterial(id: number, data: Partial<Material>) {
    const res: any = await api.put(`/materials/${id}`, data)
    return res.data
  }

  async function deleteMaterial(id: number) {
    await api.delete(`/materials/${id}`)
  }

  async function pinMaterial(id: number, pinned: boolean) {
    const res: any = await api.put(`/materials/${id}/pin`, { pinned })
    return res.data
  }

  function setFilters(newFilters: Filters) {
    filters.value = { ...filters.value, ...newFilters }
    pagination.value.page = 1
  }

  function setPage(page: number) {
    pagination.value.page = page
  }

  return {
    materials,
    currentMaterial,
    pagination,
    filters,
    loading,
    totalPages,
    fetchMaterials,
    fetchMaterial,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    pinMaterial,
    setFilters,
    setPage,
  }
})
