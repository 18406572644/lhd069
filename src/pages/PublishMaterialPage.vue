<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMaterialsStore } from '@/stores/materials'
import { usePointsStore } from '@/stores/points'
import { Plus, Minus, Pin } from 'lucide-vue-next'
import { ElMessage, ElMessageBox } from 'element-plus'
import TagInput from '@/components/TagInput.vue'
import ImageUploader from '@/components/ImageUploader.vue'

const router = useRouter()
const store = useMaterialsStore()
const pointsStore = usePointsStore()

const form = ref({
  title: '',
  category: '',
  description: '',
  price: null as number | null,
  can_swap: false,
  is_pinned: false,
  images: [] as string[],
  specs: [] as { key: string; value: string }[],
  tags: [] as string[],
})

const categoryOptions = ['布料', '线材', '皮具', '花艺', '配件', '蜡烛', '颜料', '工具', '木质', '其他']
const submitting = ref(false)
const canPin = ref(false)

onMounted(async () => {
  await pointsStore.fetchAccount()
  canPin.value = !!pointsStore.account && pointsStore.account.balance >= 80
})

function addSpec() {
  form.value.specs.push({ key: '', value: '' })
}

function removeSpec(index: number) {
  form.value.specs.splice(index, 1)
}

async function handlePinToggle() {
  if (form.value.is_pinned) {
    form.value.is_pinned = false
    return
  }
  if (!pointsStore.account || pointsStore.account.balance < 80) {
    ElMessage.warning('积分余额不足，需要 80 积分兑换置顶功能')
    return
  }
  try {
    await ElMessageBox.confirm(
      '置顶发布将消耗 80 积分，置顶后该材料将在列表中优先展示。确认兑换？',
      '置顶确认',
      { confirmButtonText: '确认兑换', cancelButtonText: '取消', type: 'info' }
    )
    form.value.is_pinned = true
  } catch {
    form.value.is_pinned = false
  }
}

async function handleSubmit() {
  if (!form.value.title || !form.value.category || !form.value.price) {
    ElMessage.warning('请填写必要信息')
    return
  }
  if (form.value.images.length === 0) {
    ElMessage.warning('请至少上传一张图片')
    return
  }
  try {
    submitting.value = true
    const materialData: any = await store.createMaterial({
      title: form.value.title,
      category: form.value.category,
      description: form.value.description,
      price: form.value.price,
      is_swappable: form.value.can_swap,
      images: form.value.images.map(url => ({ url })),
      specs: form.value.specs,
      tags: form.value.tags
    } as any)

    if (form.value.is_pinned && materialData?.id) {
      try {
        await pointsStore.consumePoints(80, 'pin', '置顶发布', materialData.id)
        ElMessage.success('发布成功，已置顶！消耗 80 积分')
      } catch {
        ElMessage.warning('发布成功，但置顶兑换失败')
      }
    } else {
      ElMessage.success('发布成功')
    }
    router.push('/market')
  } catch {
    ElMessage.error('发布失败')
  } finally {
    submitting.value = false
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
          <ImageUploader v-model="form.images" :max-count="9" />
          <p class="text-xs text-wood-500 mt-2">支持 JPG/PNG/GIF/WebP 格式，拖拽可调整主图顺序</p>
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

        <div
          class="flex items-center justify-between p-4 rounded-wood-lg border transition-colors"
          :class="form.is_pinned ? 'bg-amber-50 border-amber-300' : 'bg-wood-50 border-wood-200'"
        >
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-full flex items-center justify-center" :class="form.is_pinned ? 'bg-amber-500' : 'bg-wood-200'">
              <Pin class="w-4 h-4" :class="form.is_pinned ? 'text-white' : 'text-wood-500'" />
            </div>
            <div>
              <div class="text-sm font-medium text-wood-700">置顶发布</div>
              <div class="text-xs text-wood-500">消耗 80 积分，让材料在列表中优先展示</div>
            </div>
          </div>
          <button
            type="button"
            @click="handlePinToggle"
            :class="[
              'px-4 py-1.5 rounded-wood text-xs font-medium transition-all',
              form.is_pinned
                ? 'bg-amber-500 text-white'
                : canPin
                ? 'bg-wood-400 text-white hover:bg-wood-600'
                : 'bg-wood-200 text-wood-400 cursor-not-allowed'
            ]"
            :disabled="!form.is_pinned && !canPin"
          >
            {{ form.is_pinned ? '已选择置顶' : (canPin ? '选择置顶' : '积分不足') }}
          </button>
        </div>

        <div class="pt-4">
          <button type="submit" class="wood-btn w-full text-base !py-3" :disabled="submitting">
            {{ submitting ? '发布中...' : '发布材料' }}
          </button>
        </div>
      </el-form>
    </div>
  </div>
</template>
