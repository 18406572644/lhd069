<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Loader2, Hash } from 'lucide-vue-next'
import api from '@/lib/api'

const props = withDefaults(defineProps<{
  limit?: number
}>(), {
  limit: 20
})

interface TagItem {
  id: number
  name: string
  use_count: number
  created_at: string
}

const tags = ref<TagItem[]>([])
const loading = ref(false)

const maxUseCount = computed(() => {
  if (tags.value.length === 0) return 1
  return Math.max(...tags.value.map(t => t.use_count))
})

function getTagSize(useCount: number): string {
  const ratio = useCount / maxUseCount.value
  if (ratio >= 0.8) return 'text-lg font-bold'
  if (ratio >= 0.5) return 'text-base font-semibold'
  if (ratio >= 0.25) return 'text-sm font-medium'
  return 'text-xs'
}

function getTagColor(useCount: number): string {
  const ratio = useCount / maxUseCount.value
  if (ratio >= 0.8) return 'bg-wood-400 text-white hover:bg-wood-500'
  if (ratio >= 0.5) return 'bg-wood-300/50 text-wood-700 hover:bg-wood-300/70'
  if (ratio >= 0.25) return 'bg-wood-200/60 text-wood-600 hover:bg-wood-300/40'
  return 'bg-wood-200/30 text-wood-500 hover:bg-wood-200/50'
}

async function loadTags() {
  loading.value = true
  try {
    const res: any = await api.get('/tags/hot', { params: { limit: props.limit } })
    tags.value = res.data || []
  } catch (e) {
    console.error('Failed to load hot tags:', e)
  } finally {
    loading.value = false
  }
}

onMounted(loadTags)
</script>

<template>
  <div class="tag-cloud">
    <div v-if="loading" class="flex items-center justify-center py-6">
      <Loader2 class="w-5 h-5 animate-spin text-wood-400" />
    </div>

    <div v-else-if="tags.length === 0" class="flex flex-col items-center justify-center py-6">
      <Hash class="w-8 h-8 text-wood-300 mb-2" />
      <p class="text-sm text-wood-400">暂无热门标签</p>
    </div>

    <div v-else class="flex flex-wrap gap-2">
      <router-link
        v-for="tag in tags"
        :key="tag.id"
        :to="`/tag/${encodeURIComponent(tag.name)}`"
        :class="[
          'inline-flex items-center gap-1 px-3 py-1.5 rounded-full transition-all duration-200 no-underline hover:scale-105',
          getTagSize(tag.use_count),
          getTagColor(tag.use_count)
        ]"
        :title="`${tag.name} - 使用 ${tag.use_count} 次`"
      >
        <Hash class="w-3 h-3 opacity-70" />
        {{ tag.name }}
      </router-link>
    </div>
  </div>
</template>
