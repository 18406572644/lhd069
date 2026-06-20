<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()

const form = ref({
  title: '',
  category: '',
  description: '',
  budgetMin: null as number | null,
  budgetMax: null as number | null,
  specs: '',
})

const categoryOptions = ['布料', '线材', '皮具', '花艺', '配件', '蜡烛', '颜料', '工具', '木质', '其他']

async function handleSubmit() {
  if (!form.value.title || !form.value.category) {
    ElMessage.warning('请填写必要信息')
    return
  }
  ElMessage.success('发布成功')
  router.push('/wanted')
}
</script>

<template>
  <div class="container mx-auto px-4 py-6 max-w-3xl">
    <h1 class="font-display text-2xl font-bold text-wood-700 mb-6">发布求购</h1>

    <div class="fabric-bg rounded-wood-lg p-6 wood-shadow border border-wood-300">
      <el-form label-position="top" class="space-y-2" @submit.prevent="handleSubmit">
        <el-form-item label="求购标题">
          <el-input v-model="form.title" placeholder="简单描述你要找什么" />
        </el-form-item>

        <el-form-item label="分类">
          <el-select v-model="form.category" placeholder="选择分类" class="w-full">
            <el-option v-for="cat in categoryOptions" :key="cat" :label="cat" :value="cat" />
          </el-select>
        </el-form-item>

        <el-form-item label="详细描述">
          <el-input v-model="form.description" type="textarea" :rows="4" placeholder="详细描述你需要什么样的材料" />
        </el-form-item>

        <div class="grid grid-cols-2 gap-4">
          <el-form-item label="最低预算 (元)">
            <el-input-number v-model="form.budgetMin" :min="0" class="w-full" />
          </el-form-item>
          <el-form-item label="最高预算 (元)">
            <el-input-number v-model="form.budgetMax" :min="0" class="w-full" />
          </el-form-item>
        </div>

        <el-form-item label="规格要求">
          <el-input v-model="form.specs" type="textarea" :rows="2" placeholder="尺寸、数量、品质等要求" />
        </el-form-item>

        <div class="pt-4">
          <button type="submit" class="wood-btn w-full text-base !py-3">发布求购</button>
        </div>
      </el-form>
    </div>
  </div>
</template>
