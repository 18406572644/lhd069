<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useMaterialsStore } from '@/stores/materials'
import MaterialCard from '@/components/MaterialCard.vue'
import CategoryNav from '@/components/CategoryNav.vue'
import { Search, SlidersHorizontal } from 'lucide-vue-next'

const store = useMaterialsStore()
const keyword = ref('')
const sort = ref('latest')
const sidebarOpen = ref(true)
const priceRange = ref<[number, number]>([0, 500])
const canSwapOnly = ref(false)

const sortOptions = [
  { label: '最新发布', value: 'latest' },
  { label: '价格最低', value: 'price_asc' },
  { label: '价格最高', value: 'price_desc' },
  { label: '最多互换', value: 'swap' },
]

const mockMaterials = [
  { id: 1, title: '进口榉木板材 30x20cm', price: 68, category: '木质', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beech%20wood%20planks%20craft%20material&image_size=square', canSwap: true, username: '木匠老张' },
  { id: 2, title: '手工染色彩棉布 1米', price: 35, category: '布艺', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=hand%20dyed%20cotton%20fabric%20textile&image_size=square', canSwap: false, username: '布艺小铺' },
  { id: 3, title: '意大利植鞣革 A4大小', price: 128, category: '皮具', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=italian%20vegetable%20tanned%20leather&image_size=square', canSwap: true, username: '皮革工坊' },
  { id: 4, title: '天然蜂蜡蜡烛套装', price: 45, category: '其他', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=natural%20beeswax%20candle%20set&image_size=square', canSwap: false, username: '蜂语者' },
  { id: 5, title: '手工编织麻绳 5卷', price: 22, category: '编织', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=handmade%20hemp%20rope%20twine%20rolls&image_size=square', canSwap: true, username: '编织达人' },
  { id: 6, title: '水彩颜料24色套装', price: 89, category: '颜料', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=watercolor%20paint%20set%2024%20colors&image_size=square', canSwap: false, username: '画意人生' },
  { id: 7, title: '黄铜配件50个', price: 36, category: '金属', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=brass%20hardware%20findings%20craft&image_size=square', canSwap: true, username: '银饰手作' },
  { id: 8, title: '和纸胶带12卷装', price: 28, category: '纸艺', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=washi%20tape%20rolls%20craft%20paper&image_size=square', canSwap: false, username: '纸艺家' },
]

onMounted(() => {
  store.fetchMaterials()
})

function handleSearch() {
  store.setFilters({ keyword: keyword.value })
  store.fetchMaterials()
}

function handleCategoryChange(val: string) {
  store.setFilters({ category: val })
  store.fetchMaterials()
}

function handleSortChange() {
  store.setFilters({ sort: sort.value })
  store.fetchMaterials()
}

function handlePageChange(page: number) {
  store.setPage(page)
  store.fetchMaterials()
}
</script>

<template>
  <div class="container mx-auto px-4 py-6">
    <div class="flex gap-6">
      <aside
        :class="[
          'flex-shrink-0 w-64 transition-all duration-300',
          sidebarOpen ? 'block' : 'hidden',
          'lg:block'
        ]"
      >
        <div class="fabric-bg rounded-wood-lg p-4 wood-shadow border border-wood-300 sticky top-24">
          <h3 class="font-display text-lg font-bold text-wood-700 mb-4">筛选条件</h3>

          <div class="mb-6">
            <h4 class="text-sm font-medium text-wood-600 mb-2">材料分类</h4>
            <CategoryNav
              :model-value="store.filters.category || ''"
              @update:model-value="handleCategoryChange"
            />
          </div>

          <div class="mb-6">
            <h4 class="text-sm font-medium text-wood-600 mb-3">价格范围</h4>
            <el-slider
              v-model="priceRange"
              range
              :min="0"
              :max="500"
              :step="10"
            />
            <div class="flex justify-between text-xs text-wood-500 mt-1">
              <span>¥{{ priceRange[0] }}</span>
              <span>¥{{ priceRange[1] }}</span>
            </div>
          </div>

          <div class="mb-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="canSwapOnly" class="w-4 h-4 rounded border-wood-300 text-wood-400 focus:ring-wood-400" />
              <span class="text-sm text-wood-600">仅显示可互换</span>
            </label>
          </div>
        </div>
      </aside>

      <main class="flex-1 min-w-0">
        <div class="flex flex-col sm:flex-row gap-3 mb-6">
          <div class="flex-1 relative">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-wood-400" />
            <input
              v-model="keyword"
              @keyup.enter="handleSearch"
              placeholder="搜索材料..."
              class="w-full pl-10 pr-4 py-2.5 rounded-wood border border-wood-300 bg-wood-100 text-wood-700 placeholder:text-wood-400 focus:outline-none focus:border-wood-400 transition-colors"
            />
          </div>
          <el-select v-model="sort" @change="handleSortChange" class="!w-40">
            <el-option
              v-for="opt in sortOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
          <button
            @click="sidebarOpen = !sidebarOpen"
            class="lg:hidden flex items-center gap-1 px-3 py-2 rounded-wood border border-wood-300 text-wood-600 hover:bg-wood-200 transition-colors"
          >
            <SlidersHorizontal class="w-4 h-4" />
            筛选
          </button>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          <div
            v-for="(item, index) in mockMaterials"
            :key="item.id"
            :class="['animate-fade-in-up', `stagger-${(index % 8) + 1}`]"
          >
            <MaterialCard v-bind="item" />
          </div>
        </div>

        <div class="flex justify-center">
          <el-pagination
            :current-page="store.pagination.page"
            :page-size="store.pagination.pageSize"
            :total="store.pagination.total || 24"
            layout="prev, pager, next"
            @current-change="handlePageChange"
            background
          />
        </div>
      </main>
    </div>
  </div>
</template>
