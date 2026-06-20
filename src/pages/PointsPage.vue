<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { usePointsStore } from '@/stores/points'
import { ElMessage } from 'element-plus'
import { CalendarDays, Coins, TrendingUp, TrendingDown, Award, Gift, Zap, Star, ChevronRight, Check, Circle, Crown } from 'lucide-vue-next'

const store = usePointsStore()
const activeTab = ref('checkin')
const recordsType = ref<'earn' | 'spend' | undefined>(undefined)
const checkInLoading = ref(false)

const levelIcons: Record<string, string> = {
  '手工萌新': '🌱',
  '手工爱好者': '🌿',
  '手工达人': '🎨',
  '手工大师': '👑',
  '手工传奇': '💎',
}

const sourceLabels: Record<string, string> = {
  check_in: '每日签到',
  check_in_7day_bonus: '连续7天奖励',
  check_in_30day_bonus: '连续30天奖励',
  publish_material: '发布材料',
  publish_wanted: '发布求购',
  publish_work: '发布作品',
  trade_complete: '完成交易',
  review: '发表评价',
  invite_friend: '邀请好友',
  consume: '积分消耗',
  boost: '提升曝光',
  pin: '置顶发布',
  coupon: '兑换优惠券',
}

const calendarDays = computed(() => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = now.getDate()
  const checkInDates = store.checkInStatus?.check_in_dates || []

  const days: { date: number; isToday: boolean; checkedIn: boolean; isCurrentMonth: boolean }[] = []

  for (let i = 0; i < firstDay; i++) {
    days.push({ date: 0, isToday: false, checkedIn: false, isCurrentMonth: false })
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    days.push({
      date: d,
      isToday: d === today,
      checkedIn: checkInDates.includes(dateStr),
      isCurrentMonth: true,
    })
  }

  return days
})

const currentMonthLabel = computed(() => {
  const now = new Date()
  return `${now.getFullYear()}年${now.getMonth() + 1}月`
})

const weekDays = ['日', '一', '二', '三', '四', '五', '六']

const bonusMilestones = [
  { day: 7, bonus: 50, label: '连续7天' },
  { day: 14, bonus: 50, label: '连续14天' },
  { day: 21, bonus: 50, label: '连续21天' },
  { day: 30, bonus: 200, label: '连续30天' },
]

const consecutiveProgress = computed(() => {
  const days = store.consecutiveDays
  let nextMilestone = bonusMilestones.find((m) => m.day > days)
  if (!nextMilestone) nextMilestone = { day: 30, bonus: 200, label: '连续30天' }
  const prevMilestone = bonusMilestones.filter((m) => m.day <= days).pop()
  const prevDay = prevMilestone ? prevMilestone.day : 0
  const progress = nextMilestone ? Math.min(100, ((days - prevDay) / (nextMilestone.day - prevDay)) * 100) : 100
  return { days, nextMilestone, progress }
})

const pointsRules = [
  { source: 'check_in', label: '每日签到', amount: 10, icon: CalendarDays },
  { source: 'publish_material', label: '发布材料', amount: 20, icon: Coins },
  { source: 'publish_wanted', label: '发布求购', amount: 10, icon: Coins },
  { source: 'publish_work', label: '发布作品', amount: 30, icon: Coins },
  { source: 'trade_complete', label: '完成交易', amount: 50, icon: TrendingUp },
  { source: 'review', label: '发表评价', amount: 15, icon: Star },
  { source: 'invite_friend', label: '邀请好友', amount: 100, icon: Gift },
]

const consumeOptions = [
  { source: 'coupon', label: '兑换优惠券', amount: 100, description: '兑换平台优惠券' },
  { source: 'boost', label: '提升曝光权重', amount: 50, description: '提升发布内容曝光度' },
  { source: 'pin', label: '置顶发布', amount: 80, description: '解锁置顶功能' },
]

async function handleCheckIn() {
  checkInLoading.value = true
  try {
    const result = await store.checkIn()
    let msg = `签到成功！获得 ${result.points_earned} 积分`
    if (result.bonus_type === '7day') {
      msg += '（含连续7天奖励 +50）'
    } else if (result.bonus_type === '30day') {
      msg += '（含连续30天奖励 +200）'
    }
    ElMessage.success(msg)
    store.fetchRecords(recordsType.value, 1)
  } catch (error: any) {
    const msg = error?.response?.data?.error || '签到失败'
    ElMessage.error(msg)
  } finally {
    checkInLoading.value = false
  }
}

async function handleConsume(option: typeof consumeOptions[0]) {
  if (!store.account || store.account.balance < option.amount) {
    ElMessage.warning('积分余额不足')
    return
  }
  try {
    await store.consumePoints(option.amount, option.source, option.description)
    ElMessage.success(`${option.label}兑换成功！消耗 ${option.amount} 积分`)
    store.fetchRecords(recordsType.value, 1)
  } catch (error: any) {
    const msg = error?.response?.data?.error || '兑换失败'
    ElMessage.error(msg)
  }
}

function handleRecordsTypeChange(type: 'earn' | 'spend' | undefined) {
  recordsType.value = type
  store.fetchRecords(type, 1)
}

function handlePageChange(p: number) {
  store.fetchRecords(recordsType.value, p)
}

function formatDate(dateStr: string): string {
  return dateStr.slice(0, 16).replace('T', ' ')
}

function formatSource(source: string): string {
  return sourceLabels[source] || source
}

onMounted(async () => {
  await Promise.all([
    store.fetchAccount(),
    store.fetchCheckInStatus(),
    store.fetchRecords(),
  ])
})
</script>

<template>
  <div class="container mx-auto px-4 py-6 max-w-4xl">
    <h1 class="font-display text-2xl font-bold text-wood-700 mb-6">积分中心</h1>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="fabric-bg rounded-wood-xl p-5 wood-shadow border border-wood-300 flex items-center gap-4">
        <div class="w-12 h-12 rounded-full bg-wood-400/20 flex items-center justify-center">
          <Coins class="w-6 h-6 text-wood-500" />
        </div>
        <div>
          <div class="text-xs text-wood-500">当前积分</div>
          <div class="text-2xl font-bold text-wood-700">{{ store.account?.balance ?? 0 }}</div>
        </div>
      </div>

      <div class="fabric-bg rounded-wood-xl p-5 wood-shadow border border-wood-300 flex items-center gap-4">
        <div class="w-12 h-12 rounded-full bg-matcha-400/20 flex items-center justify-center">
          <TrendingUp class="w-6 h-6 text-matcha-500" />
        </div>
        <div>
          <div class="text-xs text-wood-500">累计获得</div>
          <div class="text-2xl font-bold text-wood-700">{{ store.account?.total_earned ?? 0 }}</div>
        </div>
      </div>

      <div class="fabric-bg rounded-wood-xl p-5 wood-shadow border border-wood-300 flex items-center gap-4">
        <div class="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
          <Award class="w-6 h-6 text-amber-600" />
        </div>
        <div>
          <div class="text-xs text-wood-500">当前等级</div>
          <div class="text-lg font-bold text-wood-700">
            {{ levelIcons[store.account?.level ?? '手工萌新'] }} {{ store.account?.level ?? '手工萌新' }}
          </div>
        </div>
      </div>
    </div>

    <div v-if="store.account && store.account.next_level" class="fabric-bg rounded-wood-xl p-4 wood-shadow border border-wood-300 mb-6">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm text-wood-600">
          {{ levelIcons[store.account.level] }} {{ store.account.level }}
        </span>
        <span class="text-sm text-wood-600">
          {{ levelIcons[store.account.next_level.name] }} {{ store.account.next_level.name }}
          <span class="text-wood-400">（需累计 {{ store.account.next_level.minPoints }} 积分）</span>
        </span>
      </div>
      <div class="w-full bg-wood-200 rounded-full h-3 overflow-hidden">
        <div
          class="h-full rounded-full bg-gradient-to-r from-wood-400 to-amber-500 transition-all duration-500"
          :style="{ width: store.account.progress_to_next + '%' }"
        ></div>
      </div>
      <div class="text-xs text-wood-400 mt-1 text-right">升级进度 {{ store.account.progress_to_next }}%</div>
    </div>

    <div class="fabric-bg rounded-wood-xl p-4 wood-shadow border border-wood-300 mb-6">
      <div class="flex items-center gap-3 mb-3">
        <Crown class="w-5 h-5 text-amber-500" />
        <span class="font-display text-sm font-bold text-wood-700">积分等级体系</span>
      </div>
      <div class="flex items-center gap-2 overflow-x-auto pb-1">
        <div
          v-for="(lvl, idx) in [
            { name: '手工萌新', min: 0, icon: '🌱' },
            { name: '手工爱好者', min: 200, icon: '🌿' },
            { name: '手工达人', min: 500, icon: '🎨' },
            { name: '手工大师', min: 1500, icon: '👑' },
            { name: '手工传奇', min: 5000, icon: '💎' },
          ]"
          :key="lvl.name"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap flex-shrink-0"
          :class="store.account?.level === lvl.name ? 'bg-wood-400 text-white font-bold' : 'bg-wood-100 text-wood-600'"
        >
          <span>{{ lvl.icon }}</span>
          <span>{{ lvl.name }}</span>
          <span class="opacity-70">{{ lvl.min }}+</span>
        </div>
      </div>
    </div>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="每日签到" name="checkin">
        <div class="fabric-bg rounded-wood-xl p-6 wood-shadow border border-wood-300">
          <div class="flex items-center justify-between mb-5">
            <div>
              <h3 class="font-display text-lg font-bold text-wood-700">每日签到</h3>
              <p class="text-sm text-wood-500 mt-1">每日签到获得 10 积分，连续签到有额外奖励！</p>
            </div>
            <button
              @click="handleCheckIn"
              :disabled="store.checkedInToday || checkInLoading"
              :class="[
                'wood-btn text-base !px-8 !py-3 flex items-center gap-2',
                store.checkedInToday ? '!bg-wood-200 !text-wood-400 cursor-not-allowed' : ''
              ]"
            >
              <Check v-if="store.checkedInToday" class="w-5 h-5" />
              <CalendarDays v-else class="w-5 h-5" />
              {{ store.checkedInToday ? '已签到' : (checkInLoading ? '签到中...' : '立即签到') }}
            </button>
          </div>

          <div class="mb-5">
            <div class="flex items-center gap-2 mb-3">
              <Zap class="w-4 h-4 text-amber-500" />
              <span class="text-sm font-medium text-wood-700">已连续签到 {{ store.consecutiveDays }} 天</span>
            </div>
            <div class="flex items-center gap-2">
              <template v-for="(milestone, idx) in bonusMilestones" :key="milestone.day">
                <div
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
                  :class="store.consecutiveDays >= milestone.day
                    ? 'bg-matcha-400/20 text-matcha-500 font-medium'
                    : 'bg-wood-100 text-wood-400'"
                >
                  <Check v-if="store.consecutiveDays >= milestone.day" class="w-3.5 h-3.5" />
                  <Circle v-else class="w-3.5 h-3.5" />
                  {{ milestone.label }} +{{ milestone.bonus }}
                </div>
              </template>
            </div>
            <div v-if="consecutiveProgress.nextMilestone" class="mt-3">
              <div class="flex items-center justify-between text-xs text-wood-500 mb-1">
                <span>距{{ consecutiveProgress.nextMilestone.label }}还需 {{ consecutiveProgress.nextMilestone.day - store.consecutiveDays }} 天</span>
                <span>+{{ consecutiveProgress.nextMilestone.bonus }} 积分</span>
              </div>
              <div class="w-full bg-wood-200 rounded-full h-2 overflow-hidden">
                <div
                  class="h-full rounded-full bg-matcha-500 transition-all duration-500"
                  :style="{ width: consecutiveProgress.progress + '%' }"
                ></div>
              </div>
            </div>
          </div>

          <div class="border-t border-wood-200 pt-5">
            <div class="text-sm font-medium text-wood-700 mb-3">{{ currentMonthLabel }}签到日历</div>
            <div class="grid grid-cols-7 gap-1 text-center">
              <div v-for="d in weekDays" :key="d" class="text-xs text-wood-400 py-1 font-medium">{{ d }}</div>
              <div
                v-for="(day, idx) in calendarDays"
                :key="idx"
                class="aspect-square flex items-center justify-center rounded-wood text-sm relative"
                :class="[
                  !day.isCurrentMonth ? '' : '',
                  day.isToday && day.checkedIn ? 'bg-matcha-500 text-white font-bold' : '',
                  day.isToday && !day.checkedIn ? 'bg-wood-400/20 text-wood-700 font-bold ring-2 ring-wood-400' : '',
                  !day.isToday && day.checkedIn ? 'bg-matcha-400/20 text-matcha-500' : '',
                  !day.isToday && !day.checkedIn && day.isCurrentMonth ? 'text-wood-600' : '',
                ]"
              >
                {{ day.date || '' }}
                <span
                  v-if="day.checkedIn"
                  class="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                  :class="day.isToday ? 'bg-white' : 'bg-matcha-500'"
                ></span>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="积分明细" name="records">
        <div class="fabric-bg rounded-wood-xl p-6 wood-shadow border border-wood-300">
          <div class="flex items-center gap-2 mb-4">
            <button
              @click="handleRecordsTypeChange(undefined)"
              :class="['px-3 py-1.5 rounded-full text-xs transition-all', !recordsType ? 'bg-wood-600 text-white' : 'bg-wood-100 text-wood-600 hover:bg-wood-200']"
            >全部</button>
            <button
              @click="handleRecordsTypeChange('earn')"
              :class="['px-3 py-1.5 rounded-full text-xs transition-all', recordsType === 'earn' ? 'bg-matcha-500 text-white' : 'bg-wood-100 text-wood-600 hover:bg-wood-200']"
            >收入</button>
            <button
              @click="handleRecordsTypeChange('spend')"
              :class="['px-3 py-1.5 rounded-full text-xs transition-all', recordsType === 'spend' ? 'bg-amber-500 text-white' : 'bg-wood-100 text-wood-600 hover:bg-wood-200']"
            >支出</button>
          </div>

          <div v-if="store.loading" class="text-center py-8 text-wood-500">
            <div class="animate-pulse">加载中...</div>
          </div>

          <div v-else-if="store.records.length === 0" class="text-center py-8">
            <Coins class="w-12 h-12 text-wood-300 mx-auto mb-2" />
            <p class="text-wood-500">暂无积分记录</p>
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="record in store.records"
              :key="record.id"
              class="flex items-center justify-between p-3 rounded-wood-lg hover:bg-wood-50 transition-colors border border-wood-200"
            >
              <div class="flex items-center gap-3">
                <div
                  class="w-9 h-9 rounded-full flex items-center justify-center"
                  :class="record.type === 'earn' ? 'bg-matcha-400/20' : 'bg-amber-100'"
                >
                  <TrendingUp v-if="record.type === 'earn'" class="w-4 h-4 text-matcha-500" />
                  <TrendingDown v-else class="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <div class="text-sm font-medium text-wood-700">{{ formatSource(record.source) }}</div>
                  <div class="text-xs text-wood-400">{{ record.description }}</div>
                  <div class="text-xs text-wood-300 mt-0.5">{{ formatDate(record.created_at) }}</div>
                </div>
              </div>
              <div class="text-right">
                <div
                  class="text-sm font-bold"
                  :class="record.type === 'earn' ? 'text-matcha-500' : 'text-amber-600'"
                >
                  {{ record.type === 'earn' ? '+' : '' }}{{ record.amount }}
                </div>
                <div class="text-xs text-wood-400">余额 {{ record.balance_after }}</div>
              </div>
            </div>
          </div>

          <div v-if="store.totalPages > 1" class="flex justify-center pt-4 mt-4 border-t border-wood-200">
            <el-pagination
              v-model:current-page="store.page"
              :page-size="store.pageSize"
              :total="store.totalRecords"
              layout="prev, pager, next"
              small
              @current-change="handlePageChange"
            />
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="赚取积分" name="earn">
        <div class="fabric-bg rounded-wood-xl p-6 wood-shadow border border-wood-300">
          <h3 class="font-display text-lg font-bold text-wood-700 mb-4">积分获取途径</h3>
          <div class="space-y-3">
            <div
              v-for="rule in pointsRules"
              :key="rule.source"
              class="flex items-center justify-between p-4 rounded-wood-lg border border-wood-200 hover:border-wood-400 transition-colors"
            >
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-matcha-400/20 flex items-center justify-center">
                  <component :is="rule.icon" class="w-5 h-5 text-matcha-500" />
                </div>
                <span class="text-sm font-medium text-wood-700">{{ rule.label }}</span>
              </div>
              <span class="text-sm font-bold text-matcha-500">+{{ rule.amount }}</span>
            </div>
          </div>

          <div class="mt-6 p-4 rounded-wood-lg bg-amber-50 border border-amber-200">
            <div class="flex items-center gap-2 mb-2">
              <Gift class="w-4 h-4 text-amber-500" />
              <span class="text-sm font-medium text-amber-700">连续签到奖励</span>
            </div>
            <div class="space-y-1 text-xs text-amber-600">
              <p>连续签到 7 天：额外奖励 +50 积分</p>
              <p>连续签到 14 天：额外奖励 +50 积分</p>
              <p>连续签到 21 天：额外奖励 +50 积分</p>
              <p>连续签到 30 天：额外奖励 +200 积分</p>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="积分兑换" name="consume">
        <div class="fabric-bg rounded-wood-xl p-6 wood-shadow border border-wood-300">
          <h3 class="font-display text-lg font-bold text-wood-700 mb-1">积分兑换</h3>
          <p class="text-sm text-wood-500 mb-4">使用积分兑换平台特权与优惠</p>

          <div class="space-y-3">
            <div
              v-for="option in consumeOptions"
              :key="option.source"
              class="flex items-center justify-between p-4 rounded-wood-lg border border-wood-200 hover:border-wood-400 transition-colors"
            >
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <Zap class="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <div class="text-sm font-medium text-wood-700">{{ option.label }}</div>
                  <div class="text-xs text-wood-400">{{ option.description }}</div>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-sm font-bold text-amber-600">-{{ option.amount }}</span>
                <button
                  @click="handleConsume(option)"
                  :disabled="!store.account || store.account.balance < option.amount"
                  :class="[
                    'px-4 py-1.5 rounded-wood text-xs font-medium transition-all',
                    store.account && store.account.balance >= option.amount
                      ? 'bg-wood-400 text-white hover:bg-wood-600'
                      : 'bg-wood-200 text-wood-400 cursor-not-allowed'
                  ]"
                >
                  兑换
                </button>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>
