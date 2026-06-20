<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { postsApi } from '@/lib/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import ImageGallery from '@/components/ImageGallery.vue'
import TagCloud from '@/components/TagCloud.vue'
import Empty from '@/components/Empty.vue'
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Sparkles,
  Flag,
  Eye,
  Send,
  Trash2,
  ThumbsUp,
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const postId = ref(parseInt(route.params.id as string))
const loading = ref(false)
const commentsLoading = ref(false)
const post = ref<any>(null)
const comments = ref<any[]>([])
const commentContent = ref('')
const replyingTo = ref<any>(null)
const reportDialogVisible = ref(false)
const reportReason = ref('')
const reportDescription = ref('')
const reportReasons = ref<any[]>([])
const reportTargetType = ref<'post' | 'comment'>('post')
const reportTargetId = ref(0)

const categoryMap: Record<string, { label: string; icon: string }> = {
  tutorial: { label: '手工教程', icon: '📚' },
  showcase: { label: '作品展示', icon: '🎨' },
  review: { label: '材料测评', icon: '⭐' },
  diary: { label: '打卡日记', icon: '📝' },
  qa: { label: '求助问答', icon: '❓' },
}

const fetchPost = async () => {
  loading.value = true
  try {
    const res: any = await postsApi.getDetail(postId.value)
    if (res.success) {
      post.value = res.data
    }
  } catch (error) {
    console.error('获取帖子详情失败', error)
  } finally {
    loading.value = false
  }
}

const fetchComments = async () => {
  commentsLoading.value = true
  try {
    const res: any = await postsApi.getComments(postId.value)
    if (res.success) {
      comments.value = res.data.items
    }
  } catch (error) {
    console.error('获取评论失败', error)
  } finally {
    commentsLoading.value = false
  }
}

const fetchReportReasons = async () => {
  try {
    const res: any = await postsApi.getReportReasons()
    if (res.success) {
      reportReasons.value = res.data
    }
  } catch (error) {
    console.error('获取举报原因失败', error)
  }
}

const handleLike = async () => {
  if (!auth.isLoggedIn) {
    router.push('/login')
    return
  }
  try {
    const res: any = await postsApi.like(postId.value)
    if (res.success) {
      post.value.is_liked = res.data.liked
      post.value.like_count = res.data.like_count
    }
  } catch (error) {
    console.error('点赞失败', error)
  }
}

const handleFavorite = async () => {
  if (!auth.isLoggedIn) {
    router.push('/login')
    return
  }
  try {
    const res: any = await postsApi.favorite(postId.value)
    if (res.success) {
      post.value.is_favorited = res.data.favorited
      post.value.favorite_count = res.data.favorite_count
      ElMessage.success(res.data.favorited ? '已收藏' : '已取消收藏')
    }
  } catch (error) {
    console.error('收藏失败', error)
  }
}

const handleShare = async () => {
  try {
    const url = window.location.href
    await navigator.clipboard.writeText(url)
    ElMessage.success('链接已复制到剪贴板')
    await postsApi.share(postId.value, 'link')
    post.value.share_count += 1
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

const handleSubmitComment = async () => {
  if (!auth.isLoggedIn) {
    router.push('/login')
    return
  }
  if (!commentContent.value.trim()) {
    ElMessage.warning('请输入评论内容')
    return
  }
  try {
    const data: any = { content: commentContent.value }
    if (replyingTo.value) {
      data.parent_id = replyingTo.value.id
    }
    const res: any = await postsApi.addComment(postId.value, data)
    if (res.success) {
      if (replyingTo.value) {
        const parentComment = comments.value.find((c) => c.id === replyingTo.value.id)
        if (parentComment) {
          parentComment.replies = parentComment.replies || []
          parentComment.replies.push(res.data)
        }
      } else {
        comments.value.unshift({ ...res.data, replies: [], is_liked: false })
      }
      post.value.comment_count += 1
      commentContent.value = ''
      replyingTo.value = null
      ElMessage.success('评论成功')
    }
  } catch (error) {
    console.error('评论失败', error)
  }
}

const handleLikeComment = async (comment: any) => {
  if (!auth.isLoggedIn) {
    router.push('/login')
    return
  }
  try {
    const res: any = await postsApi.likeComment(comment.id)
    if (res.success) {
      comment.is_liked = res.data.liked
      comment.like_count = res.data.like_count
    }
  } catch (error) {
    console.error('点赞评论失败', error)
  }
}

const handleDeleteComment = async (comment: any) => {
  try {
    await ElMessageBox.confirm('确定要删除这条评论吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    const res: any = await postsApi.deleteComment(comment.id)
    if (res.success) {
      comments.value = comments.value.filter((c) => c.id !== comment.id)
      post.value.comment_count -= 1
      ElMessage.success('删除成功')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除评论失败', error)
    }
  }
}

const handleDeletePost = async () => {
  try {
    await ElMessageBox.confirm('确定要删除这篇帖子吗？此操作不可恢复。', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    const res: any = await postsApi.delete(postId.value)
    if (res.success) {
      ElMessage.success('删除成功')
      router.push('/community')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除帖子失败', error)
    }
  }
}

const openReportDialog = (targetType: 'post' | 'comment', targetId: number) => {
  if (!auth.isLoggedIn) {
    router.push('/login')
    return
  }
  reportTargetType.value = targetType
  reportTargetId.value = targetId
  reportReason.value = ''
  reportDescription.value = ''
  reportDialogVisible.value = true
}

const handleReport = async () => {
  if (!reportReason.value) {
    ElMessage.warning('请选择举报原因')
    return
  }
  try {
    let res: any
    if (reportTargetType.value === 'post') {
      res = await postsApi.reportPost(reportTargetId.value, {
        reason: reportReason.value,
        description: reportDescription.value,
      })
    } else {
      res = await postsApi.reportComment(reportTargetId.value, {
        reason: reportReason.value,
        description: reportDescription.value,
      })
    }
    if (res.success) {
      ElMessage.success('举报已提交，我们会尽快处理')
      reportDialogVisible.value = false
    }
  } catch (error) {
    console.error('举报失败', error)
  }
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const startReply = (comment: any) => {
  if (!auth.isLoggedIn) {
    router.push('/login')
    return
  }
  replyingTo.value = comment
  commentContent.value = `@${comment?.username || ''} `
}

const cancelReply = () => {
  replyingTo.value = null
  commentContent.value = ''
}

const goToTag = (tagName: string) => {
  router.push({ name: 'tagDetail', params: { name: tagName } })
}

onMounted(() => {
  fetchPost()
  fetchComments()
  fetchReportReasons()
})
</script>

<template>
  <div class="container mx-auto px-4 py-6">
    <div v-if="loading" class="text-center py-12 text-wood-500">
      加载中...
    </div>

    <div v-else-if="!post" class="text-center py-12">
      <Empty description="帖子不存在或已被删除" />
    </div>

    <div v-else class="flex flex-col lg:flex-row gap-6">
      <div class="flex-1">
        <div class="fabric-bg rounded-wood-xl p-6 mb-6 border border-wood-300">
          <div class="flex items-center gap-2 mb-4">
            <span class="bg-wood-100 text-wood-600 px-3 py-1 rounded-full text-sm flex items-center gap-1">
              <span>{{ categoryMap[post.category]?.icon }}</span>
              <span>{{ categoryMap[post.category]?.label }}</span>
            </span>
            <span
              v-if="post.is_essence"
              class="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1"
            >
              <Sparkles class="w-4 h-4" />
              精华
            </span>
          </div>

          <h1 class="font-display text-2xl font-bold text-wood-700 mb-4">{{ post.title }}</h1>

          <div class="flex items-center justify-between mb-6 pb-6 border-b border-wood-200">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-full bg-wood-400 flex items-center justify-center overflow-hidden">
                <img v-if="post.avatar" :src="post.avatar" class="w-full h-full object-cover" alt="" />
                <span v-else class="text-lg text-white font-bold">{{ post.username?.[0] || '?' }}</span>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-medium text-wood-700">{{ post.username }}</span>
                  <span
                    v-for="badge in post.user_badges"
                    :key="badge.name"
                    :title="badge.name"
                    class="text-lg"
                  >
                    {{ badge.icon }}
                  </span>
                </div>
                <div class="flex items-center gap-3 text-xs text-wood-400">
                  <span>{{ formatDate(post.created_at) }}</span>
                  <span class="flex items-center gap-1">
                    <Eye class="w-3 h-3" />
                    {{ post.view_count }}
                  </span>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button
                v-if="auth.user?.id === post.user_id"
                @click="handleDeletePost"
                class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="删除帖子"
              >
                <Trash2 class="w-5 h-5" />
              </button>
              <button
                @click="openReportDialog('post', post.id)"
                class="p-2 text-wood-400 hover:text-wood-600 hover:bg-wood-50 rounded-lg transition-colors"
                title="举报"
              >
                <Flag class="w-5 h-5" />
              </button>
            </div>
          </div>

          <div v-if="post.images?.length" class="mb-6">
            <ImageGallery :images="post.images.map((img: any) => img.url)" />
          </div>

          <div class="prose prose-wood max-w-none mb-6">
            <p class="text-wood-700 whitespace-pre-wrap leading-relaxed">{{ post.content }}</p>
          </div>

          <div v-if="post.tags?.length" class="mb-6">
            <TagCloud :tags="post.tags.map((t: any) => t.name)" @click="goToTag" />
          </div>

          <div class="flex items-center justify-between pt-6 border-t border-wood-200">
            <div class="flex items-center gap-6">
              <button
                @click="handleLike"
                :class="[
                  'flex items-center gap-2 transition-all duration-300',
                  post.is_liked ? 'text-red-500' : 'text-wood-500 hover:text-red-500'
                ]"
              >
                <Heart :class="['w-5 h-5', post.is_liked ? 'fill-current' : '']" />
                <span class="font-medium">{{ post.like_count }}</span>
              </button>
              <button
                @click="handleFavorite"
                :class="[
                  'flex items-center gap-2 transition-all duration-300',
                  post.is_favorited ? 'text-amber-500' : 'text-wood-500 hover:text-amber-500'
                ]"
              >
                <Bookmark :class="['w-5 h-5', post.is_favorited ? 'fill-current' : '']" />
                <span class="font-medium">{{ post.favorite_count }}</span>
              </button>
              <div class="flex items-center gap-2 text-wood-500">
                <MessageCircle class="w-5 h-5" />
                <span class="font-medium">{{ post.comment_count }}</span>
              </div>
              <button
                @click="handleShare"
                class="flex items-center gap-2 text-wood-500 hover:text-wood-700 transition-all duration-300"
              >
                <Share2 class="w-5 h-5" />
                <span class="font-medium">{{ post.share_count || 0 }}</span>
              </button>
            </div>
          </div>
        </div>

        <div class="fabric-bg rounded-wood-xl p-6 mb-6 border border-wood-300">
          <h2 class="font-display text-lg font-bold text-wood-700 mb-4 flex items-center gap-2">
            <MessageCircle class="w-5 h-5 text-wood-500" />
            评论 ({{ post.comment_count }})
          </h2>

          <div class="mb-6">
            <div v-if="replyingTo" class="flex items-center gap-2 mb-2 text-sm text-wood-500">
              <span>回复 @{{ replyingTo?.username }}</span>
              <button @click="cancelReply" class="text-wood-400 hover:text-wood-600">
                取消
              </button>
            </div>
            <div class="flex gap-3">
              <div class="w-10 h-10 rounded-full bg-wood-400 flex items-center justify-center overflow-hidden flex-shrink-0">
                <img v-if="auth.user?.avatar" :src="auth.user.avatar" class="w-full h-full object-cover" alt="" />
                <span v-else class="text-sm text-white font-bold">
                  {{ auth.isLoggedIn ? (auth.user?.username?.[0] || '?') : '?' }}
                </span>
              </div>
              <div class="flex-1">
                <textarea
                  v-model="commentContent"
                  :placeholder="auth.isLoggedIn ? '说点什么...' : '请先登录后评论'"
                  class="w-full p-3 rounded-lg border border-wood-300 bg-white text-wood-700 placeholder:text-wood-400 focus:outline-none focus:border-wood-500 resize-none"
                  rows="3"
                  :disabled="!auth.isLoggedIn"
                />
                <div class="flex justify-end mt-2">
                  <button
                    @click="handleSubmitComment"
                    :disabled="!auth.isLoggedIn || !commentContent.trim()"
                    class="wood-btn text-sm flex items-center gap-1 disabled:opacity-50"
                  >
                    <Send class="w-4 h-4" />
                    发布评论
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div v-if="commentsLoading" class="text-center py-8 text-wood-500">
            加载评论中...
          </div>

          <div v-else-if="comments.length === 0" class="py-8">
            <Empty description="暂无评论，快来抢沙发吧~" />
          </div>

          <div v-else class="space-y-6">
            <div
              v-for="comment in comments"
              :key="comment.id"
              class="pb-6 border-b border-wood-100 last:border-0 last:pb-0"
            >
              <div class="flex gap-3">
                <div class="w-10 h-10 rounded-full bg-wood-400 flex items-center justify-center overflow-hidden flex-shrink-0">
                <img v-if="comment.avatar" :src="comment.avatar" class="w-full h-full object-cover" alt="" />
                <span v-else class="text-sm text-white font-bold">{{ comment.username?.[0] || '?' }}</span>
              </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between mb-1">
                    <span class="font-medium text-wood-700">{{ comment.username }}</span>
                    <span class="text-xs text-wood-400">{{ formatDate(comment.created_at) }}</span>
                  </div>
                  <p class="text-wood-600 mb-2 leading-relaxed">{{ comment.content }}</p>
                  <div class="flex items-center gap-4">
                    <button
                      @click="handleLikeComment(comment)"
                      :class="[
                        'flex items-center gap-1 text-xs transition-colors',
                        comment.is_liked ? 'text-red-500' : 'text-wood-400 hover:text-red-500'
                      ]"
                    >
                      <ThumbsUp :class="['w-3.5 h-3.5', comment.is_liked ? 'fill-current' : '']" />
                      <span>{{ comment.like_count }}</span>
                    </button>
                    <button
                      @click="startReply(comment)"
                      class="flex items-center gap-1 text-xs text-wood-400 hover:text-wood-600 transition-colors"
                    >
                      <MessageCircle class="w-3.5 h-3.5" />
                      <span>回复</span>
                    </button>
                    <button
                      @click="openReportDialog('comment', comment.id)"
                      class="flex items-center gap-1 text-xs text-wood-400 hover:text-wood-600 transition-colors"
                    >
                      <Flag class="w-3.5 h-3.5" />
                      <span>举报</span>
                    </button>
                    <button
                      v-if="auth.user?.id === comment.user_id"
                      @click="handleDeleteComment(comment)"
                      class="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 class="w-3.5 h-3.5" />
                      <span>删除</span>
                    </button>
                  </div>

                  <div v-if="comment.replies?.length" class="mt-4 pl-4 border-l-2 border-wood-200 space-y-4">
                    <div
                      v-for="reply in comment.replies"
                      :key="reply.id"
                      class="flex gap-3"
                    >
                      <div class="w-8 h-8 rounded-full bg-wood-400 flex items-center justify-center overflow-hidden flex-shrink-0">
                        <img v-if="reply.avatar" :src="reply.avatar" class="w-full h-full object-cover" alt="" />
                        <span v-else class="text-xs text-white font-bold">{{ reply.username?.[0] || '?' }}</span>
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between mb-1">
                          <span class="font-medium text-sm text-wood-700">{{ reply.username }}</span>
                          <span class="text-xs text-wood-400">{{ formatDate(reply.created_at) }}</span>
                        </div>
                        <p class="text-sm text-wood-600 mb-1">{{ reply.content }}</p>
                        <div class="flex items-center gap-4">
                          <button
                            @click="handleLikeComment(reply)"
                            :class="[
                              'flex items-center gap-1 text-xs transition-colors',
                              reply.is_liked ? 'text-red-500' : 'text-wood-400 hover:text-red-500'
                            ]"
                          >
                            <ThumbsUp :class="['w-3 h-3', reply.is_liked ? 'fill-current' : '']" />
                            <span>{{ reply.like_count }}</span>
                          </button>
                          <button
                            @click="startReply(reply)"
                            class="text-xs text-wood-400 hover:text-wood-600 transition-colors"
                          >
                            回复
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="lg:w-80">
        <div v-if="post.related_materials?.length" class="fabric-bg rounded-wood-xl p-4 mb-6 border border-wood-300">
          <h3 class="font-display text-base font-bold text-wood-700 mb-4">相关材料</h3>
          <div class="space-y-3">
            <router-link
              v-for="material in post.related_materials"
              :key="material.id"
              :to="`/market/${material.id}`"
              class="block no-underline group"
            >
              <div class="flex gap-3 p-2 rounded-lg hover:bg-wood-50 transition-colors">
                <div class="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-wood-200">
                  <img
                    v-if="material.cover_image"
                    :src="material.cover_image"
                    :alt="material.title"
                    class="w-full h-full object-cover"
                  />
                </div>
                <div class="flex-1 min-w-0">
                  <h4 class="text-sm font-medium text-wood-700 line-clamp-2 group-hover:text-wood-500 transition-colors">
                    {{ material.title }}
                  </h4>
                  <p class="text-sm text-amber-600 font-medium mt-1">¥{{ material.price }}</p>
                </div>
              </div>
            </router-link>
          </div>
        </div>

        <div v-if="post.related_works?.length" class="fabric-bg rounded-wood-xl p-4 mb-6 border border-wood-300">
          <h3 class="font-display text-base font-bold text-wood-700 mb-4">相关作品</h3>
          <div class="space-y-3">
            <router-link
              v-for="work in post.related_works"
              :key="work.id"
              :to="`/works/${work.id}`"
              class="block no-underline group"
            >
              <div class="flex gap-3 p-2 rounded-lg hover:bg-wood-50 transition-colors">
                <div class="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-wood-200">
                  <img
                    v-if="work.cover_image"
                    :src="work.cover_image"
                    :alt="work.title"
                    class="w-full h-full object-cover"
                  />
                </div>
                <div class="flex-1 min-w-0">
                  <h4 class="text-sm font-medium text-wood-700 line-clamp-2 group-hover:text-wood-500 transition-colors">
                    {{ work.title }}
                  </h4>
                </div>
              </div>
            </router-link>
          </div>
        </div>

        <div class="fabric-bg rounded-wood-xl p-4 border border-wood-300">
          <h3 class="font-display text-base font-bold text-wood-700 mb-4">关于作者</h3>
          <div class="flex items-center gap-3 mb-4">
            <div class="w-14 h-14 rounded-full bg-wood-400 flex items-center justify-center overflow-hidden">
              <img v-if="post.avatar" :src="post.avatar" class="w-full h-full object-cover" alt="" />
              <span v-else class="text-xl text-white font-bold">{{ post.username?.[0] || '?' }}</span>
            </div>
            <div>
              <div class="flex items-center gap-1">
                <span class="font-medium text-wood-700">{{ post.username }}</span>
                <span
                  v-for="badge in post.user_badges"
                  :key="badge.name"
                  :title="badge.name"
                  class="text-lg"
                >
                  {{ badge.icon }}
                </span>
              </div>
              <p class="text-xs text-wood-400">积分 {{ post.credit_score }}</p>
            </div>
          </div>
          <p v-if="post.user_bio" class="text-sm text-wood-600 leading-relaxed">
            {{ post.user_bio }}
          </p>
        </div>
      </div>
    </div>

    <el-dialog
      v-model="reportDialogVisible"
      title="举报"
      width="400px"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-wood-700 mb-2">举报原因</label>
          <div class="space-y-2">
            <label
              v-for="reason in reportReasons"
              :key="reason.value"
              class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-wood-50 transition-colors"
            >
              <input
                type="radio"
                v-model="reportReason"
                :value="reason.value"
                class="w-4 h-4 text-wood-600"
              />
              <span class="text-sm text-wood-700">{{ reason.label }}</span>
            </label>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-wood-700 mb-2">补充说明（可选）</label>
          <textarea
            v-model="reportDescription"
            placeholder="请输入详细描述..."
            class="w-full p-3 rounded-lg border border-wood-300 bg-white text-wood-700 placeholder:text-wood-400 focus:outline-none focus:border-wood-500 resize-none"
            rows="3"
          />
        </div>
      </div>
      <template #footer>
        <button @click="reportDialogVisible = false" class="wood-btn-secondary text-sm">
          取消
        </button>
        <button @click="handleReport" class="wood-btn text-sm">
          提交举报
        </button>
      </template>
    </el-dialog>
  </div>
</template>
