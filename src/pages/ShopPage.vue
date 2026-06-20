<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import MaterialCard from '@/components/MaterialCard.vue'
import { User, Star, Eye, ArrowRightLeft } from 'lucide-vue-next'

const route = useRoute()

const shop = ref({
  id: 10,
  username: '木匠老张',
  avatar: '',
  description: '专注木工手作二十年，擅长榫卯结构和木雕工艺。所有材料均为精挑细选，品质保证。',
  credit_score: 4.8,
  cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cozy%20craft%20workshop%20wooden%20interior&image_size=landscape_16_9',
  view_count: 1256,
  swap_rate: 92,
})

const materials = ref([
  { id: 1, title: '进口榉木板材', price: 68, category: '木质', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beech%20wood%20planks%20craft%20material&image_size=square', canSwap: true, username: '木匠老张' },
  { id: 2, title: '红松木料', price: 45, category: '木质', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=red%20pine%20wood%20lumber%20material&image_size=square', canSwap: true, username: '木匠老张' },
  { id: 3, title: '黑胡桃木板', price: 158, category: '木质', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=black%20walnut%20wood%20board%20craft&image_size=square', canSwap: false, username: '木匠老张' },
  { id: 4, title: '木工胶水套装', price: 25, category: '其他', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=wood%20glue%20set%20craft%20supplies&image_size=square', canSwap: false, username: '木匠老张' },
])
</script>

<template>
  <div>
    <div class="relative h-48 md:h-64 overflow-hidden">
      <img :src="shop.cover" class="w-full h-full object-cover" alt="" />
      <div class="absolute inset-0 bg-gradient-to-t from-wood-800/60 to-transparent"></div>
    </div>

    <div class="container mx-auto px-4 -mt-16 relative z-10">
      <div class="fabric-bg rounded-wood-lg p-6 wood-shadow border border-wood-300 mb-6">
        <div class="flex items-center gap-4">
          <div class="w-20 h-20 rounded-full bg-wood-400 flex items-center justify-center overflow-hidden border-4 border-wood-100 shadow-wood-lg">
            <img v-if="shop.avatar" :src="shop.avatar" class="w-full h-full object-cover" alt="" />
            <User v-else class="w-10 h-10 text-white" />
          </div>
          <div class="flex-1">
            <h1 class="font-display text-2xl font-bold text-wood-700">{{ shop.username }}的手工铺</h1>
            <div class="flex items-center gap-4 mt-1">
              <div class="flex items-center gap-1 text-sm text-wood-500">
                <Star class="w-4 h-4 fill-wood-400 text-wood-400" />
                <span>{{ shop.credit_score }} 信用</span>
              </div>
              <div class="flex items-center gap-1 text-sm text-wood-500">
                <Eye class="w-4 h-4" />
                <span>{{ shop.view_count }} 浏览</span>
              </div>
              <div class="flex items-center gap-1 text-sm text-wood-500">
                <ArrowRightLeft class="w-4 h-4" />
                <span>{{ shop.swap_rate }}% 成功率</span>
              </div>
            </div>
          </div>
        </div>
        <p class="text-sm text-wood-600 mt-4">{{ shop.description }}</p>
      </div>

      <div class="mb-12">
        <h2 class="font-display text-xl font-bold text-wood-700 mb-4 rope-border-bottom pb-2">在售材料</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            v-for="(item, index) in materials"
            :key="item.id"
            :class="['animate-fade-in-up', `stagger-${index + 1}`]"
          >
            <MaterialCard v-bind="item" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
