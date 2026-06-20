<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useBrowseHistoryStore } from '@/stores/browseHistory'
import MaterialCard from '@/components/MaterialCard.vue'
import { User, Star, Eye, ArrowRightLeft, Loader2 } from 'lucide-vue-next'
import api from '@/lib/api'

const route = useRoute()
const auth = useAuthStore()
const browseHistoryStore = useBrowseHistoryStore()

const shop = ref<any>(null)
const materials = ref<any[]>([])
const loading = ref(false)

const shopId = computed(() => parseInt(route.params.id as string))

async function fetchShop() {
  loading.value = true
  try {
    const res: any = await api.get(`/shops/${shopId.value}`)
    const data = res.data
    if (data) {
      shop.value = {
        id: data.id,
        user_id: data.user_id,
        username: data.username,
        avatar: data.avatar,
        description: data.description,
        credit_score: data.credit_score,
        cover: data.cover_image,
        name: data.name,
        view_count: data.stats?.totalViews || 0,
        swap_rate: data.stats?.completedTrades || 0,
        stats: data.stats
      }
      materials.value = (data.materials || []).map((m: any) => ({
        ...m,
        image: m.images?.[0]?.url || m.images?.[0] || '',
        canSwap: !!m.is_swappable,
        username: data.username
      }))

      if (auth.isLoggedIn) {
        browseHistoryStore.addBrowseRecord(
          'shop',
          shop.value.id,
          shop.value.name || shop.value.username + '的店铺',
          shop.value.cover || '',
          {
            owner: shop.value.username,
            materialCount: shop.value.stats?.materialCount || 0
          }
        )
      }
    }
  } catch (e) {
    console.error('获取店铺详情失败', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (shopId.value) {
    fetchShop()
  }
})
</script>

<template>
  <div>
    <div v-if="loading" class="flex items-center justify-center py-20">
      <Loader2 class="w-8 h-8 animate-spin text-wood-400" />
    </div>

    <template v-else-if="shop">
      <div class="relative h-48 md:h-64 overflow-hidden">
        <img v-if="shop.cover" :src="shop.cover" class="w-full h-full object-cover" alt="" />
        <div v-else class="w-full h-full bg-wood-300"></div>
        <div class="absolute inset-0 bg-gradient-to-t from-wood-800/60 to-transparent"></div>
      </div>

      <div class="container mx-auto px-4 -mt-16 relative z-10">
        <div class="fabric-bg rounded-wood-lg p-6 wood-shadow border border-wood-300 mb-6">
          <div class="flex items-center gap-4">
            <div class="w-20 h-20 rounded-full bg-wood-400 flex items-center justify-center overflow-hidden border-4 border-wood-100 shadow-wood-lg">
              <img v-if="shop.avatar" :src="shop.avatar" class="w-full h-full object-cover" alt="" />
              <User v-else class="w-10 h-10 text-white" />
            </div>
            <div class="flex-1">
              <h1 class="font-display text-2xl font-bold text-wood-700">{{ shop.name || shop.username + '的手工铺' }}</h1>
              <div class="flex items-center gap-4 mt-1">
                <div class="flex items-center gap-1 text-sm text-wood-500">
                  <Star class="w-4 h-4 fill-wood-400 text-wood-400" />
                  <span>{{ shop.credit_score }} 信用</span>
                </div>
                <div class="flex items-center gap-1 text-sm text-wood-500">
                  <Eye class="w-4 h-4" />
                  <span>{{ shop.view_count }} 浏览</span>
                </div>
                <div class="flex items-center gap-1 text-sm text-wood-500">
                  <ArrowRightLeft class="w-4 h-4" />
                  <span>{{ shop.stats?.completedTrades || 0 }} 成交</span>
                </div>
              </div>
            </div>
          </div>
          <p class="text-sm text-wood-600 mt-4">{{ shop.description }}</p>
        </div>

        <div class="mb-12">
          <h2 class="font-display text-xl font-bold text-wood-700 mb-4 rope-border-bottom pb-2">在售材料</h2>
          <div v-if="materials.length > 0" class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div
              v-for="(item, index) in materials"
              :key="item.id"
              :class="['animate-fade-in-up', `stagger-${index + 1}`]"
            >
              <MaterialCard v-bind="item" />
            </div>
          </div>
          <div v-else class="text-center py-12 text-wood-500">
            暂无在售材料
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
