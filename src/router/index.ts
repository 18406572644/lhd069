import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/pages/HomePage.vue'),
  },
  {
    path: '/market',
    name: 'market',
    component: () => import('@/pages/MarketPage.vue'),
  },
  {
    path: '/market/publish',
    name: 'publishMaterial',
    component: () => import('@/pages/PublishMaterialPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/market/:id',
    name: 'marketDetail',
    component: () => import('@/pages/MarketDetailPage.vue'),
  },
  {
    path: '/wanted',
    name: 'wanted',
    component: () => import('@/pages/WantedPage.vue'),
  },
  {
    path: '/wanted/publish',
    name: 'publishWanted',
    component: () => import('@/pages/PublishWantedPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/wanted/:id',
    name: 'wantedDetail',
    component: () => import('@/pages/WantedDetailPage.vue'),
  },
  {
    path: '/works',
    name: 'works',
    component: () => import('@/pages/WorksPage.vue'),
  },
  {
    path: '/works/publish',
    name: 'publishWork',
    component: () => import('@/pages/PublishWorkPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/works/:id',
    name: 'workDetail',
    component: () => import('@/pages/WorkDetailPage.vue'),
  },
  {
    path: '/shop/:id',
    name: 'shop',
    component: () => import('@/pages/ShopPage.vue'),
  },
  {
    path: '/shop/manage',
    name: 'shopManage',
    component: () => import('@/pages/ShopManagePage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/messages',
    name: 'messages',
    component: () => import('@/pages/MessagesPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/pages/ProfilePage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/LoginPage.vue'),
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/pages/RegisterPage.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach((to, _from, next) => {
  if (to.meta.requiresAuth) {
    const auth = useAuthStore()
    if (!auth.isLoggedIn) {
      next({ name: 'login', query: { redirect: to.fullPath } })
      return
    }
  }
  next()
})

export default router
