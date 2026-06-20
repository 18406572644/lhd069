<script setup lang="ts">
import { ref } from 'vue'
import CategoryNav from '@/components/CategoryNav.vue'
import { Search } from 'lucide-vue-next'

const activeCategory = ref('')
const activeStatus = ref('')
const keyword = ref('')

const statusOptions = [
  { label: '全部', value: '' },
  { label: '进行中', value: 'open' },
  { label: '已关闭', value: 'closed' },
]

const wantedItems = ref([
  { id: 1, title: '求购红木边角料', category: '木质', budgetMin: 50, budgetMax: 100, status: 'open', description: '需要红木或紫檀木的边角料，尺寸不小于10x10cm，用于制作小型摆件。' },
  { id: 2, title: '寻找亚麻布料', category: '布艺', budgetMin: 30, budgetMax: 60, status: 'open', description: '求购天然亚麻布料，米色或浅灰色，每米宽1.4m以上。' },
  { id: 3, title: '急需铜丝线材', category: '金属', budgetMin: 20, budgetMax: 40, status: 'open', description: '需要0.5mm和0.8mm铜丝各一卷，用于绕线首饰制作。' },
  { id: 4, title: '求购羊毛毡', category: '布艺', budgetMin: 40, budgetMax: 80, status: 'open', description: '需要彩色羊毛毡片，至少10种颜色，每色A5大小即可。' },
  { id: 5, title: '回收旧画框', category: '木质', budgetMin: 10, budgetMax: 30, status: 'closed', description: '回收各种尺寸的木质画框，新旧均可，用于二次创作。' },
  { id: 6, title: '求购水彩纸', category: '纸艺', budgetMin: 25, budgetMax: 50, status: 'open', description: '需要300g冷压水彩纸，A4或A3尺寸均可。' },
])
</script>

<template>
  <div class="container mx-auto px-4 py-6">
    <div class="flex items-center justify-between mb-6">
      <h1 class="font-display text-2xl font-bold text-wood-700">求购专区</h1>
      <router-link to="/wanted/publish" class="wood-btn text-sm no-underline">发布求购</router-link>
    </div>

    <div class="flex flex-col sm:flex-row gap-3 mb-6">
      <div class="flex-1 relative">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-wood-400" />
        <input
          v-model="keyword"
          placeholder="搜索求购..."
          class="w-full pl-10 pr-4 py-2.5 rounded-wood border border-wood-300 bg-wood-100 text-wood-700 placeholder:text-wood-400 focus:outline-none focus:border-wood-400"
        />
      </div>
      <CategoryNav v-model="activeCategory" />
      <el-select v-model="activeStatus" placeholder="状态" class="!w-32">
        <el-option v-for="opt in statusOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
      </el-select>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <router-link
        v-for="(item, index) in wantedItems"
        :key="item.id"
        :to="`/wanted/${item.id}`"
        :class="['fabric-bg rounded-wood-lg p-5 border border-wood-300 wood-shadow-hover no-underline animate-fade-in-up', `stagger-${(index % 8) + 1}`]"
      >
        <div class="flex items-start justify-between mb-2">
          <h3 class="font-display text-base font-bold text-wood-700">{{ item.title }}</h3>
          <span :class="['text-xs px-2 py-0.5 rounded-full flex-shrink-0 ml-2', item.status === 'open' ? 'bg-matcha-400/20 text-matcha-500' : 'bg-gray-200 text-gray-500']">
            {{ item.status === 'open' ? '进行中' : '已关闭' }}
          </span>
        </div>
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xs bg-wood-400/15 text-wood-600 px-2 py-0.5 rounded-full">{{ item.category }}</span>
          <span class="text-sm text-wood-400 font-medium">¥{{ item.budgetMin }}-{{ item.budgetMax }}</span>
        </div>
        <p class="text-sm text-wood-600 line-clamp-2">{{ item.description }}</p>
      </router-link>
    </div>
  </div>
</template>
