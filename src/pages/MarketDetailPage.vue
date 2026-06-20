<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTradesStore } from '@/stores/trades'
import ImageGallery from '@/components/ImageGallery.vue'
import SpecTable from '@/components/SpecTable.vue'
import { ArrowRightLeft, ShoppingCart, User, Star } from 'lucide-vue-next'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const tradesStore = useTradesStore()
const tradeDialogVisible = ref(false)
const tradeType = ref<'buy' | 'swap'>('buy')
const tradeMessage = ref('')

const material = ref({
  id: 1,
  title: '进口榉木板材 精选A级 30x20cm',
  price: 68,
  category: '木质',
  can_swap: true,
  description: '进口欧洲榉木，A级板材，纹理清晰美观，适合制作木盒、模型、手工雕刻等。含水率8-12%，已自然风干。边角余料，尺寸约30x20cm，厚度1.5cm，品相良好。有少量自然木节，不影响使用。',
  images: [
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beech%20wood%20planks%20closeup%20grain&image_size=square',
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=wood%20board%20edge%20detail%20craft&image_size=square',
  ],
  specs: [
    { key: '材质', value: '欧洲榉木' },
    { key: '尺寸', value: '约30x20cm' },
    { key: '厚度', value: '1.5cm' },
    { key: '含水率', value: '8-12%' },
    { key: '等级', value: 'A级' },
  ],
  user: {
    id: 10,
    username: '木匠老张',
    avatar: '',
    credit_score: 4.8,
  },
})

async function handleTrade() {
  if (!auth.isLoggedIn) {
    router.push('/login')
    return
  }
  try {
    await tradesStore.createTrade({
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
</script>

<template>
  <div class="container mx-auto px-4 py-6">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div>
        <ImageGallery :images="material.images" />
      </div>

      <div>
        <div class="fabric-bg rounded-wood-lg p-6 wood-shadow border border-wood-300">
          <div class="flex items-center gap-2 mb-3">
            <span class="text-xs bg-wood-400/15 text-wood-600 px-3 py-1 rounded-full">{{ material.category }}</span>
            <span v-if="material.can_swap" class="text-xs bg-matcha-400/20 text-matcha-500 px-3 py-1 rounded-full flex items-center gap-1">
              <ArrowRightLeft class="w-3 h-3" /> 可互换
            </span>
          </div>

          <h1 class="font-display text-2xl font-bold text-wood-700 mb-3">{{ material.title }}</h1>

          <div class="text-3xl font-bold text-wood-400 mb-4">¥{{ material.price }}</div>

          <p class="text-sm text-wood-600 leading-relaxed mb-6">{{ material.description }}</p>

          <SpecTable :specs="material.specs" />

          <div class="flex gap-3 mt-6">
            <button
              @click="tradeType = 'buy'; tradeDialogVisible = true"
              class="wood-btn flex-1 flex items-center justify-center gap-2"
            >
              <ShoppingCart class="w-4 h-4" /> 购买
            </button>
            <button
              v-if="material.can_swap"
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
              <img v-if="material.user.avatar" :src="material.user.avatar" class="w-full h-full object-cover" alt="" />
              <User v-else class="w-6 h-6 text-white" />
            </div>
            <div class="flex-1">
              <div class="font-medium text-wood-700">{{ material.user.username }}</div>
              <div class="flex items-center gap-1 text-sm text-wood-500">
                <Star class="w-3 h-3 fill-wood-400 text-wood-400" />
                <span>{{ material.user.credit_score }}</span>
              </div>
            </div>
            <router-link
              :to="`/shop/${material.user.id}`"
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
          <div class="text-wood-700 font-medium">{{ material.title }}</div>
        </div>
        <div v-if="tradeType === 'buy'">
          <label class="text-sm text-wood-600 block mb-1">价格</label>
          <div class="text-wood-400 font-bold text-lg">¥{{ material.price }}</div>
        </div>
        <div>
          <label class="text-sm text-wood-600 block mb-1">留言</label>
          <el-input v-model="tradeMessage" type="textarea" :rows="3" placeholder="给卖家留个言吧..." />
        </div>
      </div>
      <template #footer>
        <button @click="tradeDialogVisible = false" class="wood-btn-outline mr-2">取消</button>
        <button @click="handleTrade" class="wood-btn">
          {{ tradeType === 'buy' ? '确认购买' : '发起互换' }}
        </button>
      </template>
    </el-dialog>
  </div>
</template>
