<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  images: string[]
}>()

const currentIndex = ref(0)

function selectImage(index: number) {
  currentIndex.value = index
}
</script>

<template>
  <div v-if="images.length" class="space-y-3">
    <div class="aspect-square rounded-wood-lg overflow-hidden border-2 border-wood-300 bg-wood-100">
      <img
        :src="images[currentIndex]"
        class="w-full h-full object-cover"
        alt=""
      />
    </div>
    <div v-if="images.length > 1" class="flex gap-2 overflow-x-auto pb-1">
      <button
        v-for="(img, index) in images"
        :key="index"
        @click="selectImage(index)"
        :class="[
          'flex-shrink-0 w-16 h-16 rounded-wood overflow-hidden border-2 transition-all duration-200',
          currentIndex === index
            ? 'border-wood-400 shadow-wood'
            : 'border-wood-300 opacity-70 hover:opacity-100'
        ]"
      >
        <img :src="img" class="w-full h-full object-cover" alt="" />
      </button>
    </div>
  </div>
  <div v-else class="aspect-square rounded-wood-lg bg-wood-200 flex items-center justify-center">
    <span class="text-wood-400 text-sm">暂无图片</span>
  </div>
</template>
