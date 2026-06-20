<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import MaterialCard from '@/components/MaterialCard.vue'
import { ArrowLeft, Hash, Loader2, TrendingUp, Clock } from 'lucide-vue-next'
import api from '@/lib/api'

const route = useRoute()
const tagName = computed(() => decodeURIComponent(route.params.name as string))

const tagInfo = ref<{ id: number; name: string; use_count: number; created_at: string } | null>(null)
const materials = ref<any[]>([])
const loading = ref(false)
const sort = ref<'latest' | 'hot'>('latest')
const pagination = ref({ page: 1, pageSize: 12, total: 0 })

const totalPages = computed(() => Math.ceil(pagination.value.total / pagination.value.pageSize))

async function loadData() {
  loading.value = true
  try {
    const res: any = await api.get(`/tags/${encodeURIComponent(tagName.value)}/materials`, {
      params: {
        page: pagination.value.page,
        pageSize: pagination.value.pageSize,
        sort: sort.value
      }
    })
    if (res.data) {
      tagInfo.value = res.data.tag
      materials.value = (res.data.items || []).map((m: any) => ({
        id: m.id,
        title: m.title,
        price: m.price,
        category: m.category,
        image: m.images?.[0]?.url || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=craft%20material%20wooden%20fabric&image_size=square',
        canSwap: !!m.is_swappable,
        username: m.username || '手作爱好者'
      }))
      pagination.value.total = res.data.total || 0
    }
  } catch (e) {
    console.error('Failed to load tag materials:', e)
  } finally {
    loading.value = false
  }
}

function handlePageChange(page: number) {
  pagination.value.page = page
  loadData()
}

function handleSortChange(val: 'latest' | 'hot') {
  sort.value = val
  pagination.value.page = 1
  loadData()
}

onMounted(loadData)
watch(tagName, () => {
  pagination.value.page = 1
  loadData()
})
</script>

<template>
  <div class="container mx-auto px-4 py-6">
    <div v-if="loading && !tagInfo" class="flex items-center justify-center py-20">
      <Loader2 class="w-8 h-8 animate-spin text-wood-400" />
    </div>

    <template v-else>
      <div class="fabric-bg rounded-wood-lg p-6 wood-shadow border border-wood-300 mb-6">
        <div class="flex items-start justify-between flex-wrap gap-4">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-wood bg-wood-400/20 flex items-center justify-center">
              <Hash class="w-7 h-7 text-wood-600" />
            </div>
            <div>
              <h1 class="font-display text-2xl font-bold text-wood-700 flex items-center gap-2">
                # {{ tagName }}
              </h1>
              <p class="text-sm text-wood-500 mt-1">
                共 {{ pagination.total }} 件材料
                <span v-if="tagInfo?.use_count" class="ml-3">
                  · 标签已被使用 {{ tagInfo.use_count }} 次
                </span>
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              @click="handleSortChange('latest')"
              :class="[
                'flex items-center gap-1.5 px-4 py-2 rounded-wood text-sm transition-colors',
                sort === 'latest' ? 'bg-wood-400 text-white' : 'bg-wood-200 text-wood-600 hover:bg-wood-300'
              ]"
            >
              <Clock class="w-4 h-4" /> 最新
            </button>
            <button
              type="button"
              @click="handleSortChange('hot')"
              :class="[
                'flex items-center gap-1.5 px-4 py-2 rounded-wood text-sm transition-colors',
                sort === 'hot' ? 'bg-wood-400 text-white' : 'bg-wood-200 text-wood-600 hover:bg-wood-300'
              ]"
            >
              <TrendingUp class="w-4 h-4" /> 最热
            </button>
          </div>
        </div>
      </div>

      <div v-if="!loading && materials.length === 0" class="text-center py-16">
        <Hash class="w-12 h-12 text-wood-300 mx-auto mb-3" />
        <p class="text-wood-500 text-lg">该标签下暂无材料</p>
        <p class="text-wood-400 text-sm mt-2">可以在发布材料时使用此标签</p>
      </div>

      <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        <div
          v-for="(item, index) in materials"
          :key="item.id"
          :class="['animate-fade-in-up', `stagger-${(index % 8) + 1}`]"
        >
          <MaterialCard v-bind="item" />
        </div>
      </div>

      <div v-if="totalPages > 1" class="flex justify-center">
        <el-pagination
          :current-page="pagination.page"
          :page-size="pagination.pageSize"
          :total="pagination.total || 0"
          layout="prev, pager, next"
          @current-change="handlePageChange"
          background
        />
      </div>
    </template>
  </div>
</template>
