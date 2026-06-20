<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMessagesStore } from '@/stores/messages'
import { User } from 'lucide-vue-next'

const messagesStore = useMessagesStore()
const selectedId = ref<number | null>(null)

onMounted(() => {
  messagesStore.fetchMessages()
})

const messages = computed(() => messagesStore.messages)

const selectedMessage = computed(() => {
  return messages.value.find(m => m.id === selectedId.value) || null
})

function selectMessage(id: number) {
  selectedId.value = id
  const msg = messages.value.find(m => m.id === id)
  if (msg && !msg.is_read) {
    messagesStore.markAsRead(id)
  }
}
</script>

<template>
  <div class="container mx-auto px-4 py-6">
    <h1 class="font-display text-2xl font-bold text-wood-700 mb-6">消息中心</h1>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4" style="min-height: 500px;">
      <div class="fabric-bg rounded-wood-lg border border-wood-300 overflow-hidden">
        <div class="p-3 border-b border-wood-200">
          <h3 class="text-sm font-medium text-wood-600">消息列表</h3>
        </div>
        <div class="overflow-y-auto" style="max-height: 500px;">
          <button
            v-for="msg in messages"
            :key="msg.id"
            @click="selectMessage(msg.id)"
            :class="[
              'w-full text-left p-3 border-b border-wood-200 hover:bg-wood-50 transition-colors',
              selectedId === msg.id ? 'bg-wood-200' : '',
              !msg.is_read ? 'bg-wood-400/5' : ''
            ]"
          >
            <div class="flex items-center gap-2 mb-1">
              <div class="w-8 h-8 rounded-full bg-wood-400 flex items-center justify-center flex-shrink-0">
                <User class="w-4 h-4 text-white" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-wood-700 truncate">{{ msg.from_username }}</span>
                  <span v-if="!msg.is_read" class="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></span>
                </div>
                <p class="text-xs text-wood-500 truncate">{{ msg.content }}</p>
              </div>
            </div>
            <div class="text-xs text-wood-400 ml-10">{{ msg.created_at }}</div>
          </button>
          <div v-if="!messages.length" class="p-8 text-center text-sm text-wood-400">
            暂无消息
          </div>
        </div>
      </div>

      <div class="md:col-span-2 fabric-bg rounded-wood-lg border border-wood-300 p-6">
        <div v-if="selectedMessage">
          <div class="flex items-center gap-3 mb-4 pb-4 border-b border-wood-200">
            <div class="w-10 h-10 rounded-full bg-wood-400 flex items-center justify-center">
              <User class="w-5 h-5 text-white" />
            </div>
            <div>
              <div class="font-medium text-wood-700">{{ selectedMessage.from_username }}</div>
              <div class="text-xs text-wood-400">{{ selectedMessage.created_at }}</div>
            </div>
          </div>
          <div class="bg-wood-50 rounded-wood p-4 mb-4">
            <p class="text-sm text-wood-700 leading-relaxed">{{ selectedMessage.content }}</p>
          </div>
          <div v-if="selectedMessage.trade_id" class="text-sm text-wood-500 mb-4">
            关联交易 #{{ selectedMessage.trade_id }}
          </div>
        </div>
        <div v-else class="flex items-center justify-center h-full">
          <p class="text-wood-400">选择一条消息查看详情</p>
        </div>
      </div>
    </div>
  </div>
</template>
