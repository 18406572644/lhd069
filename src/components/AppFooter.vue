<script setup lang="ts">
</script>

<template>
  <footer class="bg-wood-100 rope-border-top mt-auto">
    <div class="container mx-auto px-4 py-8">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 class="font-display text-xl font-bold text-wood-700 mb-3">原木集市</h3>
          <p class="text-sm text-wood-600 leading-relaxed">让材料遇见新灵感，让手工传递温度。原木集市致力于为手工爱好者搭建材料互换与闲置交易的平台。</p>
        </div>
        <div>
          <h4 class="font-display text-base font-bold text-wood-700 mb-3">快速导航</h4>
          <div class="flex flex-col gap-2">
            <router-link to="/market" class="text-sm text-wood-600 hover:text-wood-400 transition-colors no-underline">材料市场</router-link>
            <router-link to="/wanted" class="text-sm text-wood-600 hover:text-wood-400 transition-colors no-underline">求购专区</router-link>
            <router-link to="/works" class="text-sm text-wood-600 hover:text-wood-400 transition-colors no-underline">手工作品</router-link>
          </div>
        </div>
        <div>
          <h4 class="font-display text-base font-bold text-wood-700 mb-3">关于我们</h4>
          <p class="text-sm text-wood-600 leading-relaxed">原木集市秉承环保、分享的理念，让每一份材料都能找到新的归宿。</p>
        </div>
      </div>
      <div class="mt-8 pt-4 border-t border-wood-300 text-center">
        <p class="text-xs text-wood-500">© 2026 原木集市 · 让材料遇见新灵感</p>
      </div>
    </div>
  </footer>
</template>
