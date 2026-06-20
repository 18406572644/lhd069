<script setup lang="ts">
import { ArrowRightLeft, Pin } from 'lucide-vue-next'

defineProps<{
  id: number
  title: string
  price: number
  category: string
  image: string
  canSwap?: boolean
  username?: string
  isPinned?: boolean
}>()
</script>

<template>
  <router-link
    :to="`/market/${id}`"
    class="block fabric-bg rounded-wood-lg overflow-hidden wood-shadow-hover border border-wood-300 no-underline group relative"
  >
    <div
      v-if="isPinned"
      class="absolute top-2 left-2 z-10 flex items-center gap-1 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full shadow"
    >
      <Pin class="w-3 h-3" /> 置顶
    </div>
    <div class="aspect-square overflow-hidden bg-wood-200">
      <img
        :src="image"
        :alt="title"
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        loading="lazy"
      />
    </div>
    <div class="p-3">
      <h3 class="font-display text-sm font-bold text-wood-700 truncate mb-1">{{ title }}</h3>
      <div class="flex items-center justify-between mb-2">
        <span class="text-wood-400 font-bold text-base">¥{{ price }}</span>
        <span
          v-if="canSwap"
          class="flex items-center gap-1 text-xs text-matcha-500 bg-matcha-400/20 px-2 py-0.5 rounded-full"
        >
          <ArrowRightLeft class="w-3 h-3" />
          可互换
        </span>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-xs bg-wood-400/15 text-wood-600 px-2 py-0.5 rounded-full">{{ category }}</span>
        <span v-if="username" class="text-xs text-wood-500">{{ username }}</span>
      </div>
    </div>
  </router-link>
</template>
