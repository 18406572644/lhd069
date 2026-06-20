<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMaterialsStore } from '@/stores/materials'
import { Plus, Minus } from 'lucide-vue-next'
import { ElMessage } from 'element-plus'
import api from '@/lib/api'
import TagInput from '@/components/TagInput.vue'

const router = useRouter()
const store = useMaterialsStore()

const form = ref({
  title: '',
  category: '',
  description: '',
  price: null as number | null,
  can_swap: false,
  images: [] as string[],
  specs: [] as { key: string; value: string }[],
  tags: [] as string[],
})

const categoryOptions = ['布料', '线材', '皮具', '花艺', '配件', '蜡烛', '颜料', '工具', '木质', '其他']
const uploading = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

function addSpec() {
  form.value.specs.push({ key: '', value: '' })
}

function removeSpec(index: number) {
  form.value.specs.splice(index, 1)
}

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
  if (!form.value.title || !form.value.category || !form.value.price) {
    ElMessage.warning('请填写必要信息')
    return
  }
  try {
    await store.createMaterial({
      title: form.value.title,
      category: form.value.category,
      description: form.value.description,
      price: form.value.price,
      is_swappable: form.value.can_swap,
      images: form.value.images.map(url => ({ url })),
      specs: form.value.specs,
      tags: form.value.tags
    } as any)
    ElMessage.success('发布成功')
    router.push('/market')
  } catch {
    ElMessage.error('发布失败')
  }
}
</script>

<template>
  <div class="container mx-auto px-4 py-6 max-w-3xl">
    <h1 class="font-display text-2xl font-bold text-wood-700 mb-6">发布闲置材料</h1>

    <div class="fabric-bg rounded-wood-lg p-6 wood-shadow border border-wood-300">
      <el-form label-position="top" class="space-y-2" @submit.prevent="handleSubmit">
        <el-form-item label="材料名称">
          <el-input v-model="form.title" placeholder="给材料取个好名字" />
        </el-form-item>

        <el-form-item label="分类">
          <el-select v-model="form.category" placeholder="选择分类" class="w-full">
            <el-option v-for="cat in categoryOptions" :key="cat" :label="cat" :value="cat" />
          </el-select>
        </el-form-item>

        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="4" placeholder="详细描述材料的状态、用途等" />
        </el-form-item>

        <div class="grid grid-cols-2 gap-4">
          <el-form-item label="价格 (元)">
            <el-input-number v-model="form.price" :min="0" :step="1" class="w-full" />
          </el-form-item>
          <el-form-item label="可互换">
            <el-switch v-model="form.can_swap" active-text="是" inactive-text="否" />
          </el-form-item>
        </div>

        <el-form-item label="图片">
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

        <el-form-item label="规格参数">
          <div class="space-y-2 w-full">
            <div v-for="(spec, index) in form.specs" :key="index" class="flex gap-2 items-center">
              <el-input v-model="spec.key" placeholder="参数名" class="flex-1" />
              <el-input v-model="spec.value" placeholder="参数值" class="flex-1" />
              <button type="button" @click="removeSpec(index)" class="p-1 text-red-500 hover:text-red-600">
                <Minus class="w-4 h-4" />
              </button>
            </div>
            <button type="button" @click="addSpec" class="text-sm text-wood-600 hover:text-wood-400 flex items-center gap-1">
              <Plus class="w-4 h-4" /> 添加参数
            </button>
          </div>
        </el-form-item>

        <el-form-item label="标签">
          <TagInput v-model="form.tags" :max-tags="5" placeholder="输入自定义标签，回车添加，支持自动补全已有标签" />
        </el-form-item>

        <div class="pt-4">
          <button type="submit" class="wood-btn w-full text-base !py-3">发布材料</button>
        </div>
      </el-form>
    </div>
  </div>
</template>
