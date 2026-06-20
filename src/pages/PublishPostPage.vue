<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { postsApi } from '@/lib/api'
import ImageUploader from '@/components/ImageUploader.vue'
import TagInput from '@/components/TagInput.vue'

const router = useRouter()

const categories = ref<any[]>([])
const form = ref({
  title: '',
  content: '',
  category: '',
  tags: [] as string[],
  images: [] as string[],
})

const submitting = ref(false)

const fetchCategories = async () => {
  try {
    const res: any = await postsApi.getCategories()
    if (res.success) {
      categories.value = res.data
      if (categories.value.length > 0) {
        form.value.category = categories.value[0].value
      }
    }
  } catch (error) {
    console.error('获取分类失败', error)
  }
}

const handleSubmit = async () => {
  if (!form.value.title.trim()) {
    ElMessage.warning('请填写标题')
    return
  }
  if (!form.value.content.trim()) {
    ElMessage.warning('请填写内容')
    return
  }
  if (!form.value.category) {
    ElMessage.warning('请选择分类')
    return
  }
  try {
    submitting.value = true
    const res: any = await postsApi.create({
      title: form.value.title,
      content: form.value.content,
      category: form.value.category,
      tags: form.value.tags,
      images: form.value.images.map((url) => ({ url })),
    })
    if (res.success) {
      ElMessage.success('发布成功')
      router.push(`/community/${res.data.id}`)
    }
  } catch (error) {
    console.error('发布失败', error)
    ElMessage.error('发布失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchCategories()
})
</script>

<template>
  <div class="container mx-auto px-4 py-6 max-w-3xl">
    <div class="flex items-center gap-3 mb-6">
      <button
        @click="router.back()"
        class="p-2 text-wood-500 hover:text-wood-700 hover:bg-wood-100 rounded-lg transition-colors"
      >
        ←
      </button>
      <h1 class="font-display text-2xl font-bold text-wood-700">发布动态</h1>
    </div>

    <div class="fabric-bg rounded-wood-lg p-6 wood-shadow border border-wood-300">
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-wood-700 mb-2">选择分类</label>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            <button
              v-for="cat in categories"
              :key="cat.value"
              type="button"
              @click="form.category = cat.value"
              :class="[
                'flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-300',
                form.category === cat.value
                  ? 'border-wood-500 bg-wood-50 text-wood-700'
                  : 'border-wood-200 bg-white text-wood-500 hover:border-wood-300 hover:bg-wood-50'
              ]"
            >
              <span class="text-2xl mb-1">{{ cat.icon }}</span>
              <span class="text-xs font-medium">{{ cat.label }}</span>
            </button>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-wood-700 mb-2">标题</label>
          <input
            v-model="form.title"
            type="text"
            placeholder="给你的动态取个吸引人的标题..."
            maxlength="100"
            class="w-full px-4 py-3 rounded-lg border border-wood-300 bg-white text-wood-700 placeholder:text-wood-400 focus:outline-none focus:border-wood-500 focus:ring-2 focus:ring-wood-200 transition-all"
          />
          <p class="text-xs text-wood-400 mt-1 text-right">{{ form.title.length }}/100</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-wood-700 mb-2">内容</label>
          <textarea
            v-model="form.content"
            placeholder="分享你的手工心得、教程、打卡记录..."
            rows="8"
            class="w-full px-4 py-3 rounded-lg border border-wood-300 bg-white text-wood-700 placeholder:text-wood-400 focus:outline-none focus:border-wood-500 focus:ring-2 focus:ring-wood-200 transition-all resize-none"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-wood-700 mb-2">添加图片（可选）</label>
          <ImageUploader v-model="form.images" :max-count="9" />
          <p class="text-xs text-wood-500 mt-2">支持 JPG/PNG/GIF/WebP 格式，拖拽可调整顺序</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-wood-700 mb-2">添加标签（可选）</label>
          <TagInput v-model="form.tags" placeholder="输入标签后按回车添加" />
          <p class="text-xs text-wood-500 mt-2">添加相关标签可以让更多人看到你的内容</p>
        </div>

        <div class="flex gap-4 pt-4">
          <button
            type="button"
            @click="router.back()"
            class="flex-1 wood-btn-secondary text-base !py-3"
          >
            取消
          </button>
          <button
            type="submit"
            class="flex-1 wood-btn text-base !py-3"
            :disabled="submitting"
          >
            {{ submitting ? '发布中...' : '发布动态' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
