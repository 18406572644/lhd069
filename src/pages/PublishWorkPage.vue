<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Plus } from 'lucide-vue-next'
import { ElMessage } from 'element-plus'

const router = useRouter()

const form = ref({
  title: '',
  description: '',
  tags: '',
  images: [] as string[],
})

const mockUploadUrls = [
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=handmade%20craft%20project%20photography&image_size=square',
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=handmade%20woodworking%20project&image_size=square',
]

function handleUpload() {
  const url = mockUploadUrls[Math.floor(Math.random() * mockUploadUrls.length)]
  form.value.images.push(url)
}

function handleRemoveImage(index: number) {
  form.value.images.splice(index, 1)
}

function handleSubmit() {
  if (!form.value.title) {
    ElMessage.warning('请填写标题')
    return
  }
  ElMessage.success('发布成功')
  router.push('/works')
}
</script>

<template>
  <div class="container mx-auto px-4 py-6 max-w-3xl">
    <h1 class="font-display text-2xl font-bold text-wood-700 mb-6">发布手工作品</h1>

    <div class="fabric-bg rounded-wood-lg p-6 wood-shadow border border-wood-300">
      <el-form label-position="top" class="space-y-2">
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
                @click="handleRemoveImage(index)"
                class="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
              >
                ×
              </button>
            </div>
            <button
              @click="handleUpload"
              class="w-24 h-24 rounded-wood border-2 border-dashed border-wood-300 flex items-center justify-center hover:border-wood-400 transition-colors"
            >
              <Plus class="w-6 h-6 text-wood-400" />
            </button>
          </div>
        </el-form-item>

        <div class="pt-4">
          <button @click="handleSubmit" class="wood-btn w-full text-base !py-3">发布作品</button>
        </div>
      </el-form>
    </div>
  </div>
</template>
