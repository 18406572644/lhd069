<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
</script>

<template>
  <div class="min-h-screen flex flex-col bg-wood-50 font-body">
    <AppHeader />
    <main class="flex-1 pt-16">
      <router-view />
    </main>
    <AppFooter />
  </div>
</template>
