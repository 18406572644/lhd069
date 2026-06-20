import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/lib/api'

interface User {
  id: number
  username: string
  email: string
  avatar?: string
  credit_score?: number
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const user = ref<User | null>(null)
  const isLoggedIn = computed(() => !!token.value)

  async function login(email: string, password: string) {
    const res: any = await api.post('/auth/login', { email, password })
    token.value = res.data.token
    localStorage.setItem('token', res.data.token)
    user.value = res.data.user
    return res
  }

  async function register(username: string, email: string, password: string) {
    const res: any = await api.post('/auth/register', { username, email, password })
    token.value = res.data.token
    localStorage.setItem('token', res.data.token)
    user.value = res.data.user
    return res
  }

  async function fetchUser() {
    if (!token.value) return
    try {
      const res: any = await api.get('/auth/me')
      user.value = res.data
    } catch {
      logout()
    }
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return {
    token,
    user,
    isLoggedIn,
    login,
    register,
    fetchUser,
    logout,
  }
})
