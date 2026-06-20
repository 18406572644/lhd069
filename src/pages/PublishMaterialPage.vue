<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMaterialsStore } from '@/stores/materials'
import { Plus, Minus } from 'lucide-vue-next'
import { ElMessage } from 'element-plus'

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
})

const categoryOptions = ['木质', '布艺', '皮具', '编织', '纸艺', '颜料', '金属', '其他']
const uploading = ref(false)

const mockUploadUrls = [
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=wooden%20craft%20material%20photography&image_size=square',
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fabric%20textile%20closeup%20craft&image_size=square',
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=leather%20craft%20material%20closeup&image_size=square',
]

function addSpec() {
  form.value.specs.push({ key: '', value: '' })
}

function removeSpec(index: number) {
  form.value.specs.splice(index, 1)
}

function handleUploadSuccess(_response: any, _uploadFile: any, _uploadFiles: any) {
  const url = mockUploadUrls[Math.floor(Math.random() * mockUploadUrls.length)]
  form.value.images.push(url)
}

function handleRemoveImage(index: number) {
  form.value.images.splice(index, 1)
}

async function handleSubmit() {
  if (!form.value.title || !form.value.category || !form.value.price) {
    ElMessage.warning('请填写必要信息')
    return
  }
  try {
    await store.createMaterial(form.value as any)
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
      <el-form label-position="top" class="space-y-2">
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
                @click="handleRemoveImage(index)"
                class="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
              >
                ×
              </button>
            </div>
            <el-upload
              :show-file-list="false"
              :on-success="handleUploadSuccess"
              action="#"
              :auto-upload="false"
              :on-change="() => handleUploadSuccess(null, null, null)"
              accept="image/*"
            >
              <div class="w-24 h-24 rounded-wood border-2 border-dashed border-wood-300 flex items-center justify-center hover:border-wood-400 transition-colors cursor-pointer">
                <Plus class="w-6 h-6 text-wood-400" />
              </div>
            </el-upload>
          </div>
        </el-form-item>

        <el-form-item label="规格参数">
          <div class="space-y-2 w-full">
            <div v-for="(spec, index) in form.specs" :key="index" class="flex gap-2 items-center">
              <el-input v-model="spec.key" placeholder="参数名" class="flex-1" />
              <el-input v-model="spec.value" placeholder="参数值" class="flex-1" />
              <button @click="removeSpec(index)" class="p-1 text-red-500 hover:text-red-600">
                <Minus class="w-4 h-4" />
              </button>
            </div>
            <button @click="addSpec" class="text-sm text-wood-600 hover:text-wood-400 flex items-center gap-1">
              <Plus class="w-4 h-4" /> 添加参数
            </button>
          </div>
        </el-form-item>

        <div class="pt-4">
          <button @click="handleSubmit" class="wood-btn w-full text-base !py-3">发布材料</button>
        </div>
      </el-form>
    </div>
  </div>
</template>
