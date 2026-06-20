<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useMaterialsStore } from '@/stores/materials'
import { useTradesStore } from '@/stores/trades'
import { useBrowseHistoryStore } from '@/stores/browseHistory'
import ImageGallery from '@/components/ImageGallery.vue'
import SpecTable from '@/components/SpecTable.vue'
import { ArrowRightLeft, ShoppingCart, User, Star, Loader2, Pin } from 'lucide-vue-next'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const materialsStore = useMaterialsStore()
const tradesStore = useTradesStore()
const browseHistoryStore = useBrowseHistoryStore()
const tradeDialogVisible = ref(false)
const tradeType = ref<'buy' | 'swap'>('buy')
const tradeMessage = ref('')

const materialId = computed(() => parseInt(route.params.id as string))
const material = computed(() => materialsStore.currentMaterial)
const loading = computed(() => materialsStore.loading)

async function handleTrade() {
  if (!auth.isLoggedIn) {
    router.push('/login')
    return
  }
  if (!material.value) {
    ElMessage.error('材料信息加载失败')
    return
  }
  try {
    await tradesStore.createTrade({
      responder_id: material.value.user_id,
      material_id: material.value.id,
      type: tradeType.value,
      price: tradeType.value === 'buy' ? material.value.price : undefined,
      message: tradeMessage.value,
    } as any)
    ElMessage.success(tradeType.value === 'buy' ? '购买请求已发送' : '互换请求已发送')
    tradeDialogVisible.value = false
    tradeMessage.value = ''
  } catch {
    ElMessage.error('操作失败，请稍后重试')
  }
}

watch(
  () => material.value,
  (m) => {
    if (m && auth.isLoggedIn) {
      browseHistoryStore.addBrowseRecord(
        'material',
        m.id,
        m.title,
        m.images?.[0] || '',
        {
          price: m.price,
          category: m.category,
          username: m.user?.username
        }
      )
    }
  }
)

onMounted(() => {
  if (materialId.value) {
    materialsStore.fetchMaterial(materialId.value)
  }
})
</script>

<template>
  <div class="container mx-auto px-4 py-6">
    <div v-if="loading" class="flex items-center justify-center py-20">
      <Loader2 class="w-8 h-8 animate-spin text-wood-400" />
    </div>

    <div v-else-if="!material" class="text-center py-20">
      <p class="text-wood-500 mb-4">材料不存在或已下架</p>
      <button @click="router.push('/market')" type="button" class="wood-btn">返回材料市场</button>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div>
        <ImageGallery :images="material.images" />
      </div>

      <div>
        <div class="fabric-bg rounded-wood-lg p-6 wood-shadow border border-wood-300">
          <div class="flex items-center gap-2 mb-3 flex-wrap">
            <span class="text-xs bg-wood-400/15 text-wood-600 px-3 py-1 rounded-full">{{ material.category }}</span>
            <span v-if="material.can_swap" class="text-xs bg-matcha-400/20 text-matcha-500 px-3 py-1 rounded-full flex items-center gap-1">
              <ArrowRightLeft class="w-3 h-3" /> 可互换
            </span>
            <span v-if="material.is_pinned" class="text-xs bg-amber-500 text-white px-3 py-1 rounded-full flex items-center gap-1">
              <Pin class="w-3 h-3" /> 置顶
            </span>
          </div>

          <h1 class="font-display text-2xl font-bold text-wood-700 mb-3">{{ material.title }}</h1>

          <div class="text-3xl font-bold text-wood-400 mb-4">¥{{ material.price }}</div>

          <p class="text-sm text-wood-600 leading-relaxed mb-4">{{ material.description }}</p>

          <div v-if="material.tags && material.tags.length > 0" class="mb-5">
            <div class="flex flex-wrap gap-2">
              <router-link
                v-for="tag in material.tags"
                :key="tag.id"
                :to="`/tag/${encodeURIComponent(tag.name)}`"
                class="inline-flex items-center px-3 py-1 text-xs bg-wood-400/15 text-wood-600 rounded-full hover:bg-wood-400/25 transition-colors no-underline"
              >
                # {{ tag.name }}
              </router-link>
            </div>
          </div>

          <SpecTable :specs="material.specs" />

          <div class="flex gap-3 mt-6">
            <button
              type="button"
              @click="tradeType = 'buy'; tradeDialogVisible = true"
              class="wood-btn flex-1 flex items-center justify-center gap-2"
            >
              <ShoppingCart class="w-4 h-4" /> 购买
            </button>
            <button
              v-if="material.can_swap"
              type="button"
              @click="tradeType = 'swap'; tradeDialogVisible = true"
              class="wood-btn-outline flex-1 flex items-center justify-center gap-2"
            >
              <ArrowRightLeft class="w-4 h-4" /> 互换
            </button>
          </div>
        </div>

        <div class="fabric-bg rounded-wood-lg p-4 mt-4 wood-shadow border border-wood-300">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-full bg-wood-400 flex items-center justify-center overflow-hidden">
              <img v-if="material.user?.avatar" :src="material.user.avatar" class="w-full h-full object-cover" alt="" />
              <User v-else class="w-6 h-6 text-white" />
            </div>
            <div class="flex-1">
              <div class="font-medium text-wood-700">{{ material.user?.username }}</div>
              <div class="flex items-center gap-1 text-sm text-wood-500">
                <Star class="w-3 h-3 fill-wood-400 text-wood-400" />
                <span>{{ material.user?.credit_score }}</span>
              </div>
            </div>
            <router-link
              :to="`/shop/${material.user?.id}`"
              class="text-sm text-wood-600 hover:text-wood-400 transition-colors no-underline flex items-center gap-1"
            >
              查看店铺 →
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="tradeDialogVisible" :title="tradeType === 'buy' ? '购买材料' : '互换材料'" width="460px">
      <div class="space-y-4">
        <div>
          <label class="text-sm text-wood-600 block mb-1">材料</label>
          <div class="text-wood-700 font-medium">{{ material?.title }}</div>
        </div>
        <div v-if="tradeType === 'buy'">
          <label class="text-sm text-wood-600 block mb-1">价格</label>
          <div class="text-wood-400 font-bold text-lg">¥{{ material?.price }}</div>
        </div>
        <div>
          <label class="text-sm text-wood-600 block mb-1">留言</label>
          <el-input v-model="tradeMessage" type="textarea" :rows="3" placeholder="给卖家留个言吧..." />
        </div>
      </div>
      <template #footer>
        <button type="button" @click="tradeDialogVisible = false" class="wood-btn-outline mr-2">取消</button>
        <button type="button" @click="handleTrade" class="wood-btn">
          {{ tradeType === 'buy' ? '确认购买' : '发起互换' }}
        </button>
      </template>
    </el-dialog>
  </div>
</template>
