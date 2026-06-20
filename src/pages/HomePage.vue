<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import CategoryNav from '@/components/CategoryNav.vue'
import MaterialCard from '@/components/MaterialCard.vue'
import WorkCard from '@/components/WorkCard.vue'
import TagCloud from '@/components/TagCloud.vue'
import { ArrowRight, Search, Hash } from 'lucide-vue-next'
import api from '@/lib/api'

const router = useRouter()
const activeCategory = ref('')

const heroImage = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=rustic%20wooden%20craft%20workshop%20warm%20lighting%20natural%20materials&image_size=landscape_16_9'

const featuredMaterials = ref<any[]>([])
const wantedItems = ref<any[]>([])
const featuredWorks = ref<any[]>([])

const visible = ref(false)

async function loadData() {
  try {
    const [materialsRes, wantedRes, worksRes] = await Promise.all([
      api.get('/materials', { params: { page: 1, pageSize: 8 } }),
      api.get('/wanted', { params: { page: 1, pageSize: 6 } }),
      api.get('/works', { params: { page: 1, pageSize: 8 } })
    ])
    
    const mats = (materialsRes as any).data?.items || (materialsRes as any).data?.list || (materialsRes as any).data || []
    featuredMaterials.value = mats.map((m: any) => ({
      id: m.id,
      title: m.title,
      price: m.price,
      category: m.category,
      image: m.images?.[0]?.url || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=craft%20material%20wooden%20fabric&image_size=square',
      canSwap: !!m.is_swappable,
      username: m.publisher?.username || m.username || '手作爱好者'
    })).slice(0, 4)

    const wanted = (wantedRes as any).data?.items || (wantedRes as any).data?.list || (wantedRes as any).data || []
    wantedItems.value = wanted.map((w: any) => ({
      id: w.id,
      title: w.title,
      category: w.category,
      budget: `${w.budget_min || 0}-${w.budget_max || 0}元`,
      status: w.status
    })).slice(0, 3)

    const works = (worksRes as any).data?.items || (worksRes as any).data?.list || (worksRes as any).data || []
    featuredWorks.value = works.map((w: any) => ({
      id: w.id,
      title: w.title,
      image: w.images?.[0]?.url || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=handmade%20craft%20artwork&image_size=portrait_4_3',
      author: w.author?.username || w.username || '手作艺术家',
      tags: w.tags?.split(',').filter(Boolean) || []
    })).slice(0, 5)
  } catch (e) {
    console.error('Failed to load data:', e)
  }
}

onMounted(() => {
  visible.value = true
  loadData()
})
</script>

<template>
  <div>
    <section class="relative overflow-hidden" style="min-height: 480px;">
      <div class="absolute inset-0 bg-cover bg-center" :style="{ backgroundImage: `url(${heroImage})` }"></div>
      <div class="absolute inset-0 bg-gradient-to-r from-wood-800/70 to-wood-700/40"></div>
      <div class="relative container mx-auto px-4 py-24 flex flex-col items-start justify-center" style="min-height: 480px;">
        <h1 class="font-display text-4xl md:text-5xl font-black text-white mb-4 animate-fade-in-up">
          原木集市
        </h1>
        <p class="text-xl md:text-2xl text-wood-200 mb-2 animate-fade-in-up stagger-1">
          让材料遇见新灵感
        </p>
        <p class="text-base text-wood-300 mb-8 max-w-lg animate-fade-in-up stagger-2">
          在这里，闲置的手工材料找到新主人，创意的灵感碰撞出火花。交换、交易、分享，让每一份材料都不被辜负。
        </p>
        <div class="flex gap-4 animate-fade-in-up stagger-3">
          <button @click="router.push('/market')" class="wood-btn text-base !px-8 !py-3">
            探索材料
          </button>
          <button @click="router.push('/market/publish')" class="wood-btn-outline text-base !px-8 !py-3 !border-white !text-white hover:!bg-white hover:!text-wood-700">
            发布闲置
          </button>
        </div>
      </div>
    </section>

    <section class="container mx-auto px-4 py-12">
      <div class="fabric-bg rounded-wood-xl p-6 wood-shadow">
        <h2 class="font-display text-xl font-bold text-wood-700 mb-4">材料分类</h2>
        <CategoryNav v-model="activeCategory" />
      </div>
    </section>

    <section class="container mx-auto px-4 py-8">
      <div class="fabric-bg rounded-wood-xl p-6 wood-shadow border border-wood-300">
        <div class="flex items-center gap-2 mb-4">
          <Hash class="w-5 h-5 text-wood-500" />
          <h2 class="font-display text-xl font-bold text-wood-700">热门标签</h2>
        </div>
        <TagCloud :limit="20" />
      </div>
    </section>

    <section class="container mx-auto px-4 py-8">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
          <div class="rope-border-bottom pb-2">
            <h2 class="font-display text-2xl font-bold text-wood-700">精选材料</h2>
          </div>
        </div>
        <button @click="router.push('/market')" class="flex items-center gap-1 text-sm text-wood-600 hover:text-wood-400 transition-colors">
          查看更多 <ArrowRight class="w-4 h-4" />
        </button>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          v-for="(item, index) in featuredMaterials"
          :key="item.id"
          :class="['animate-fade-in-up', `stagger-${index + 1}`]"
        >
          <MaterialCard v-bind="item" />
        </div>
      </div>
    </section>

    <section class="container mx-auto px-4 py-8">
      <div class="flex items-center justify-between mb-6">
        <div class="rope-border-bottom pb-2">
          <h2 class="font-display text-2xl font-bold text-wood-700">最新求购</h2>
        </div>
        <button @click="router.push('/wanted')" class="flex items-center gap-1 text-sm text-wood-600 hover:text-wood-400 transition-colors">
          查看更多 <ArrowRight class="w-4 h-4" />
        </button>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <router-link
          v-for="(item, index) in wantedItems"
          :key="item.id"
          :to="`/wanted/${item.id}`"
          :class="['fabric-bg rounded-wood-lg p-4 border border-wood-300 wood-shadow-hover no-underline animate-fade-in-up', `stagger-${index + 1}`]"
        >
          <div class="flex items-start justify-between mb-2">
            <h3 class="font-display text-base font-bold text-wood-700">{{ item.title }}</h3>
            <span class="text-xs bg-wood-400/15 text-wood-600 px-2 py-0.5 rounded-full flex-shrink-0 ml-2">{{ item.category }}</span>
          </div>
          <p class="text-sm text-wood-400 font-medium">预算: {{ item.budget }}</p>
        </router-link>
      </div>
    </section>

    <section class="container mx-auto px-4 py-8 pb-16">
      <div class="flex items-center justify-between mb-6">
        <div class="rope-border-bottom pb-2">
          <h2 class="font-display text-2xl font-bold text-wood-700">手工作品</h2>
        </div>
        <button @click="router.push('/works')" class="flex items-center gap-1 text-sm text-wood-600 hover:text-wood-400 transition-colors">
          查看更多 <ArrowRight class="w-4 h-4" />
        </button>
      </div>
      <div class="columns-2 md:columns-3 lg:columns-4 gap-4">
        <div
          v-for="(item, index) in featuredWorks"
          :key="item.id"
          :class="['animate-fade-in-up', `stagger-${(index % 8) + 1}`]"
        >
          <WorkCard v-bind="item" />
        </div>
      </div>
    </section>
  </div>
</template>
