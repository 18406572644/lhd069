<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import ImageGallery from '@/components/ImageGallery.vue'
import { User, Star, MessageCircle } from 'lucide-vue-next'

const route = useRoute()

const work = ref({
  id: 1,
  title: '手工雕刻木盒',
  description: '选用上等榉木，纯手工雕刻花纹，榫卯结构，无一颗钉子。表面涂抹天然木蜡油，手感温润。适合收纳首饰、小物件等。每个木盒都是独一无二的手工之作。',
  images: [
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=handmade%20carved%20wooden%20box%20top%20view&image_size=landscape_16_9',
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=handmade%20wooden%20box%20detail%20carving&image_size=landscape_16_9',
  ],
  tags: ['木工', '雕刻', '收纳'],
  author: {
    id: 10,
    username: '木匠老张',
    avatar: '',
    credit_score: 4.8,
  },
})

const comments = ref([
  { id: 1, username: '手工爱好者', content: '做工太精美了！请问可以定制吗？', created_at: '2026-06-15' },
  { id: 2, username: '木工新手', content: '榫卯结构太厉害了，学习了', created_at: '2026-06-16' },
])

const newComment = ref('')

function addComment() {
  if (!newComment.value.trim()) return
  comments.value.push({
    id: Date.now(),
    username: '我',
    content: newComment.value,
    created_at: new Date().toISOString().slice(0, 10),
  })
  newComment.value = ''
}
</script>

<template>
  <div class="container mx-auto px-4 py-6 max-w-4xl">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2">
        <ImageGallery :images="work.images" />

        <div class="fabric-bg rounded-wood-lg p-6 wood-shadow border border-wood-300 mt-6">
          <h1 class="font-display text-2xl font-bold text-wood-700 mb-3">{{ work.title }}</h1>
          <div class="flex flex-wrap gap-2 mb-4">
            <span v-for="tag in work.tags" :key="tag" class="text-xs bg-wood-200 text-wood-600 px-3 py-1 rounded-full">{{ tag }}</span>
          </div>
          <p class="text-sm text-wood-600 leading-relaxed">{{ work.description }}</p>
        </div>

        <div class="fabric-bg rounded-wood-lg p-6 wood-shadow border border-wood-300 mt-6">
          <h3 class="font-display text-lg font-bold text-wood-700 mb-4 flex items-center gap-2">
            <MessageCircle class="w-5 h-5" /> 评论 ({{ comments.length }})
          </h3>
          <div class="space-y-4 mb-4">
            <div v-for="comment in comments" :key="comment.id" class="border-b border-wood-200 pb-3">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-sm font-medium text-wood-700">{{ comment.username }}</span>
                <span class="text-xs text-wood-400">{{ comment.created_at }}</span>
              </div>
              <p class="text-sm text-wood-600">{{ comment.content }}</p>
            </div>
          </div>
          <div class="flex gap-2">
            <input
              v-model="newComment"
              @keyup.enter="addComment"
              placeholder="写下你的评论..."
              class="flex-1 px-4 py-2 rounded-wood border border-wood-300 bg-wood-50 text-wood-700 placeholder:text-wood-400 focus:outline-none focus:border-wood-400"
            />
            <button @click="addComment" class="wood-btn !px-4">发送</button>
          </div>
        </div>
      </div>

      <div>
        <div class="fabric-bg rounded-wood-lg p-4 wood-shadow border border-wood-300 sticky top-24">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-14 h-14 rounded-full bg-wood-400 flex items-center justify-center overflow-hidden">
              <img v-if="work.author.avatar" :src="work.author.avatar" class="w-full h-full object-cover" alt="" />
              <User v-else class="w-7 h-7 text-white" />
            </div>
            <div>
              <div class="font-medium text-wood-700">{{ work.author.username }}</div>
              <div class="flex items-center gap-1 text-sm text-wood-500">
                <Star class="w-3 h-3 fill-wood-400 text-wood-400" />
                <span>{{ work.author.credit_score }}</span>
              </div>
            </div>
          </div>
          <router-link :to="`/shop/${work.author.id}`" class="wood-btn-outline w-full text-sm text-center block no-underline">
            查看店铺
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
