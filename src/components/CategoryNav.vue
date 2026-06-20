<script setup lang="ts">
defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const categories = [
  { label: '全部', value: '' },
  { label: '木质', value: '木质' },
  { label: '布艺', value: '布艺' },
  { label: '皮具', value: '皮具' },
  { label: '编织', value: '编织' },
  { label: '纸艺', value: '纸艺' },
  { label: '颜料', value: '颜料' },
  { label: '金属', value: '金属' },
  { label: '其他', value: '其他' },
]

function select(val: string) {
  emit('update:modelValue', val)
}
</script>

<template>
  <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
    <button
      v-for="cat in categories"
      :key="cat.value"
      @click="select(cat.value)"
      :class="[
        'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border',
        modelValue === cat.value
          ? 'bg-wood-400 text-white border-wood-400 shadow-wood'
          : 'bg-wood-100 text-wood-600 border-wood-300 hover:bg-wood-200 hover:border-wood-400'
      ]"
    >
      {{ cat.label }}
    </button>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
