<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const form = ref({
  email: '',
  password: '',
})

const loading = ref(false)

async function handleLogin() {
  if (!form.value.email || !form.value.password) {
    ElMessage.warning('请填写邮箱和密码')
    return
  }
  loading.value = true
  try {
    await auth.login(form.value.email, form.value.password)
    ElMessage.success('登录成功')
    const redirect = (route.query.redirect as string) || '/'
    router.push(redirect)
  } catch {
    ElMessage.error('登录失败，请检查邮箱和密码')
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
        <p class="text-sm text-wood-500">让材料遇见新灵感</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="text-sm text-wood-600 block mb-1">邮箱</label>
          <el-input v-model="form.email" type="email" placeholder="请输入邮箱" size="large" />
        </div>
        <div>
          <label class="text-sm text-wood-600 block mb-1">密码</label>
          <el-input v-model="form.password" type="password" placeholder="请输入密码" size="large" show-password />
        </div>
        <div class="text-xs text-wood-500 bg-wood-100/50 rounded-lg p-3 border border-wood-200">
          <p class="mb-1"><strong>演示账号：</strong></p>
          <p>邮箱：wang@test.com | 密码：123456</p>
          <p class="mt-1">邮箱：li@test.com | 密码：123456</p>
          <p class="mt-1">邮箱：zhang@test.com | 密码：123456</p>
        </div>
        <button type="submit" :disabled="loading" class="wood-btn w-full text-base !py-3 disabled:opacity-50">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>

      <div class="text-center mt-6">
        <span class="text-sm text-wood-500">还没有账号？</span>
        <router-link to="/register" class="text-sm text-wood-400 hover:text-wood-600 font-medium ml-1 no-underline">立即注册</router-link>
      </div>
    </div>
  </div>
</template>
