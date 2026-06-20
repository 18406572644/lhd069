<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Plus } from 'lucide-vue-next'
import { ElMessage } from 'element-plus'
import api from '@/lib/api'

const router = useRouter()

const form = ref({
  title: '',
  description: '',
  tags: '',
  images: [] as string[],
})

const uploading = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

function handleRemoveImage(index: number) {
  form.value.images.splice(index, 1)
}

function triggerFileSelect() {
  fileInputRef.value?.click()
}

async function handleFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  const files = target.files
  if (!files || files.length === 0) return

  uploading.value = true
  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const formData = new FormData()
      formData.append('files', file)

      const res: any = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      if (res.success && res.data && res.data.urls && res.data.urls.length > 0) {
        form.value.images.push(res.data.urls[0])
      } else {
        const reader = new FileReader()
        reader.onload = (ev) => {
          form.value.images.push(ev.target?.result as string)
        }
        reader.readAsDataURL(file)
      }
    }
    ElMessage.success('图片上传成功')
  } catch (err) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const reader = new FileReader()
      reader.onload = (ev) => {
        form.value.images.push(ev.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
    ElMessage.warning('使用本地预览模式')
  } finally {
    uploading.value = false
    if (fileInputRef.value) fileInputRef.value.value = ''
  }
}

async function handleSubmit() {
  if (!form.value.title) {
    ElMessage.warning('请填写标题')
    return
  }
  try {
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
          <div class="flex flex-wrap gap-3">
            <div v-for="(img, index) in form.images" :key="index" class="relative w-24 h-24 rounded-wood overflow-hidden border border-wood-300">
              <img :src="img" class="w-full h-full object-cover" alt="" />
              <button
                type="button"
                @click="handleRemoveImage(index)"
                class="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
              >
                ×
              </button>
            </div>
            <input
              ref="fileInputRef"
              type="file"
              accept="image/*"
              multiple
              class="hidden"
              @change="handleFileChange"
            />
            <button
              type="button"
              @click="triggerFileSelect"
              :disabled="uploading"
              class="w-24 h-24 rounded-wood border-2 border-dashed border-wood-300 flex items-center justify-center hover:border-wood-400 transition-colors disabled:opacity-50"
            >
              <Plus v-if="!uploading" class="w-6 h-6 text-wood-400" />
              <span v-else class="text-xs text-wood-400">上传中...</span>
            </button>
          </div>
          <p class="text-xs text-wood-500 mt-2">支持 JPG/PNG/GIF/WebP 格式，最多上传 9 张图片</p>
        </el-form-item>

        <div class="pt-4">
          <button type="submit" class="wood-btn w-full text-base !py-3">发布作品</button>
        </div>
      </el-form>
    </div>
  </div>
</template>
