import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/lib/api'

interface Material {
  id: number
  title: string
  description: string
  category: string
  price: number
  images: string[]
  can_swap: boolean
  specs: Record<string, string>[]
  user_id: number
  username: string
  avatar?: string
  status: string
  created_at: string
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
      materials.value = items.map((m: any) => ({ ...m, is_swappable: !!m.is_swappable, is_active: !!m.is_active }))
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
      currentMaterial.value = m ? { ...m, is_swappable: !!m.is_swappable, is_active: !!m.is_active } : null
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
    setFilters,
    setPage,
  }
})
