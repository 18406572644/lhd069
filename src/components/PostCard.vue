<script setup lang="ts">
import { computed } from 'vue'
import { Heart, MessageCircle, Bookmark, Share2, Sparkles } from 'lucide-vue-next'

const props = defineProps<{
  id: number
  title: string
  content: string
  category: string
  images: { url: string }[]
  author: string
  avatar?: string
  userBadges?: { icon: string; name: string }[]
  tags?: { id: number; name: string }[]
  likeCount: number
  commentCount: number
  favoriteCount: number
  viewCount: number
  isEssence?: boolean | number
  isLiked?: boolean | number
  isFavorited?: boolean | number
  createdAt: string
}>()

const emit = defineEmits<{
  (e: 'like', id: number): void
  (e: 'favorite', id: number): void
  (e: 'share', id: number): void
}>()

const categoryMap: Record<string, { label: string; icon: string }> = {
  tutorial: { label: '手工教程', icon: '📚' },
  showcase: { label: '作品展示', icon: '🎨' },
  review: { label: '材料测评', icon: '⭐' },
  diary: { label: '打卡日记', icon: '📝' },
  qa: { label: '求助问答', icon: '❓' },
}

const categoryInfo = computed(() => categoryMap[props.category] || { label: props.category, icon: '📄' })

const coverImage = computed(() => props.images[0]?.url)

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString('zh-CN')
}

const handleLike = (e: Event) => {
  e.preventDefault()
  e.stopPropagation()
  emit('like', props.id)
}

const handleFavorite = (e: Event) => {
  e.preventDefault()
  e.stopPropagation()
  emit('favorite', props.id)
}

const handleShare = (e: Event) => {
  e.preventDefault()
  e.stopPropagation()
  emit('share', props.id)
}
</script>

<template>
  <router-link
    :to="`/community/${id}`"
    class="block fabric-bg rounded-wood-xl overflow-hidden wood-shadow-hover border border-wood-300 no-underline group transition-all duration-300 hover:shadow-xl"
  >
    <div v-if="coverImage" class="relative overflow-hidden aspect-video">
      <img
        :src="coverImage"
        :alt="title"
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        loading="lazy"
      />
      <div class="absolute top-2 left-2 flex gap-2">
        <span class="bg-white/90 backdrop-blur-sm text-wood-700 px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1">
          <span>{{ categoryInfo.icon }}</span>
          <span>{{ categoryInfo.label }}</span>
        </span>
        <span
          v-if="isEssence"
          class="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1"
        >
          <Sparkles class="w-3 h-3" />
          精华
        </span>
      </div>
      <div
        v-if="images.length > 1"
        class="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-1 rounded-lg text-xs"
      >
        {{ images.length }} 图
      </div>
    </div>

    <div class="p-4">
      <h3 class="font-display text-base font-bold text-wood-700 mb-2 line-clamp-2 group-hover:text-wood-500 transition-colors">
        {{ title }}
      </h3>

      <p class="text-sm text-wood-600 mb-3 line-clamp-2 leading-relaxed">
        {{ content }}
      </p>

      <div v-if="tags && tags.length" class="flex flex-wrap gap-1 mb-3">
        <span
          v-for="tag in tags.slice(0, 3)"
          :key="tag.id"
          class="text-xs bg-wood-100 text-wood-500 px-2 py-0.5 rounded-full"
        >
          #{{ tag.name }}
        </span>
      </div>

      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-full bg-wood-400 flex items-center justify-center overflow-hidden flex-shrink-0">
            <img v-if="avatar" :src="avatar" class="w-full h-full object-cover" alt="" />
            <span v-else class="text-xs text-white font-bold">{{ author[0] }}</span>
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-1">
              <span class="text-xs text-wood-600 font-medium truncate">{{ author }}</span>
              <span
                v-for="badge in userBadges?.slice(0, 2)"
                :key="badge.name"
                :title="badge.name"
                class="text-xs flex-shrink-0"
              >
                {{ badge.icon }}
              </span>
            </div>
            <span class="text-xs text-wood-400">{{ formatDate(createdAt) }}</span>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between mt-3 pt-3 border-t border-wood-200">
        <div class="flex items-center gap-3">
          <button
            @click="handleLike"
            :class="[
              'flex items-center gap-1 text-xs transition-colors',
              isLiked ? 'text-red-500' : 'text-wood-400 hover:text-red-500'
            ]"
          >
            <Heart :class="['w-4 h-4', isLiked ? 'fill-current' : '']" />
            <span>{{ likeCount }}</span>
          </button>
          <span class="flex items-center gap-1 text-xs text-wood-400">
            <MessageCircle class="w-4 h-4" />
            <span>{{ commentCount }}</span>
          </span>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="handleFavorite"
            :class="[
              'flex items-center transition-colors',
              isFavorited ? 'text-amber-500' : 'text-wood-400 hover:text-amber-500'
            ]"
          >
            <Bookmark :class="['w-4 h-4', isFavorited ? 'fill-current' : '']" />
          </button>
          <button
            @click="handleShare"
            class="flex items-center text-wood-400 hover:text-wood-600 transition-colors"
          >
            <Share2 class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </router-link>
</template>
