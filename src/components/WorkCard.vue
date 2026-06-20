<script setup lang="ts">
defineProps<{
  id: number
  title: string
  image: string
  author: string
  avatar?: string
  tags?: string[]
}>()
</script>

<template>
  <router-link
    :to="`/works/${id}`"
    class="block break-inside-avoid mb-4 fabric-bg rounded-wood-lg overflow-hidden wood-shadow-hover border border-wood-300 no-underline group"
  >
    <div class="overflow-hidden">
      <img
        :src="image"
        :alt="title"
        class="w-full object-cover transition-transform duration-500 group-hover:scale-110"
        loading="lazy"
      />
    </div>
    <div class="p-3">
      <h3 class="font-display text-sm font-bold text-wood-700 mb-2 line-clamp-2">{{ title }}</h3>
      <div class="flex items-center gap-2 mb-2">
        <div class="w-6 h-6 rounded-full bg-wood-400 flex items-center justify-center overflow-hidden">
          <img v-if="avatar" :src="avatar" class="w-full h-full object-cover" alt="" />
          <span v-else class="text-xs text-white font-bold">{{ author[0] }}</span>
        </div>
        <span class="text-xs text-wood-500">{{ author }}</span>
      </div>
      <div v-if="tags && tags.length" class="flex flex-wrap gap-1">
        <span
          v-for="tag in tags.slice(0, 3)"
          :key="tag"
          class="text-xs bg-wood-200 text-wood-600 px-2 py-0.5 rounded-full"
        >
          {{ tag }}
        </span>
      </div>
    </div>
  </router-link>
</template>
