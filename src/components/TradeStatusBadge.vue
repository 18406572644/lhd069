<script setup lang="ts">
defineProps<{
  status: 'pending' | 'accepted' | 'shipping' | 'completed' | 'cancelled' | 'rejected'
}>()

const statusMap: Record<string, { label: string; class: string }> = {
  pending: { label: '待处理', class: 'bg-yellow-100 text-yellow-700 border-yellow-300 animate-pulse-glow' },
  accepted: { label: '已接受', class: 'bg-green-100 text-green-700 border-green-300' },
  shipping: { label: '运输中', class: 'bg-blue-100 text-blue-700 border-blue-300' },
  completed: { label: '已完成', class: 'bg-wood-400/20 text-wood-600 border-wood-400' },
  cancelled: { label: '已取消', class: 'bg-gray-100 text-gray-600 border-gray-300' },
  rejected: { label: '已拒绝', class: 'bg-red-100 text-red-600 border-red-300' },
}
</script>

<template>
  <span
    :class="[
      'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border',
      statusMap[status]?.class || 'bg-gray-100 text-gray-600 border-gray-300'
    ]"
  >
    {{ statusMap[status]?.label || status }}
  </span>
</template>
