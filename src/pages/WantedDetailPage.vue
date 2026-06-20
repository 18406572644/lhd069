<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { User, Star } from 'lucide-vue-next'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const respondDialogVisible = ref(false)
const respondMessage = ref('')

const wanted = ref({
  id: 1,
  title: '求购红木边角料',
  category: '木质',
  budgetMin: 50,
  budgetMax: 100,
  status: 'open',
  description: '需要红木或紫檀木的边角料，尺寸不小于10x10cm，用于制作小型摆件。要求木材干燥、无裂纹，最好有自然纹理。数量不限，可多次交易。',
  specs: '尺寸不小于10x10cm，干燥无裂纹',
  user: {
    id: 10,
    username: '木匠老张',
    avatar: '',
    credit_score: 4.8,
  },
})

function handleRespond() {
  if (!auth.isLoggedIn) {
    router.push('/login')
    return
  }
  respondDialogVisible.value = true
}

function submitResponse() {
  ElMessage.success('回复已发送')
  respondDialogVisible.value = false
  respondMessage.value = ''
}
</script>

<template>
  <div class="container mx-auto px-4 py-6 max-w-4xl">
    <div class="fabric-bg rounded-wood-lg p-6 wood-shadow border border-wood-300">
      <div class="flex items-center gap-2 mb-3">
        <span class="text-xs bg-wood-400/15 text-wood-600 px-3 py-1 rounded-full">{{ wanted.category }}</span>
        <span :class="['text-xs px-3 py-1 rounded-full', wanted.status === 'open' ? 'bg-matcha-400/20 text-matcha-500' : 'bg-gray-200 text-gray-500']">
          {{ wanted.status === 'open' ? '进行中' : '已关闭' }}
        </span>
      </div>

      <h1 class="font-display text-2xl font-bold text-wood-700 mb-3">{{ wanted.title }}</h1>

      <div class="text-xl font-bold text-wood-400 mb-4">
        预算: ¥{{ wanted.budgetMin }} - ¥{{ wanted.budgetMax }}
      </div>

      <p class="text-sm text-wood-600 leading-relaxed mb-4">{{ wanted.description }}</p>

      <div class="bg-wood-50 rounded-wood p-4 mb-6">
        <h4 class="text-sm font-medium text-wood-600 mb-2">要求规格</h4>
        <p class="text-sm text-wood-700">{{ wanted.specs }}</p>
      </div>

      <button @click="handleRespond" class="wood-btn flex items-center gap-2">
        我有这个材料
      </button>
    </div>

    <div class="fabric-bg rounded-wood-lg p-4 mt-4 wood-shadow border border-wood-300">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-full bg-wood-400 flex items-center justify-center overflow-hidden">
          <img v-if="wanted.user.avatar" :src="wanted.user.avatar" class="w-full h-full object-cover" alt="" />
          <User v-else class="w-6 h-6 text-white" />
        </div>
        <div class="flex-1">
          <div class="font-medium text-wood-700">{{ wanted.user.username }}</div>
          <div class="flex items-center gap-1 text-sm text-wood-500">
            <Star class="w-3 h-3 fill-wood-400 text-wood-400" />
            <span>{{ wanted.user.credit_score }}</span>
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="respondDialogVisible" title="我有这个材料" width="460px">
      <div class="space-y-4">
        <div>
          <label class="text-sm text-wood-600 block mb-1">求购项</label>
          <div class="text-wood-700 font-medium">{{ wanted.title }}</div>
        </div>
        <div>
          <label class="text-sm text-wood-600 block mb-1">留言</label>
          <el-input v-model="respondMessage" type="textarea" :rows="3" placeholder="描述你拥有的材料情况..." />
        </div>
      </div>
      <template #footer>
        <button @click="respondDialogVisible = false" class="wood-btn-outline mr-2">取消</button>
        <button @click="submitResponse" class="wood-btn">发送回复</button>
      </template>
    </el-dialog>
  </div>
</template>
