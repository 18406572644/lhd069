<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'

const router = useRouter()
const auth = useAuthStore()

const form = ref({
  username: '',
  email: '',
  password: '',
})

const loading = ref(false)

async function handleRegister() {
  if (!form.value.username || !form.value.email || !form.value.password) {
    ElMessage.warning('请填写所有字段')
    return
  }
  loading.value = true
  try {
    await auth.register(form.value.username, form.value.email, form.value.password)
    ElMessage.success('注册成功')
    router.push('/')
  } catch {
    ElMessage.error('注册失败，请稍后重试')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-[80vh] flex items-center justify-center px-4">
    <div class="fabric-bg rounded-wood-xl p-8 wood-shadow-lg border border-wood-300 w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="font-display text-3xl font-black text-wood-700 mb-2">原木集市</h1>
        <p class="text-sm text-wood-500">加入手工材料社区</p>
      </div>

      <form @submit.prevent="handleRegister" class="space-y-4">
        <div>
          <label class="text-sm text-wood-600 block mb-1">用户名</label>
          <el-input v-model="form.username" placeholder="取个好听的名字" size="large" />
        </div>
        <div>
          <label class="text-sm text-wood-600 block mb-1">邮箱</label>
          <el-input v-model="form.email" type="email" placeholder="请输入邮箱" size="large" />
        </div>
        <div>
          <label class="text-sm text-wood-600 block mb-1">密码</label>
          <el-input v-model="form.password" type="password" placeholder="请设置密码" size="large" show-password />
        </div>
        <button type="submit" :disabled="loading" class="wood-btn w-full text-base !py-3 disabled:opacity-50">
          {{ loading ? '注册中...' : '注册' }}
        </button>
      </form>

      <div class="text-center mt-6">
        <span class="text-sm text-wood-500">已有账号？</span>
        <router-link to="/login" class="text-sm text-wood-400 hover:text-wood-600 font-medium ml-1 no-underline">立即登录</router-link>
      </div>
    </div>
  </div>
</template>
