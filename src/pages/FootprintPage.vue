<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useBrowseHistoryStore, type BrowseTargetType, type BrowseHistoryItem } from '@/stores/browseHistory'
import { History, Trash2, Package, Palette, Store, Clock, X } from 'lucide-vue-next'
import { ElMessageBox, ElMessage } from 'element-plus'

const router = useRouter()
const store = useBrowseHistoryStore()

const activeType = ref<BrowseTargetType | 'all'>('all')

const typeOptions: { value: BrowseTargetType | 'all'; label: string; icon: any }[] = [
  { value: 'all', label: '全部', icon: History },
  { value: 'material', label: '材料', icon: Package },
  { value: 'work', label: '作品', icon: Palette },
  { value: 'shop', label: '店铺', icon: Store }
]

const groupedByDate = computed(() => {
  const groups: Record<string, BrowseHistoryItem[]> = {}
  for (const item of store.items) {
    const date = item.viewed_at.slice(0, 10)
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(item)
  }
  return groups
})

function formatDate(dateStr: string): string {
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  if (dateStr === today) return '今天'
  if (dateStr === yesterday) return '昨天'
  return dateStr
}

function formatTime(dateStr: string): string {
  return dateStr.slice(11, 16)
}

async function handleTypeChange(type: BrowseTargetType | 'all') {
  activeType.value = type
  await store.fetchBrowseHistory(type === 'all' ? undefined : type, 1)
}

async function handleClearAll() {
  try {
    await ElMessageBox.confirm(
      activeType.value === 'all' ? '确定要清空所有浏览记录吗？' : `确定要清空所有${typeOptions.find(t => t.value === activeType.value)?.label}浏览记录吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await store.clearHistory(activeType.value === 'all' ? undefined : activeType.value)
    ElMessage.success('已清空浏览记录')
  } catch (e: any) {
    if (e !== 'cancel') {
      console.error(e)
    }
  }
}

async function handleDeleteItem(id: number) {
  try {
    await store.deleteRecord(id)
    ElMessage.success('已删除')
  } catch (e) {
    console.error(e)
  }
}

function goToDetail(item: any) {
  router.push(store.getTargetUrl(item))
}

onMounted(() => {
  store.fetchBrowseHistory()
})
</script>

<template>
  <div class="container mx-auto px-4 py-6 max-w-4xl">
    <div class="flex items-center justify-between mb-6">
      <h1 class="font-display text-2xl font-bold text-wood-700 flex items-center gap-2">
        <History class="w-6 h-6" />
        我的足迹
      </h1>
      <button
        v-if="store.total > 0"
        @click="handleClearAll"
        class="wood-btn-outline text-sm flex items-center gap-1 text-red-500 border-red-300 hover:bg-red-50"
      >
        <Trash2 class="w-4 h-4" />
        清空历史
      </button>
    </div>

    <div class="flex items-center gap-2 mb-6 flex-wrap">
      <button
        v-for="opt in typeOptions"
        :key="opt.value"
        @click="handleTypeChange(opt.value)"
        :class="[
          'px-4 py-2 rounded-full text-sm flex items-center gap-1.5 transition-all',
          activeType === opt.value
            ? 'bg-wood-600 text-white shadow-md'
            : 'bg-wood-100 text-wood-600 hover:bg-wood-200'
        ]"
      >
        <component :is="opt.icon" class="w-4 h-4" />
        {{ opt.label }}
      </button>
    </div>

    <div v-if="store.loading" class="text-center py-16 text-wood-500">
      <div class="animate-pulse">加载中...</div>
    </div>

    <div v-else-if="store.items.length === 0" class="text-center py-16">
      <div class="w-20 h-20 mx-auto mb-4 bg-wood-100 rounded-full flex items-center justify-center">
        <History class="w-10 h-10 text-wood-400" />
      </div>
      <p class="text-wood-500 mb-2">暂无浏览记录</p>
      <p class="text-sm text-wood-400">浏览记录将保留 {{ store.retentionDays }} 天</p>
    </div>

    <div v-else class="space-y-6">
      <div v-for="(items, date) in groupedByDate" :key="date" class="space-y-3">
        <div class="flex items-center gap-2 text-sm text-wood-500">
          <Clock class="w-4 h-4" />
          <span class="font-medium">{{ formatDate(date) }}</span>
        </div>

        <div class="fabric-bg rounded-wood-lg border border-wood-300 overflow-hidden wood-shadow">
          <div
            v-for="(item, index) in items"
            :key="item.id"
            :class="[
              'flex items-center gap-4 p-4 cursor-pointer hover:bg-wood-50 transition-colors group',
              index < items.length - 1 ? 'border-b border-wood-200' : ''
            ]"
            @click="goToDetail(item)"
          >
            <div class="w-16 h-16 rounded-wood bg-wood-200 overflow-hidden flex-shrink-0">
              <img
                v-if="item.cover_image"
                :src="item.cover_image"
                :alt="item.title"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <component
                  :is="
                    item.target_type === 'material'
                      ? Package
                      : item.target_type === 'work'
                      ? Palette
                      : Store
                  "
                  class="w-6 h-6 text-wood-400"
                />
              </div>
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span
                  :class="[
                    'text-xs px-2 py-0.5 rounded-full',
                    item.target_type === 'material'
                      ? 'bg-wood-400/15 text-wood-600'
                      : item.target_type === 'work'
                      ? 'bg-purple-100 text-purple-600'
                      : 'bg-matcha-400/20 text-matcha-500'
                  ]"
                >
                  {{ store.getTypeLabel(item.target_type) }}
                </span>
              </div>
              <h3 class="font-medium text-wood-700 truncate">{{ item.title }}</h3>
              <div class="text-xs text-wood-400 mt-1 flex items-center gap-1">
                <Clock class="w-3 h-3" />
                {{ formatTime(item.viewed_at) }}
              </div>
            </div>

            <button
              @click.stop="handleDeleteItem(item.id)"
              class="p-2 rounded-full text-wood-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
              title="删除记录"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div v-if="store.totalPages > 1" class="flex justify-center pt-4">
        <el-pagination
          v-model:current-page="store.page"
          :page-size="store.pageSize"
          :total="store.total"
          layout="prev, pager, next"
          @current-change="(p: number) => store.fetchBrowseHistory(activeType === 'all' ? undefined : activeType, p)"
        />
      </div>
    </div>

    <div class="mt-8 text-center text-xs text-wood-400">
      浏览记录保留 {{ store.retentionDays }} 天，过期自动清除
    </div>
  </div>
</template>
