<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useMessagesStore } from '@/stores/messages'
import { Bell, Menu, X, User, LogOut, Package, History, Coins } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const messagesStore = useMessagesStore()
const mobileMenuOpen = ref(false)
const userDropdownVisible = ref(false)

const navLinks = [
  { name: '首页', path: '/' },
  { name: '材料市场', path: '/market' },
  { name: '求购', path: '/wanted' },
  { name: '手工作品', path: '/works' },
]

const unreadCount = computed(() => messagesStore.unreadCount)
const isLoggedIn = computed(() => auth.isLoggedIn)
const currentUser = computed(() => auth.user)

const isActive = (path: string) => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

function navigate(path: string) {
  router.push(path)
  mobileMenuOpen.value = false
}

function handleLogout() {
  auth.logout()
  userDropdownVisible.value = false
  router.push('/')
}

onMounted(() => {
  if (auth.isLoggedIn) {
    messagesStore.fetchMessages()
  }
})
</script>

<template>
  <header class="fixed top-0 left-0 right-0 z-50 bg-wood-100/95 backdrop-blur-sm">
    <div class="container mx-auto px-4">
      <div class="flex items-center justify-between h-16">
        <div class="flex items-center gap-8">
          <router-link to="/" class="flex items-center gap-2 no-underline">
            <span class="text-2xl font-display font-black text-wood-700 tracking-wider">原木集市</span>
          </router-link>
          <nav class="hidden md:flex items-center gap-6">
            <button
              v-for="link in navLinks"
              :key="link.path"
              @click="navigate(link.path)"
              :class="[
                'px-3 py-1.5 rounded-wood text-sm font-medium transition-all duration-300',
                isActive(link.path)
                  ? 'bg-wood-400 text-white'
                  : 'text-wood-600 hover:text-wood-700 hover:bg-wood-200'
              ]"
            >
              {{ link.name }}
            </button>
          </nav>
        </div>

        <div class="flex items-center gap-4">
          <button
            v-if="isLoggedIn"
            @click="navigate('/messages')"
            class="relative p-2 rounded-full hover:bg-wood-200 transition-colors"
          >
            <Bell class="w-5 h-5 text-wood-600" />
            <span
              v-if="unreadCount > 0"
              class="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center animate-pulse-glow"
            >
              {{ unreadCount > 9 ? '9+' : unreadCount }}
            </span>
          </button>

          <div v-if="isLoggedIn" class="relative hidden md:block">
            <button
              @click="userDropdownVisible = !userDropdownVisible"
              class="flex items-center gap-2 px-3 py-1.5 rounded-wood hover:bg-wood-200 transition-colors"
            >
              <div class="w-7 h-7 rounded-full bg-wood-400 flex items-center justify-center overflow-hidden">
                <img
                  v-if="currentUser?.avatar"
                  :src="currentUser.avatar"
                  class="w-full h-full object-cover"
                  alt=""
                />
                <User v-else class="w-4 h-4 text-white" />
              </div>
              <span class="text-sm text-wood-700 font-medium">{{ currentUser?.username }}</span>
            </button>
            <div
              v-if="userDropdownVisible"
              class="absolute right-0 mt-2 w-48 bg-wood-100 rounded-wood-lg shadow-wood-lg border border-wood-300 py-1 z-50"
            >
              <button @click="navigate('/profile'); userDropdownVisible = false" class="w-full px-4 py-2 text-left text-sm text-wood-700 hover:bg-wood-200 flex items-center gap-2">
                <User class="w-4 h-4" /> 个人资料
              </button>
              <button @click="navigate('/shop/manage'); userDropdownVisible = false" class="w-full px-4 py-2 text-left text-sm text-wood-700 hover:bg-wood-200 flex items-center gap-2">
                <Package class="w-4 h-4" /> 我的店铺
              </button>
              <button @click="navigate('/footprint'); userDropdownVisible = false" class="w-full px-4 py-2 text-left text-sm text-wood-700 hover:bg-wood-200 flex items-center gap-2">
                <History class="w-4 h-4" /> 我的足迹
              </button>
              <button @click="navigate('/points'); userDropdownVisible = false" class="w-full px-4 py-2 text-left text-sm text-wood-700 hover:bg-wood-200 flex items-center gap-2">
                <Coins class="w-4 h-4" /> 积分中心
              </button>
              <div class="border-t border-wood-300 my-1"></div>
              <button @click="handleLogout" class="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-wood-200 flex items-center gap-2">
                <LogOut class="w-4 h-4" /> 退出登录
              </button>
            </div>
          </div>

          <template v-else>
            <div class="hidden md:flex items-center gap-2">
              <button @click="navigate('/login')" class="wood-btn-outline text-sm !px-4 !py-1.5">登录</button>
              <button @click="navigate('/register')" class="wood-btn text-sm !px-4 !py-1.5">注册</button>
            </div>
          </template>

          <button @click="mobileMenuOpen = !mobileMenuOpen" class="md:hidden p-2 rounded-wood hover:bg-wood-200">
            <X v-if="mobileMenuOpen" class="w-5 h-5 text-wood-700" />
            <Menu v-else class="w-5 h-5 text-wood-700" />
          </button>
        </div>
      </div>
    </div>

    <div class="rope-border-bottom"></div>

    <div
      v-if="mobileMenuOpen"
      class="md:hidden bg-wood-100 border-t border-wood-300 py-4 px-4"
    >
      <nav class="flex flex-col gap-2">
        <button
          v-for="link in navLinks"
          :key="link.path"
          @click="navigate(link.path)"
          :class="[
            'px-4 py-2 rounded-wood text-left text-sm font-medium transition-all',
            isActive(link.path)
              ? 'bg-wood-400 text-white'
              : 'text-wood-600 hover:bg-wood-200'
          ]"
        >
          {{ link.name }}
        </button>
        <div v-if="isLoggedIn" class="border-t border-wood-300 pt-2 mt-2">
          <button @click="navigate('/profile')" class="w-full px-4 py-2 text-left text-sm text-wood-600 hover:bg-wood-200 rounded-wood">个人资料</button>
          <button @click="navigate('/shop/manage')" class="w-full px-4 py-2 text-left text-sm text-wood-600 hover:bg-wood-200 rounded-wood">我的店铺</button>
          <button @click="navigate('/footprint')" class="w-full px-4 py-2 text-left text-sm text-wood-600 hover:bg-wood-200 rounded-wood">我的足迹</button>
          <button @click="navigate('/points')" class="w-full px-4 py-2 text-left text-sm text-wood-600 hover:bg-wood-200 rounded-wood">积分中心</button>
          <button @click="handleLogout" class="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-wood-200 rounded-wood">退出登录</button>
        </div>
        <div v-else class="flex gap-2 pt-2 border-t border-wood-300 mt-2">
          <button @click="navigate('/login')" class="wood-btn-outline text-sm flex-1">登录</button>
          <button @click="navigate('/register')" class="wood-btn text-sm flex-1">注册</button>
        </div>
      </nav>
    </div>
  </header>
</template>
