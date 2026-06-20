<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '@/lib/api'
import ImageUploader from '@/components/ImageUploader.vue'

const router = useRouter()

const form = ref({
  title: '',
  description: '',
  tags: '',
  images: [] as string[],
})

const submitting = ref(false)

async function handleSubmit() {
  if (!form.value.title) {
    ElMessage.warning('请填写标题')
    return
  }
  if (form.value.images.length === 0) {
    ElMessage.warning('请至少上传一张图片')
    return
  }
  try {
    submitting.value = true
    await api.post('/works', {
      title: form.value.title,
      description: form.value.description,
      tags: form.value.tags,
      images: form.value.images.map(url => ({ url })),
    })
    ElMessage.success('发布成功')
    router.push('/works')
  } catch {
    ElMessage.error('发布失败')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="container mx-auto px-4 py-6 max-w-3xl">
    <h1 class="font-display text-2xl font-bold text-wood-700 mb-6">发布手工作品</h1>

    <div class="fabric-bg rounded-wood-lg p-6 wood-shadow border border-wood-300">
      <el-form label-position="top" class="space-y-2" @submit.prevent="handleSubmit">
        <el-form-item label="作品标题">
          <el-input v-model="form.title" placeholder="给作品取个名字" />
        </el-form-item>

        <el-form-item label="作品描述">
          <el-input v-model="form.description" type="textarea" :rows="4" placeholder="分享你的创作过程和心得" />
        </el-form-item>

        <el-form-item label="标签">
          <el-input v-model="form.tags" placeholder="用逗号分隔，如：木工,雕刻,收纳" />
        </el-form-item>

        <el-form-item label="作品图片">
          <ImageUploader v-model="form.images" :max-count="9" />
          <p class="text-xs text-wood-500 mt-2">支持 JPG/PNG/GIF/WebP 格式，拖拽可调整主图顺序</p>
        </el-form-item>

        <div class="pt-4">
          <button type="submit" class="wood-btn w-full text-base !py-3" :disabled="submitting">
            {{ submitting ? '发布中...' : '发布作品' }}
          </button>
        </div>
      </el-form>
    </div>
  </div>
</template>
