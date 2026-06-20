<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useMaterialsStore } from '@/stores/materials'
import MaterialCard from '@/components/MaterialCard.vue'
import CategoryNav from '@/components/CategoryNav.vue'
import TagCloud from '@/components/TagCloud.vue'
import { Search, SlidersHorizontal, Hash } from 'lucide-vue-next'

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

const displayMaterials = computed(() => {
  return store.materials.map((m: any) => ({
    id: m.id,
    title: m.title,
    price: m.price,
    category: m.category,
    image: m.images?.[0]?.url || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=craft%20material%20wooden%20fabric&image_size=square',
    canSwap: !!m.is_swappable,
    username: m.publisher?.username || m.username || '手作爱好者',
    isPinned: !!m.is_pinned,
  }))
})

onMounted(() => {
  store.fetchMaterials()
})

function handleSearch() {
  store.setFilters({
    keyword: keyword.value,
    minPrice: priceRange.value[0],
    maxPrice: priceRange.value[1],
    canSwap: canSwapOnly.value || undefined
  })
  store.setPage(1)
  store.fetchMaterials()
}

function handleCategoryChange(val: string) {
  store.setFilters({
    category: val,
    minPrice: priceRange.value[0],
    maxPrice: priceRange.value[1],
    canSwap: canSwapOnly.value || undefined
  })
  store.setPage(1)
  store.fetchMaterials()
}

function handleSortChange() {
  store.setFilters({
    sort: sort.value,
    minPrice: priceRange.value[0],
    maxPrice: priceRange.value[1],
    canSwap: canSwapOnly.value || undefined
  })
  store.setPage(1)
  store.fetchMaterials()
}

function handlePageChange(page: number) {
  store.setPage(page)
  store.fetchMaterials()
}

watch(
  () => [priceRange.value[0], priceRange.value[1], canSwapOnly.value],
  () => {
    store.setFilters({
      minPrice: priceRange.value[0],
      maxPrice: priceRange.value[1],
      canSwap: canSwapOnly.value || undefined
    })
    store.setPage(1)
    store.fetchMaterials()
  }
)
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

          <div class="border-t border-wood-300 pt-4">
            <h4 class="text-sm font-medium text-wood-600 mb-3 flex items-center gap-1.5">
              <Hash class="w-4 h-4" /> 热门标签
            </h4>
            <TagCloud :limit="15" />
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
            type="button"
            @click="sidebarOpen = !sidebarOpen"
            class="lg:hidden flex items-center gap-1 px-3 py-2 rounded-wood border border-wood-300 text-wood-600 hover:bg-wood-200 transition-colors"
          >
            <SlidersHorizontal class="w-4 h-4" />
            筛选
          </button>
        </div>

        <div v-if="!store.loading && displayMaterials.length === 0" class="text-center py-16">
          <p class="text-wood-500 text-lg">暂无符合条件的材料</p>
          <p class="text-wood-400 text-sm mt-2">试试调整筛选条件</p>
        </div>

        <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          <div
            v-for="(item, index) in displayMaterials"
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
            :total="store.pagination.total || 0"
            layout="prev, pager, next"
            @current-change="handlePageChange"
            background
          />
        </div>
      </main>
    </div>
  </div>
</template>
