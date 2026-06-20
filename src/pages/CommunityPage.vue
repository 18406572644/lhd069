<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { postsApi } from '@/lib/api'
import { ElMessage } from 'element-plus'
import PostCard from '@/components/PostCard.vue'
import Empty from '@/components/Empty.vue'
import { Search, Flame, Sparkles, Users, TrendingUp, Heart, MessageCircle } from 'lucide-vue-next'

const router = useRouter()
const auth = useAuthStore()

const loading = ref(false)
const posts = ref<any[]>([])
const categories = ref<any[]>([])
const experts = ref<any[]>([])
const hotPosts = ref<any[]>([])
const essencePosts = ref<any[]>([])

const activeTab = ref('latest')
const activeCategory = ref('')
const keyword = ref('')
const activeSort = ref('latest')
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

const sortOptions = [
  { value: 'latest', label: '最新', icon: TrendingUp },
  { value: 'hot', label: '热门', icon: Flame },
  { value: 'essence', label: '精华', icon: Sparkles },
]

const tabs = [
  { value: 'latest', label: '全部' },
  { value: 'essence', label: '精华' },
  { value: 'hot', label: '热门' },
]

const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

const fetchCategories = async () => {
  try {
    const res: any = await postsApi.getCategories()
    if (res.success) {
      categories.value = res.data
    }
  } catch (error) {
    console.error('获取分类失败', error)
  }
}

const fetchExperts = async () => {
  try {
    const res: any = await postsApi.getExperts(8)
    if (res.success) {
      experts.value = res.data
    }
  } catch (error) {
    console.error('获取达人失败', error)
  }
}

const fetchHotPosts = async () => {
  try {
    const res: any = await postsApi.getHot(5)
    if (res.success) {
      hotPosts.value = res.data
    }
  } catch (error) {
    console.error('获取热门帖子失败', error)
  }
}

const fetchEssencePosts = async () => {
  try {
    const res: any = await postsApi.getEssence(5)
    if (res.success) {
      essencePosts.value = res.data
    }
  } catch (error) {
    console.error('获取精华帖子失败', error)
  }
}

const fetchPosts = async (reset = false) => {
  if (reset) {
    page.value = 1
    posts.value = []
  }
  loading.value = true
  try {
    const params: any = {
      page: page.value,
      pageSize: pageSize.value,
      sort: activeTab.value === 'latest' ? activeSort.value : activeTab.value,
    }
    if (activeCategory.value) {
      params.category = activeCategory.value
    }
    if (keyword.value) {
      params.keyword = keyword.value
    }
    const res: any = await postsApi.getList(params)
    if (res.success) {
      if (reset) {
        posts.value = res.data.items
      } else {
        posts.value = [...posts.value, ...res.data.items]
      }
      total.value = res.data.total
    }
  } catch (error) {
    console.error('获取帖子列表失败', error)
    ElMessage.error('获取帖子列表失败')
  } finally {
    loading.value = false
  }
}

const handleLike = async (id: number) => {
  if (!auth.isLoggedIn) {
    router.push('/login')
    return
  }
  try {
    const res: any = await postsApi.like(id)
    if (res.success) {
      const post = posts.value.find((p) => p.id === id)
      if (post) {
        post.is_liked = res.data.liked
        post.like_count = res.data.like_count
      }
    }
  } catch (error) {
    console.error('点赞失败', error)
  }
}

const handleFavorite = async (id: number) => {
  if (!auth.isLoggedIn) {
    router.push('/login')
    return
  }
  try {
    const res: any = await postsApi.favorite(id)
    if (res.success) {
      const post = posts.value.find((p) => p.id === id)
      if (post) {
        post.is_favorited = res.data.favorited
        post.favorite_count = res.data.favorite_count
      }
      ElMessage.success(res.data.favorited ? '已收藏' : '已取消收藏')
    }
  } catch (error) {
    console.error('收藏失败', error)
  }
}

const handleShare = async (id: number) => {
  try {
    const url = `${window.location.origin}/community/${id}`
    await navigator.clipboard.writeText(url)
    ElMessage.success('链接已复制到剪贴板')
    await postsApi.share(id, 'link')
    const post = posts.value.find((p) => p.id === id)
    if (post) {
      post.share_count += 1
    }
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

const handleSearch = () => {
  fetchPosts(true)
}

const handleTabChange = (tab: string) => {
  activeTab.value = tab
  fetchPosts(true)
}

const handleCategoryChange = (category: string) => {
  activeCategory.value = category
  fetchPosts(true)
}

const handleSortChange = (sort: string) => {
  activeSort.value = sort
  fetchPosts(true)
}

const loadMore = () => {
  if (loading.value || page.value >= totalPages.value) return
  page.value += 1
  fetchPosts()
}

onMounted(() => {
  fetchCategories()
  fetchExperts()
  fetchHotPosts()
  fetchEssencePosts()
  fetchPosts(true)
})
</script>

<template>
  <div class="container mx-auto px-4 py-6">
    <div class="flex items-center justify-between mb-6">
      <h1 class="font-display text-2xl font-bold text-wood-700 flex items-center gap-2">
        <Users class="w-6 h-6 text-wood-500" />
        手工社区
      </h1>
      <router-link
        v-if="auth.isLoggedIn"
        to="/community/publish"
        class="wood-btn text-sm no-underline flex items-center gap-1"
      >
        <span class="text-lg">+</span>
        发布动态
      </router-link>
    </div>

    <div class="flex flex-col lg:flex-row gap-6">
      <div class="flex-1">
        <div class="fabric-bg rounded-wood-xl p-4 mb-6 border border-wood-300">
          <div class="flex flex-wrap gap-3 items-center mb-4">
            <div class="flex-1 min-w-[200px] relative">
              <input
                v-model="keyword"
                type="text"
                placeholder="搜索帖子..."
                class="w-full pl-10 pr-4 py-2 rounded-lg border border-wood-300 bg-white text-wood-700 placeholder:text-wood-400 focus:outline-none focus:border-wood-500"
                @keyup.enter="handleSearch"
              />
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-wood-400" />
            </div>
            <button @click="handleSearch" class="wood-btn text-sm">搜索</button>
          </div>

          <div class="flex gap-2 mb-4 overflow-x-auto pb-2">
            <button
              @click="handleTabChange('latest')"
              :class="[
                'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border flex items-center gap-1',
                activeTab === 'latest'
                  ? 'bg-wood-400 text-white border-wood-400'
                  : 'bg-wood-100 text-wood-600 border-wood-300 hover:bg-wood-200'
              ]"
            >
              全部
            </button>
            <button
              @click="handleTabChange('essence')"
              :class="[
                'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border flex items-center gap-1',
                activeTab === 'essence'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-transparent'
                  : 'bg-wood-100 text-wood-600 border-wood-300 hover:bg-wood-200'
              ]"
            >
              <Sparkles class="w-4 h-4" />
              精华
            </button>
            <button
              @click="handleTabChange('hot')"
              :class="[
                'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border flex items-center gap-1',
                activeTab === 'hot'
                  ? 'bg-red-500 text-white border-red-500'
                  : 'bg-wood-100 text-wood-600 border-wood-300 hover:bg-wood-200'
              ]"
            >
              <Flame class="w-4 h-4" />
              热门
            </button>
          </div>

          <div class="flex gap-2 overflow-x-auto pb-2">
            <button
              @click="handleCategoryChange('')"
              :class="[
                'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 border',
                !activeCategory
                  ? 'bg-wood-500 text-white border-wood-500'
                  : 'bg-white text-wood-600 border-wood-300 hover:bg-wood-50'
              ]"
            >
              全部分类
            </button>
            <button
              v-for="cat in categories"
              :key="cat.value"
              @click="handleCategoryChange(cat.value)"
              :class="[
                'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 border flex items-center gap-1',
                activeCategory === cat.value
                  ? 'bg-wood-500 text-white border-wood-500'
                  : 'bg-white text-wood-600 border-wood-300 hover:bg-wood-50'
              ]"
            >
              <span>{{ cat.icon }}</span>
              <span>{{ cat.label }}</span>
            </button>
          </div>

          <div v-if="activeTab === 'latest'" class="flex gap-2 mt-4 pt-4 border-t border-wood-200">
            <button
              v-for="sort in sortOptions"
              :key="sort.value"
              @click="handleSortChange(sort.value)"
              :class="[
                'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300',
                activeSort === sort.value
                  ? 'bg-wood-200 text-wood-700'
                  : 'text-wood-500 hover:text-wood-700 hover:bg-wood-100'
              ]"
            >
              <component :is="sort.icon" class="w-3.5 h-3.5" />
              {{ sort.label }}
            </button>
          </div>
        </div>

        <div v-if="posts.length > 0" class="space-y-4">
          <div
            v-for="(post, index) in posts"
            :key="post.id"
            :class="['animate-fade-in-up', `stagger-${(index % 6) + 1}`]"
          >
            <PostCard
              :id="post.id"
              :title="post.title"
              :content="post.content"
              :category="post.category"
              :images="post.images"
              :author="post.username"
              :avatar="post.avatar"
              :user-badges="post.user_badges"
              :tags="post.tags"
              :like-count="post.like_count"
              :comment-count="post.comment_count"
              :favorite-count="post.favorite_count"
              :view-count="post.view_count"
              :is-essence="post.is_essence"
              :is-liked="post.is_liked"
              :is-favorited="post.is_favorited"
              :created-at="post.created_at"
              @like="handleLike"
              @favorite="handleFavorite"
              @share="handleShare"
            />
          </div>

          <div v-if="page < totalPages" class="text-center py-6">
            <button
              @click="loadMore"
              :disabled="loading"
              class="wood-btn-secondary text-sm px-8 disabled:opacity-50"
            >
              {{ loading ? '加载中...' : '加载更多' }}
            </button>
          </div>
        </div>

        <Empty v-else-if="!loading" description="暂无帖子，快来发布第一条吧~" />

        <div v-if="loading && posts.length === 0" class="text-center py-12 text-wood-500">
          加载中...
        </div>
      </div>

      <div class="lg:w-80 space-y-6">
        <div class="fabric-bg rounded-wood-xl p-4 border border-wood-300">
          <h3 class="font-display text-base font-bold text-wood-700 mb-4 flex items-center gap-2">
            <Flame class="w-5 h-5 text-red-500" />
            热门帖子
          </h3>
          <div class="space-y-3">
            <router-link
              v-for="post in hotPosts"
              :key="post.id"
              :to="`/community/${post.id}`"
              class="block no-underline group"
            >
              <div class="flex gap-3 p-2 rounded-lg hover:bg-wood-50 transition-colors">
                <div class="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-wood-200">
                  <img
                    v-if="post.images?.[0]?.url"
                    :src="post.images[0].url"
                    :alt="post.title"
                    class="w-full h-full object-cover"
                  />
                </div>
                <div class="flex-1 min-w-0">
                  <h4 class="text-sm font-medium text-wood-700 line-clamp-2 group-hover:text-wood-500 transition-colors">
                    {{ post.title }}
                  </h4>
                  <div class="flex items-center gap-2 mt-1 text-xs text-wood-400">
                    <span class="flex items-center gap-0.5">
                      <Heart class="w-3 h-3" />
                      {{ post.like_count }}
                    </span>
                    <span class="flex items-center gap-0.5">
                      <MessageCircle class="w-3 h-3" />
                      {{ post.comment_count }}
                    </span>
                  </div>
                </div>
              </div>
            </router-link>
          </div>
        </div>

        <div class="fabric-bg rounded-wood-xl p-4 border border-wood-300">
          <h3 class="font-display text-base font-bold text-wood-700 mb-4 flex items-center gap-2">
            <Sparkles class="w-5 h-5 text-amber-500" />
            精华推荐
          </h3>
          <div class="space-y-3">
            <router-link
              v-for="post in essencePosts"
              :key="post.id"
              :to="`/community/${post.id}`"
              class="block no-underline group"
            >
              <div class="flex gap-3 p-2 rounded-lg hover:bg-wood-50 transition-colors">
                <div class="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-wood-200">
                  <img
                    v-if="post.images?.[0]?.url"
                    :src="post.images[0].url"
                    :alt="post.title"
                    class="w-full h-full object-cover"
                  />
                </div>
                <div class="flex-1 min-w-0">
                  <h4 class="text-sm font-medium text-wood-700 line-clamp-2 group-hover:text-wood-500 transition-colors">
                    {{ post.title }}
                  </h4>
                  <div class="flex items-center gap-2 mt-1 text-xs text-wood-400">
                    <span class="flex items-center gap-0.5">
                      <Heart class="w-3 h-3" />
                      {{ post.like_count }}
                    </span>
                    <span class="flex items-center gap-0.5">
                      <MessageCircle class="w-3 h-3" />
                      {{ post.comment_count }}
                    </span>
                  </div>
                </div>
              </div>
            </router-link>
          </div>
        </div>

        <div class="fabric-bg rounded-wood-xl p-4 border border-wood-300">
          <h3 class="font-display text-base font-bold text-wood-700 mb-4 flex items-center gap-2">
            <Users class="w-5 h-5 text-wood-500" />
            社区达人
          </h3>
          <div class="space-y-3">
            <div
              v-for="expert in experts"
              :key="expert.id"
              class="flex items-center gap-3 p-2 rounded-lg hover:bg-wood-50 transition-colors"
            >
              <div class="w-10 h-10 rounded-full bg-wood-400 flex items-center justify-center overflow-hidden flex-shrink-0">
                <img v-if="expert.avatar" :src="expert.avatar" class="w-full h-full object-cover" alt="" />
                <span v-else class="text-sm text-white font-bold">{{ expert.username[0] }}</span>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-1">
                  <span class="text-sm font-medium text-wood-700 truncate">{{ expert.username }}</span>
                  <span v-if="expert.badges?.length" class="text-xs">
                    {{ expert.badges[0] }}
                  </span>
                </div>
                <div class="flex items-center gap-3 text-xs text-wood-400">
                  <span>{{ expert.post_count }} 帖</span>
                  <span>{{ expert.total_likes || 0 }} 获赞</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
