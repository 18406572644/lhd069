<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useMaterialsStore } from '@/stores/materials'
import { useTradesStore } from '@/stores/trades'
import { useBrowseHistoryStore, type BrowseTargetType } from '@/stores/browseHistory'
import TradeStatusBadge from '@/components/TradeStatusBadge.vue'
import { User, Star, Edit, History, Trash2, Package, Palette, Store, Clock, X, Coins, Award, ChevronRight } from 'lucide-vue-next'
import { ElMessage, ElMessageBox } from 'element-plus'
import { usePointsStore } from '@/stores/points'

const router = useRouter()
const auth = useAuthStore()
const browseHistoryStore = useBrowseHistoryStore()
const pointsStore = usePointsStore()
const activeTab = ref('profile')
const activeFootprintType = ref<BrowseTargetType | 'all'>('all')

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

const footprintTypeOptions: { value: BrowseTargetType | 'all'; label: string; icon: any }[] = [
  { value: 'all', label: '全部', icon: History },
  { value: 'material', label: '材料', icon: Package },
  { value: 'work', label: '作品', icon: Palette },
  { value: 'shop', label: '店铺', icon: Store }
]

const groupedFootprintByDate = computed(() => {
  const groups: Record<string, typeof browseHistoryStore.items> = {}
  for (const item of browseHistoryStore.items) {
    const date = item.viewed_at.slice(0, 10)
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(item)
  }
  return groups
})

function formatFootprintDate(dateStr: string): string {
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  if (dateStr === today) return '今天'
  if (dateStr === yesterday) return '昨天'
  return dateStr
}

function formatFootprintTime(dateStr: string): string {
  return dateStr.slice(11, 16)
}

async function handleFootprintTypeChange(type: BrowseTargetType | 'all') {
  activeFootprintType.value = type
  await browseHistoryStore.fetchBrowseHistory(type === 'all' ? undefined : type, 1)
}

async function handleClearFootprint() {
  try {
    await ElMessageBox.confirm(
      activeFootprintType.value === 'all'
        ? '确定要清空所有浏览记录吗？'
        : `确定要清空所有${footprintTypeOptions.find(t => t.value === activeFootprintType.value)?.label}浏览记录吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await browseHistoryStore.clearHistory(activeFootprintType.value === 'all' ? undefined : activeFootprintType.value)
    ElMessage.success('已清空浏览记录')
  } catch (e: any) {
    if (e !== 'cancel') {
      console.error(e)
    }
  }
}

async function handleDeleteFootprintItem(id: number) {
  try {
    await browseHistoryStore.deleteRecord(id)
    ElMessage.success('已删除')
  } catch (e) {
    console.error(e)
  }
}

function goToFootprintDetail(item: any) {
  router.push(browseHistoryStore.getTargetUrl(item))
}

watch(activeTab, (tab) => {
  if (tab === 'footprint') {
    browseHistoryStore.fetchBrowseHistory()
  }
})

onMounted(() => {
  if (activeTab.value === 'footprint') {
    browseHistoryStore.fetchBrowseHistory()
  }
  pointsStore.fetchAccount()
})
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

          <div
            class="flex items-center justify-between p-4 rounded-wood-lg bg-gradient-to-r from-wood-100 to-amber-50 border border-wood-200 mb-6 cursor-pointer hover:shadow-md transition-shadow"
            @click="router.push('/points')"
          >
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-2">
                <Coins class="w-5 h-5 text-amber-500" />
                <span class="text-sm text-wood-600">积分余额</span>
                <span class="text-lg font-bold text-wood-700">{{ pointsStore.account?.balance ?? 0 }}</span>
              </div>
              <div class="h-6 w-px bg-wood-300"></div>
              <div class="flex items-center gap-2">
                <Award class="w-5 h-5 text-amber-500" />
                <span class="text-sm text-wood-600">等级</span>
                <span class="text-sm font-bold text-wood-700">{{ pointsStore.account?.level ?? '手工萌新' }}</span>
              </div>
            </div>
            <ChevronRight class="w-4 h-4 text-wood-400" />
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

      <el-tab-pane label="我的足迹" name="footprint">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2 flex-wrap">
            <button
              v-for="opt in footprintTypeOptions"
              :key="opt.value"
              @click="handleFootprintTypeChange(opt.value)"
              :class="[
                'px-3 py-1.5 rounded-full text-xs flex items-center gap-1 transition-all',
                activeFootprintType === opt.value
                  ? 'bg-wood-600 text-white shadow-md'
                  : 'bg-wood-100 text-wood-600 hover:bg-wood-200'
              ]"
            >
              <component :is="opt.icon" class="w-3.5 h-3.5" />
              {{ opt.label }}
            </button>
          </div>
          <button
            v-if="browseHistoryStore.total > 0"
            @click="handleClearFootprint"
            class="wood-btn-outline text-xs flex items-center gap-1 text-red-500 border-red-300 hover:bg-red-50 !py-1 !px-3"
          >
            <Trash2 class="w-3.5 h-3.5" />
            清空
          </button>
        </div>

        <div v-if="browseHistoryStore.loading" class="text-center py-12 text-wood-500">
          <div class="animate-pulse">加载中...</div>
        </div>

        <div v-else-if="browseHistoryStore.items.length === 0" class="text-center py-12">
          <div class="w-16 h-16 mx-auto mb-3 bg-wood-100 rounded-full flex items-center justify-center">
            <History class="w-8 h-8 text-wood-400" />
          </div>
          <p class="text-wood-500 mb-1">暂无浏览记录</p>
          <p class="text-xs text-wood-400">浏览记录保留 {{ browseHistoryStore.retentionDays }} 天</p>
        </div>

        <div v-else class="space-y-4">
          <div v-for="(items, date) in groupedFootprintByDate" :key="date" class="space-y-2">
            <div class="flex items-center gap-1.5 text-xs text-wood-500">
              <Clock class="w-3.5 h-3.5" />
              <span class="font-medium">{{ formatFootprintDate(date) }}</span>
            </div>

            <div class="fabric-bg rounded-wood-lg border border-wood-300 overflow-hidden wood-shadow">
              <div
                v-for="(item, index) in items"
                :key="item.id"
                :class="[
                  'flex items-center gap-3 p-3 cursor-pointer hover:bg-wood-50 transition-colors group',
                  index < items.length - 1 ? 'border-b border-wood-200' : ''
                ]"
                @click="goToFootprintDetail(item)"
              >
                <div class="w-12 h-12 rounded-wood bg-wood-200 overflow-hidden flex-shrink-0">
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
                      class="w-5 h-5 text-wood-400"
                    />
                  </div>
                </div>

                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-1.5 mb-0.5">
                    <span
                      :class="[
                        'text-xs px-1.5 py-0.5 rounded-full',
                        item.target_type === 'material'
                          ? 'bg-wood-400/15 text-wood-600'
                          : item.target_type === 'work'
                          ? 'bg-purple-100 text-purple-600'
                          : 'bg-matcha-400/20 text-matcha-500'
                      ]"
                    >
                      {{ browseHistoryStore.getTypeLabel(item.target_type) }}
                    </span>
                  </div>
                  <h4 class="text-sm font-medium text-wood-700 truncate">{{ item.title }}</h4>
                  <div class="text-xs text-wood-400 flex items-center gap-1">
                    <Clock class="w-3 h-3" />
                    {{ formatFootprintTime(item.viewed_at) }}
                  </div>
                </div>

                <button
                  @click.stop="handleDeleteFootprintItem(item.id)"
                  class="p-1.5 rounded-full text-wood-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                  title="删除记录"
                >
                  <X class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div v-if="browseHistoryStore.totalPages > 1" class="flex justify-center pt-2">
            <el-pagination
              v-model:current-page="browseHistoryStore.page"
              :page-size="browseHistoryStore.pageSize"
              :total="browseHistoryStore.total"
              layout="prev, pager, next"
              small
              @current-change="(p: number) => browseHistoryStore.fetchBrowseHistory(activeFootprintType === 'all' ? undefined : activeFootprintType, p)"
            />
          </div>
        </div>

        <div class="mt-6 text-center text-xs text-wood-400">
          浏览记录保留 {{ browseHistoryStore.retentionDays }} 天，过期自动清除
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>
