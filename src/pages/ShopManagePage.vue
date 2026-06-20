<script setup lang="ts">
import { ref, computed } from 'vue'
import TradeStatusBadge from '@/components/TradeStatusBadge.vue'
import { Download, Upload, Edit, Trash2 } from 'lucide-vue-next'
import { ElMessage, ElMessageBox } from 'element-plus'

const activeTab = ref('materials')

const materials = ref([
  { id: 1, title: '进口榉木板材', category: '木质', price: 68, status: 'active', views: 156, created_at: '2026-06-10' },
  { id: 2, title: '红松木料', category: '木质', price: 45, status: 'active', views: 89, created_at: '2026-06-12' },
  { id: 3, title: '黑胡桃木板', category: '木质', price: 158, status: 'sold', views: 234, created_at: '2026-06-08' },
])

const trades = ref([
  { id: 1, material_title: '黑胡桃木板', from_username: '手工达人', type: 'buy', status: 'completed' as const, price: 158, created_at: '2026-06-09' },
  { id: 2, material_title: '进口榉木板材', from_username: '木工新手', type: 'swap', status: 'pending' as const, created_at: '2026-06-15' },
  { id: 3, material_title: '红松木料', from_username: '爱好者', type: 'buy', status: 'shipping' as const, price: 45, created_at: '2026-06-14' },
])

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

function handleDelete(id: number) {
  ElMessageBox.confirm('确定删除此材料吗？', '提示', { type: 'warning' }).then(() => {
    materials.value = materials.value.filter(m => m.id !== id)
    ElMessage.success('已删除')
  }).catch(() => {})
}

function handleExport() {
  const csv = '标题,分类,价格,状态\n' + materials.value.map(m => `${m.title},${m.category},${m.price},${m.status}`).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'materials.csv'
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}

function handleImport() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.csv'
  input.onchange = () => {
    ElMessage.success('导入成功')
  }
  input.click()
}
</script>

<template>
  <div class="container mx-auto px-4 py-6">
    <h1 class="font-display text-2xl font-bold text-wood-700 mb-6">店铺管理</h1>

    <el-tabs v-model="activeTab" class="wood-tabs">
      <el-tab-pane label="我的闲置" name="materials">
        <div class="flex gap-2 mb-4">
          <router-link to="/market/publish" class="wood-btn text-sm no-underline">发布新材料</router-link>
          <button @click="handleImport" class="wood-btn-outline text-sm flex items-center gap-1">
            <Upload class="w-4 h-4" /> 批量导入
          </button>
          <button @click="handleExport" class="wood-btn-outline text-sm flex items-center gap-1">
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
                <th class="px-4 py-3 text-left text-sm font-medium text-wood-700">浏览</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-wood-700">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="material in materials" :key="material.id" class="border-t border-wood-200 hover:bg-wood-50 transition-colors">
                <td class="px-4 py-3 text-sm text-wood-700">{{ material.title }}</td>
                <td class="px-4 py-3 text-sm text-wood-600">{{ material.category }}</td>
                <td class="px-4 py-3 text-sm text-wood-400 font-medium">¥{{ material.price }}</td>
                <td class="px-4 py-3">
                  <span :class="['text-xs px-2 py-0.5 rounded-full', material.status === 'active' ? 'bg-matcha-400/20 text-matcha-500' : 'bg-gray-200 text-gray-500']">
                    {{ material.status === 'active' ? '在售' : '已售' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-sm text-wood-500">{{ material.views }}</td>
                <td class="px-4 py-3">
                  <div class="flex gap-2">
                    <button class="p-1 text-wood-600 hover:text-wood-400"><Edit class="w-4 h-4" /></button>
                    <button @click="handleDelete(material.id)" class="p-1 text-red-500 hover:text-red-600"><Trash2 class="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="交易记录" name="trades">
        <div class="fabric-bg rounded-wood-lg overflow-hidden border border-wood-300">
          <table class="w-full">
            <thead>
              <tr class="bg-wood-200">
                <th class="px-4 py-3 text-left text-sm font-medium text-wood-700">材料</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-wood-700">对方</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-wood-700">类型</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-wood-700">金额</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-wood-700">状态</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-wood-700">日期</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="trade in trades" :key="trade.id" class="border-t border-wood-200 hover:bg-wood-50 transition-colors">
                <td class="px-4 py-3 text-sm text-wood-700">{{ trade.material_title }}</td>
                <td class="px-4 py-3 text-sm text-wood-600">{{ trade.from_username }}</td>
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
  </div>
</template>
