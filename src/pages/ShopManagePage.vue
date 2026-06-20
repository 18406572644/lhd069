<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTradesStore } from '@/stores/trades'
import { usePointsStore } from '@/stores/points'
import TradeStatusBadge from '@/components/TradeStatusBadge.vue'
import { Download, Upload, Edit, Trash2, Star, MessageSquare } from 'lucide-vue-next'
import { ElMessage, ElMessageBox } from 'element-plus'

const activeTab = ref('materials')

const tradesStore = useTradesStore()
const pointsStore = usePointsStore()

const reviewDialogVisible = ref(false)
const reviewingTradeId = ref<number | null>(null)
const reviewRating = ref(5)
const reviewComment = ref('')
const reviewSubmitting = ref(false)

const completedTrades = computed(() =>
  tradesStore.trades.filter((t: any) => t.status === 'completed')
)

const pendingTrades = computed(() =>
  tradesStore.trades.filter((t: any) => t.status === 'pending' || t.status === 'accepted')
)

const weeklyData = ref([
  { day: '周一', views: 12 },
  { day: '周二', views: 18 },
  { day: '周三', views: 8 },
  { day: '周四', views: 25 },
  { day: '周五', views: 20 },
  { day: '周六', views: 35 },
  { day: '周日', views: 30 },
])

const maxViews = computed(() => Math.max(...weeklyData.value.map(d => d.views)))

function openReviewDialog(tradeId: number) {
  reviewingTradeId.value = tradeId
  reviewRating.value = 5
  reviewComment.value = ''
  reviewDialogVisible.value = true
}

async function submitReview() {
  if (!reviewingTradeId.value) return
  reviewSubmitting.value = true
  try {
    await tradesStore.reviewTrade(reviewingTradeId.value, reviewRating.value, reviewComment.value)
    ElMessage.success('评价成功！获得 15 积分')
    reviewDialogVisible.value = false
    await pointsStore.fetchAccount()
    tradesStore.fetchTrades()
  } catch (error: any) {
    const msg = error?.response?.data?.error || '评价失败'
    ElMessage.error(msg)
  } finally {
    reviewSubmitting.value = false
  }
}

onMounted(() => {
  tradesStore.fetchTrades()
})
</script>

<template>
  <div class="container mx-auto px-4 py-6">
    <h1 class="font-display text-2xl font-bold text-wood-700 mb-6">店铺管理</h1>

    <el-tabs v-model="activeTab" class="wood-tabs">
      <el-tab-pane label="我的闲置" name="materials">
        <div class="flex gap-2 mb-4">
          <router-link to="/market/publish" class="wood-btn text-sm no-underline">发布新材料</router-link>
          <button class="wood-btn-outline text-sm flex items-center gap-1">
            <Upload class="w-4 h-4" /> 批量导入
          </button>
          <button class="wood-btn-outline text-sm flex items-center gap-1">
            <Download class="w-4 h-4" /> 批量导出
          </button>
        </div>
        <div class="fabric-bg rounded-wood-lg overflow-hidden border border-wood-300">
          <table class="w-full">
            <thead>
              <tr class="bg-wood-200">
                <th class="px-4 py-3 text-left text-sm font-medium text-wood-700">材料名称</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-wood-700">分类</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-wood-700">价格</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-wood-700">状态</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-wood-700">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="pendingTrades.length === 0 && completedTrades.length === 0">
                <td colspan="5" class="px-4 py-8 text-center text-wood-400">暂无交易记录</td>
              </tr>
            </tbody>
          </table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="交易记录" name="trades">
        <div v-if="tradesStore.loading" class="text-center py-8 text-wood-500">
          <div class="animate-pulse">加载中...</div>
        </div>
        <div v-else-if="tradesStore.trades.length === 0" class="text-center py-8 text-wood-400">
          暂无交易记录
        </div>
        <div v-else class="fabric-bg rounded-wood-lg overflow-hidden border border-wood-300">
          <table class="w-full">
            <thead>
              <tr class="bg-wood-200">
                <th class="px-4 py-3 text-left text-sm font-medium text-wood-700">材料</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-wood-700">对方</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-wood-700">类型</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-wood-700">金额</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-wood-700">状态</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-wood-700">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="trade in tradesStore.trades" :key="trade.id" class="border-t border-wood-200 hover:bg-wood-50 transition-colors">
                <td class="px-4 py-3 text-sm text-wood-700">{{ trade.material_title || '-' }}</td>
                <td class="px-4 py-3 text-sm text-wood-600">{{ trade.requester_name || trade.responder_name || '-' }}</td>
                <td class="px-4 py-3">
                  <span :class="['text-xs px-2 py-0.5 rounded-full', trade.type === 'buy' ? 'bg-wood-400/15 text-wood-600' : 'bg-matcha-400/20 text-matcha-500']">
                    {{ trade.type === 'buy' ? '购买' : '互换' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-sm text-wood-400 font-medium">{{ trade.price ? `¥${trade.price}` : '-' }}</td>
                <td class="px-4 py-3"><TradeStatusBadge :status="trade.status" /></td>
                <td class="px-4 py-3">
                  <button
                    v-if="trade.status === 'completed'"
                    @click="openReviewDialog(trade.id)"
                    class="flex items-center gap-1 text-xs text-wood-600 hover:text-matcha-500 transition-colors"
                  >
                    <Star class="w-3.5 h-3.5" /> 评价
                  </button>
                  <span v-else class="text-xs text-wood-300">-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="数据统计" name="stats">
        <div class="fabric-bg rounded-wood-lg p-6 border border-wood-300">
          <h3 class="font-display text-lg font-bold text-wood-700 mb-4">本周浏览量</h3>
          <div class="flex items-end gap-3 h-48">
            <div v-for="data in weeklyData" :key="data.day" class="flex-1 flex flex-col items-center gap-1">
              <div class="text-xs text-wood-500">{{ data.views }}</div>
              <div
                class="w-full bg-wood-400 rounded-t-wood transition-all duration-500"
                :style="{ height: `${(data.views / maxViews) * 100}%`, minHeight: '8px' }"
              ></div>
              <div class="text-xs text-wood-600">{{ data.day }}</div>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="reviewDialogVisible" title="评价交易" width="460px">
      <div class="space-y-4">
        <div>
          <label class="text-sm text-wood-600 block mb-2">评分</label>
          <el-rate v-model="reviewRating" :colors="['#8B7355', '#D4A76A', '#8B7355']" />
        </div>
        <div>
          <label class="text-sm text-wood-600 block mb-1">评价内容</label>
          <el-input v-model="reviewComment" type="textarea" :rows="3" placeholder="分享您的交易体验..." />
        </div>
        <div class="p-3 rounded-wood-lg bg-matcha-400/10 border border-matcha-400/30">
          <div class="flex items-center gap-2 text-sm text-matcha-600">
            <MessageSquare class="w-4 h-4" />
            <span>发表评价将获得 <strong>+15 积分</strong></span>
          </div>
        </div>
      </div>
      <template #footer>
        <button type="button" @click="reviewDialogVisible = false" class="wood-btn-outline mr-2">取消</button>
        <button type="button" @click="submitReview" class="wood-btn" :disabled="reviewSubmitting">
          {{ reviewSubmitting ? '提交中...' : '提交评价' }}
        </button>
      </template>
    </el-dialog>
  </div>
</template>
