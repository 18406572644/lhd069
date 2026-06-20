<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useBrowseHistoryStore } from '@/stores/browseHistory'
import ImageGallery from '@/components/ImageGallery.vue'
import { User, Star, MessageCircle, Loader2 } from 'lucide-vue-next'
import api from '@/lib/api'
import { ElMessage } from 'element-plus'

const route = useRoute()
const auth = useAuthStore()
const browseHistoryStore = useBrowseHistoryStore()

const work = ref<any>(null)
const loading = ref(false)
const comments = ref<any[]>([])

const workId = computed(() => parseInt(route.params.id as string))

const newComment = ref('')

async function fetchWork() {
  loading.value = true
  try {
    const res: any = await api.get(`/works/${workId.value}`)
    const data = res.data
    if (data) {
      work.value = {
        ...data,
        images: Array.isArray(data.images) ? data.images.map((img: any) => img.url || img) : [],
        tags: data.tags ? data.tags.split(',').filter((t: string) => t.trim()) : [],
        author: {
          id: data.user_id,
          username: data.username,
          avatar: data.avatar,
          credit_score: data.credit_score
        }
      }
      comments.value = data.comments || []

      if (auth.isLoggedIn) {
        browseHistoryStore.addBrowseRecord(
          'work',
          work.value.id,
          work.value.title,
          work.value.images?.[0] || '',
          {
            author: work.value.author?.username
          }
        )
      }
    }
  } catch (e) {
    console.error('获取作品详情失败', e)
  } finally {
    loading.value = false
  }
}

function addComment() {
  if (!newComment.value.trim()) return
  if (!auth.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }
  comments.value.unshift({
    id: Date.now(),
    username: auth.user?.username || '我',
    avatar: auth.user?.avatar || '',
    content: newComment.value,
    created_at: new Date().toISOString().slice(0, 10),
  })
  newComment.value = ''
  ElMessage.success('评论成功')
}

onMounted(() => {
  if (workId.value) {
    fetchWork()
  }
})
</script>

<template>
  <div class="container mx-auto px-4 py-6 max-w-4xl">
    <div v-if="loading" class="flex items-center justify-center py-20">
      <Loader2 class="w-8 h-8 animate-spin text-wood-400" />
    </div>

    <div v-else-if="!work" class="text-center py-20">
      <p class="text-wood-500 mb-4">作品不存在</p>
      <router-link to="/works" class="wood-btn">返回作品列表</router-link>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                <div class="w-6 h-6 rounded-full bg-wood-300 flex items-center justify-center overflow-hidden">
                  <img v-if="comment.avatar" :src="comment.avatar" class="w-full h-full object-cover" alt="" />
                  <User v-else class="w-3 h-3 text-white" />
                </div>
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
              <img v-if="work.author?.avatar" :src="work.author.avatar" class="w-full h-full object-cover" alt="" />
              <User v-else class="w-7 h-7 text-white" />
            </div>
            <div>
              <div class="font-medium text-wood-700">{{ work.author?.username }}</div>
              <div class="flex items-center gap-1 text-sm text-wood-500">
                <Star class="w-3 h-3 fill-wood-400 text-wood-400" />
                <span>{{ work.author?.credit_score }}</span>
              </div>
            </div>
          </div>
          <router-link :to="`/shop/${work.author?.id}`" class="wood-btn-outline w-full text-sm text-center block no-underline">
            查看店铺
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
