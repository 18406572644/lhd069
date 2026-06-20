<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/lib/api'
import MaterialCard from '@/components/MaterialCard.vue'
import { ArrowLeft, Sparkles } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const wantedId = parseInt(route.params.id as string)

const loading = ref(false)
const matchedMaterials = ref<any[]>([])
const wantedInfo = ref<any>(null)

const displayMaterials = computed(() => {
  return matchedMaterials.value.map((m: any) => ({
    id: m.id,
    title: m.title,
    price: m.price,
    category: m.category,
    image: m.images?.[0]?.url || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=craft%20material%20wooden%20fabric&image_size=square',
    canSwap: !!m.is_swappable,
    username: m.username || '手作爱好者'
  }))
})

async function fetchMatchResults() {
  loading.value = true
  try {
    const res: any = await api.get(`/wanted/${wantedId}/matches`)
    if (res.success) {
      matchedMaterials.value = res.data?.items || []
    }
  } catch (e) {
    console.error('获取匹配结果失败', e)
  } finally {
    loading.value = false
  }
}

async function fetchWantedInfo() {
  try {
    const res: any = await api.get(`/wanted/${wantedId}`)
    if (res.success) {
      wantedInfo.value = res.data
    }
  } catch (e) {
    console.error('获取求购信息失败', e)
  }
}

onMounted(() => {
  fetchMatchResults()
  fetchWantedInfo()
})

function goBack() {
  router.back()
}
</script>

<template>
  <div class="container mx-auto px-4 py-6">
    <div class="flex items-center gap-3 mb-6">
      <button
        @click="goBack"
        class="flex items-center gap-1 text-sm text-wood-500 hover:text-wood-700 transition-colors"
      >
        <ArrowLeft class="w-4 h-4" />
        返回
      </button>
    </div>

    <div class="fabric-bg rounded-wood-lg p-6 wood-shadow border border-wood-300 mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="w-12 h-12 rounded-full bg-matcha-400/20 flex items-center justify-center">
          <Sparkles class="w-6 h-6 text-matcha-500" />
        </div>
        <div>
          <h1 class="font-display text-xl font-bold text-wood-700">智能匹配结果</h1>
          <p class="text-sm text-wood-500">
            为您的求购"{{ wantedInfo?.title || '...' }}"匹配到
            <span class="font-bold text-matcha-500">{{ matchedMaterials.length }}</span>
            个相关材料
          </p>
        </div>
      </div>
      <p class="text-sm text-wood-500">
        匹配维度：材料分类 · 关键词匹配 · 预算范围 · 按相关度排序
      </p>
    </div>

    <div v-if="loading" class="text-center py-16">
      <p class="text-wood-500">加载中...</p>
    </div>

    <div v-else-if="matchedMaterials.length === 0" class="text-center py-16">
      <p class="text-wood-500 text-lg">暂无匹配的材料</p>
      <p class="text-wood-400 text-sm mt-2">试试调整求购条件，或稍后再来查看</p>
    </div>

    <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <div
        v-for="(item, index) in displayMaterials"
        :key="item.id"
        :class="['animate-fade-in-up', `stagger-${(index % 8) + 1}`]"
      >
        <MaterialCard v-bind="item" />
      </div>
    </div>
  </div>
</template>
