<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { X, Plus } from 'lucide-vue-next'
import api from '@/lib/api'
import { ElMessage } from 'element-plus'

const props = defineProps<{
  modelValue: string[]
  maxTags?: number
  placeholder?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void
}>()

const maxTags = computed(() => props.maxTags || 5)
const inputValue = ref('')
const suggestions = ref<{ id: number; name: string; use_count: number }[]>([])
const showSuggestions = ref(false)
const debounceTimer = ref<number | null>(null)

const canAdd = computed(() => {
  return props.modelValue.length < maxTags.value
})

function uniqueTags(tags: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const t of tags) {
    const trimmed = t.trim()
    if (trimmed && !seen.has(trimmed.toLowerCase())) {
      seen.add(trimmed.toLowerCase())
      result.push(trimmed)
    }
  }
  return result
}

function addTag(name: string) {
  const trimmed = name.trim()
  if (!trimmed) return
  if (props.modelValue.length >= maxTags.value) {
    ElMessage.warning(`最多只能添加 ${maxTags.value} 个标签`)
    return
  }
  if (props.modelValue.some(t => t.toLowerCase() === trimmed.toLowerCase())) {
    ElMessage.warning('该标签已存在')
    return
  }
  const newValue = [...props.modelValue, trimmed].slice(0, maxTags.value)
  emit('update:modelValue', uniqueTags(newValue))
  inputValue.value = ''
  showSuggestions.value = false
}

function removeTag(index: number) {
  const newValue = [...props.modelValue]
  newValue.splice(index, 1)
  emit('update:modelValue', newValue)
}

function handleInput() {
  if (debounceTimer.value) {
    clearTimeout(debounceTimer.value)
  }
  const value = inputValue.value.trim()
  if (!value) {
    suggestions.value = []
    showSuggestions.value = false
    return
  }
  debounceTimer.value = window.setTimeout(async () => {
    try {
      const res: any = await api.get('/tags/suggest', { params: { keyword: value, limit: 10 } })
      suggestions.value = (res.data || []).filter(
        (s: { name: string }) => !props.modelValue.some(t => t.toLowerCase() === s.name.toLowerCase())
      )
      showSuggestions.value = suggestions.value.length > 0
    } catch {
      suggestions.value = []
    }
  }, 200)
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    if (inputValue.value.trim()) {
      addTag(inputValue.value)
    }
  } else if (e.key === 'Backspace' && !inputValue.value && props.modelValue.length > 0) {
    removeTag(props.modelValue.length - 1)
  }
}

function selectSuggestion(s: { name: string }) {
  addTag(s.name)
}

function handleBlur() {
  window.setTimeout(() => {
    showSuggestions.value = false
  }, 150)
}

watch(() => props.modelValue, () => {
  const filtered = uniqueTags(props.modelValue).slice(0, maxTags.value)
  if (filtered.length !== props.modelValue.length || filtered.some((t, i) => t !== props.modelValue[i])) {
    emit('update:modelValue', filtered)
  }
}, { deep: true })
</script>

<template>
  <div class="tag-input-wrapper">
    <div class="flex flex-wrap gap-2 p-2 rounded-wood border border-wood-300 bg-wood-100 min-h-[42px] focus-within:border-wood-400 transition-colors">
      <span
        v-for="(tag, index) in modelValue"
        :key="tag"
        class="inline-flex items-center gap-1 px-2.5 py-1 bg-wood-400/20 text-wood-700 text-sm rounded-full"
      >
        {{ tag }}
        <button
          type="button"
          @click="removeTag(index)"
          class="w-4 h-4 rounded-full hover:bg-wood-500/30 flex items-center justify-center text-wood-600 transition-colors"
        >
          <X class="w-3 h-3" />
        </button>
      </span>
      <input
        v-if="canAdd"
        v-model="inputValue"
        @input="handleInput"
        @keydown="handleKeydown"
        @focus="handleInput"
        @blur="handleBlur"
        :placeholder="modelValue.length === 0 ? (placeholder || '输入标签，回车添加，最多5个') : ''"
        class="flex-1 min-w-[100px] bg-transparent border-none outline-none text-wood-700 placeholder:text-wood-400 text-sm py-0.5"
      />
      <button
        v-if="!canAdd"
        type="button"
        disabled
        class="text-xs text-wood-400 self-center"
      >
        已达上限 ({{ maxTags }})
      </button>
    </div>
    <div
      v-if="showSuggestions && suggestions.length > 0"
      class="mt-1 p-1 rounded-wood border border-wood-300 bg-white wood-shadow max-h-48 overflow-y-auto z-10"
    >
      <button
        v-for="s in suggestions"
        :key="s.id"
        type="button"
        @mousedown.prevent="selectSuggestion(s)"
        class="w-full text-left px-3 py-2 text-sm text-wood-700 hover:bg-wood-200 rounded-wood flex items-center justify-between transition-colors"
      >
        <span class="flex items-center gap-2">
          <Plus class="w-3.5 h-3.5 text-wood-400" />
          {{ s.name }}
        </span>
        <span class="text-xs text-wood-400">{{ s.use_count }} 次使用</span>
      </button>
    </div>
    <p class="text-xs text-wood-500 mt-1.5">
      已添加 {{ modelValue.length }}/{{ maxTags }} 个标签，按回车确认添加
    </p>
  </div>
</template>
