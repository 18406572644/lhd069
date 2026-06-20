<script setup lang="ts">
import { ref } from 'vue'
import WorkCard from '@/components/WorkCard.vue'

const activeTag = ref('')

const tags = ['全部', '木工', '编织', '皮具', '纸艺', '金属', '陶艺', '绘画']

const works = ref([
  { id: 1, title: '手工雕刻木盒', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=handmade%20carved%20wooden%20box%20craft&image_size=portrait_4_3', author: '木匠老张', tags: ['木工', '雕刻'] },
  { id: 2, title: '钩针编织围巾', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=handmade%20knitting%20crochet%20scarf%20craft&image_size=portrait_4_3', author: '编织达人', tags: ['编织', '配饰'] },
  { id: 3, title: '手工皮具钱包', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=handmade%20leather%20wallet%20craft%20stitching&image_size=portrait_4_3', author: '皮革工坊', tags: ['皮具', '手缝'] },
  { id: 4, title: '水彩手绘明信片', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=watercolor%20hand%20painted%20postcard%20art&image_size=portrait_4_3', author: '画意人生', tags: ['绘画', '水彩'] },
  { id: 5, title: '银丝编织戒指', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=silver%20wire%20wrapped%20ring%20handmade%20jewelry&image_size=portrait_4_3', author: '银饰手作', tags: ['金属', '首饰'] },
  { id: 6, title: '手工陶艺花瓶', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=handmade%20ceramic%20vase%20pottery%20craft&image_size=portrait_4_3', author: '泥巴手作', tags: ['陶艺'] },
  { id: 7, title: '折纸艺术装饰', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=origami%20paper%20art%20decoration%20craft&image_size=portrait_4_3', author: '纸艺家', tags: ['纸艺', '折纸'] },
  { id: 8, title: '木制八音盒', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=handmade%20wooden%20music%20box%20craft&image_size=portrait_4_3', author: '匠心工坊', tags: ['木工', '音乐'] },
])
</script>

<template>
  <div class="container mx-auto px-4 py-6">
    <div class="flex items-center justify-between mb-6">
      <h1 class="font-display text-2xl font-bold text-wood-700">手工作品</h1>
      <router-link to="/works/publish" class="wood-btn text-sm no-underline">发布作品</router-link>
    </div>

    <div class="flex gap-2 mb-6 overflow-x-auto pb-2">
      <button
        v-for="tag in tags"
        :key="tag"
        @click="activeTag = tag === '全部' ? '' : tag"
        :class="[
          'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border',
          (tag === '全部' && !activeTag) || activeTag === tag
            ? 'bg-wood-400 text-white border-wood-400'
            : 'bg-wood-100 text-wood-600 border-wood-300 hover:bg-wood-200'
        ]"
      >
        {{ tag }}
      </button>
    </div>

    <div class="columns-2 md:columns-3 lg:columns-4 gap-4">
      <div
        v-for="(work, index) in works"
        :key="work.id"
        :class="['animate-fade-in-up', `stagger-${(index % 8) + 1}`]"
      >
        <WorkCard v-bind="work" />
      </div>
    </div>
  </div>
</template>
