<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useMaterialsStore } from '@/stores/materials'
import { useTradesStore } from '@/stores/trades'
import TradeStatusBadge from '@/components/TradeStatusBadge.vue'
import { User, Star, Edit } from 'lucide-vue-next'
import { ElMessage } from 'element-plus'

const auth = useAuthStore()
const activeTab = ref('profile')

const editMode = ref(false)
const profileForm = ref({
  username: auth.user?.username || '',
  email: auth.user?.email || '',
  bio: '热爱手工，享受自然材料的温度。',
})

const myMaterials = ref([
  { id: 1, title: '进口榉木板材', category: '木质', price: 68, status: 'active', created_at: '2026-06-10' },
  { id: 2, title: '红松木料', category: '木质', price: 45, status: 'active', created_at: '2026-06-12' },
])

const myTrades = ref([
  { id: 1, material_title: '黑胡桃木板', type: 'buy', status: 'completed' as const, price: 158, created_at: '2026-06-09' },
  { id: 2, material_title: '进口榉木板材', type: 'swap', status: 'pending' as const, created_at: '2026-06-15' },
])

const creditHistory = ref([
  { id: 1, type: 'trade_complete', score: 5, comment: '交易顺利，物品描述准确', from_username: '手工达人', created_at: '2026-06-09' },
  { id: 2, type: 'trade_complete', score: 4, comment: '包装可以更好一些', from_username: '木工新手', created_at: '2026-06-14' },
])

function saveProfile() {
  editMode.value = false
  ElMessage.success('资料已更新')
}
</script>

<template>
  <div class="container mx-auto px-4 py-6">
    <h1 class="font-display text-2xl font-bold text-wood-700 mb-6">个人中心</h1>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="个人资料" name="profile">
        <div class="fabric-bg rounded-wood-lg p-6 wood-shadow border border-wood-300 max-w-2xl">
          <div class="flex items-center gap-4 mb-6">
            <div class="w-20 h-20 rounded-full bg-wood-400 flex items-center justify-center">
              <User class="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 class="font-display text-xl font-bold text-wood-700">{{ profileForm.username }}</h2>
              <div class="flex items-center gap-1 text-sm text-wood-500">
                <Star class="w-4 h-4 fill-wood-400 text-wood-400" />
                <span>信用评分: 4.8</span>
              </div>
            </div>
            <button @click="editMode = !editMode" class="ml-auto wood-btn-outline text-sm flex items-center gap-1">
              <Edit class="w-4 h-4" /> {{ editMode ? '取消' : '编辑' }}
            </button>
          </div>

          <div class="space-y-4">
            <div>
              <label class="text-sm text-wood-600 block mb-1">用户名</label>
              <el-input v-model="profileForm.username" :disabled="!editMode" />
            </div>
            <div>
              <label class="text-sm text-wood-600 block mb-1">邮箱</label>
              <el-input v-model="profileForm.email" :disabled="!editMode" />
            </div>
            <div>
              <label class="text-sm text-wood-600 block mb-1">个人简介</label>
              <el-input v-model="profileForm.bio" type="textarea" :rows="3" :disabled="!editMode" />
            </div>
            <div v-if="editMode">
              <button @click="saveProfile" class="wood-btn">保存修改</button>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="我的发布" name="posts">
        <div class="fabric-bg rounded-wood-lg overflow-hidden border border-wood-300">
          <table class="w-full">
            <thead>
              <tr class="bg-wood-200">
                <th class="px-4 py-3 text-left text-sm font-medium text-wood-700">标题</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-wood-700">分类</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-wood-700">价格</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-wood-700">状态</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-wood-700">日期</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in myMaterials" :key="item.id" class="border-t border-wood-200 hover:bg-wood-50">
                <td class="px-4 py-3 text-sm text-wood-700">{{ item.title }}</td>
                <td class="px-4 py-3 text-sm text-wood-600">{{ item.category }}</td>
                <td class="px-4 py-3 text-sm text-wood-400 font-medium">¥{{ item.price }}</td>
                <td class="px-4 py-3"><span class="text-xs bg-matcha-400/20 text-matcha-500 px-2 py-0.5 rounded-full">在售</span></td>
                <td class="px-4 py-3 text-sm text-wood-500">{{ item.created_at }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="我的交易" name="trades">
        <div class="fabric-bg rounded-wood-lg overflow-hidden border border-wood-300">
          <table class="w-full">
            <thead>
              <tr class="bg-wood-200">
                <th class="px-4 py-3 text-left text-sm font-medium text-wood-700">材料</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-wood-700">类型</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-wood-700">金额</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-wood-700">状态</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-wood-700">日期</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="trade in myTrades" :key="trade.id" class="border-t border-wood-200 hover:bg-wood-50">
                <td class="px-4 py-3 text-sm text-wood-700">{{ trade.material_title }}</td>
                <td class="px-4 py-3">
                  <span :class="['text-xs px-2 py-0.5 rounded-full', trade.type === 'buy' ? 'bg-wood-400/15 text-wood-600' : 'bg-matcha-400/20 text-matcha-500']">
                    {{ trade.type === 'buy' ? '购买' : '互换' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-sm text-wood-400 font-medium">{{ trade.price ? `¥${trade.price}` : '-' }}</td>
                <td class="px-4 py-3"><TradeStatusBadge :status="trade.status" /></td>
                <td class="px-4 py-3 text-sm text-wood-500">{{ trade.created_at }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="信用记录" name="credit">
        <div class="space-y-3">
          <div v-for="record in creditHistory" :key="record.id" class="fabric-bg rounded-wood-lg p-4 border border-wood-300">
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm font-medium text-wood-700">{{ record.from_username }} 的评价</span>
              <div class="flex items-center gap-0.5">
                <Star v-for="i in 5" :key="i" :class="['w-4 h-4', i <= record.score ? 'fill-wood-400 text-wood-400' : 'text-wood-200']" />
              </div>
            </div>
            <p class="text-sm text-wood-600">{{ record.comment }}</p>
            <div class="text-xs text-wood-400 mt-1">{{ record.created_at }}</div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>
