<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { Plus, X, Upload, RefreshCw, GripVertical, AlertCircle } from 'lucide-vue-next'
import { ElMessage } from 'element-plus'
import api from '@/lib/api'
import {
  compressImage,
  validateImageFile,
  fileToDataURL,
  formatFileSize,
  type CompressOptions,
} from '@/lib/imageUtils'

interface UploadImage {
  id: string
  file?: File
  preview: string
  url?: string
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
  abortController?: AbortController
  retryCount: number
}

const props = withDefaults(defineProps<{
  modelValue: string[]
  maxCount?: number
  maxSize?: number
  compress?: boolean
  compressOptions?: CompressOptions
  maxRetry?: number
  sortable?: boolean
}>(), {
  maxCount: 9,
  maxSize: 5 * 1024 * 1024,
  compress: true,
  compressOptions: () => ({ quality: 0.8, maxWidth: 1920, maxHeight: 1920 }),
  maxRetry: 3,
  sortable: true,
})

const emit = defineEmits<{
  'update:modelValue': [urls: string[]]
  'change': [files: string[]]
}>()

const images = ref<UploadImage[]>([])
const isDragover = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const dragIndex = ref<number | null>(null)
const dropIndex = ref<number | null>(null)

const canAddMore = computed(() => images.value.length < props.maxCount)

const successUrls = computed(() =>
  images.value.filter(img => img.status === 'success' && img.url).map(img => img.url!)
)

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

function handlePaste(e: ClipboardEvent) {
  if (!canAddMore.value) return
  const items = e.clipboardData?.items
  if (!items) return

  const imageFiles: File[] = []
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (file) imageFiles.push(file)
    }
  }

  if (imageFiles.length > 0) {
    e.preventDefault()
    addImages(imageFiles)
  }
}

function handleDragEnter(e: DragEvent) {
  e.preventDefault()
  isDragover.value = true
}

function handleDragLeave(e: DragEvent) {
  e.preventDefault()
  isDragover.value = false
}

function handleDrop(e: DragEvent) {
  e.preventDefault()
  isDragover.value = false

  if (!canAddMore.value) {
    ElMessage.warning(`最多只能上传 ${props.maxCount} 张图片`)
    return
  }

  const files = e.dataTransfer?.files
  if (!files || files.length === 0) return

  const imageFiles: File[] = []
  for (let i = 0; i < files.length; i++) {
    if (files[i].type.startsWith('image/')) {
      imageFiles.push(files[i])
    }
  }

  if (imageFiles.length === 0) {
    ElMessage.warning('请拖入的文件中没有图片')
    return
  }

  addImages(imageFiles)
}

async function addImages(files: File[]) {
  const remainingSlots = props.maxCount - images.value.length
  const filesToAdd = files.slice(0, remainingSlots)

  if (files.length > remainingSlots) {
    ElMessage.warning(`最多只能上传 ${props.maxCount} 张图片，已自动截取`)
  }

  for (const file of filesToAdd) {
    const validation = validateImageFile(file)
    if (!validation.valid) {
      ElMessage.error(validation.error || '文件验证失败')
      continue
    }

    const id = generateId()
    const preview = await fileToDataURL(file)

    images.value.push({
      id,
      file,
      preview,
      progress: 0,
      status: 'pending',
      retryCount: 0,
    })

    uploadImage(id)
  }
}

async function uploadImage(id: string) {
  const image = images.value.find(img => img.id === id)
  if (!image || !image.file) return

  image.status = 'uploading'
  image.progress = 0
  image.error = undefined

  const abortController = new AbortController()
  image.abortController = abortController

  try {
    let fileToUpload: Blob = image.file

    if (props.compress && image.file.type !== 'image/svg+xml') {
      fileToUpload = await compressImage(image.file, props.compressOptions)
    }

    const formData = new FormData()
    formData.append('files', fileToUpload, image.file.name)

    const response: any = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      signal: abortController.signal,
      onUploadProgress: (progressEvent: any) => {
        if (progressEvent.total) {
          image.progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        }
      },
    })

    if (response.success && response.data?.urls?.length > 0) {
      image.url = response.data.urls[0]
      image.status = 'success'
      image.progress = 100
      emitUpdate()
    } else {
      throw new Error(response.error || '上传失败')
    }
  } catch (error: any) {
    if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
      image.status = 'error'
      image.error = '上传已取消'
    } else {
      image.status = 'error'
      image.error = error.message || '上传失败，请重试'
    }
  } finally {
    image.abortController = undefined
  }
}

function cancelUpload(id: string) {
  const image = images.value.find(img => img.id === id)
  if (image?.abortController) {
    image.abortController.abort()
  }
}

function retryUpload(id: string) {
  const image = images.value.find(img => img.id === id)
  if (!image) return

  if (image.retryCount >= props.maxRetry) {
    ElMessage.error('重试次数已达上限')
    return
  }

  image.retryCount++
  uploadImage(id)
}

function removeImage(id: string) {
  const index = images.value.findIndex(img => img.id === id)
  if (index === -1) return

  const image = images.value[index]
  if (image.abortController) {
    image.abortController.abort()
  }

  images.value.splice(index, 1)
  emitUpdate()
}

function emitUpdate() {
  const urls = successUrls.value
  emit('update:modelValue', urls)
  emit('change', urls)
}

function triggerFileSelect() {
  fileInputRef.value?.click()
}

function handleFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  const files = target.files
  if (!files || files.length === 0) return

  const fileArray: File[] = []
  for (let i = 0; i < files.length; i++) {
    fileArray.push(files[i])
  }

  addImages(fileArray)

  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

function handleDragStart(e: DragEvent, index: number) {
  if (!props.sortable) return
  dragIndex.value = index
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
  }
}

function handleDragOver(e: DragEvent, index: number) {
  if (!props.sortable) return
  e.preventDefault()
  dropIndex.value = index
}

function handleDragEnd() {
  if (dragIndex.value !== null && dropIndex.value !== null && dragIndex.value !== dropIndex.value) {
    const draggedItem = images.value.splice(dragIndex.value, 1)[0]
    images.value.splice(dropIndex.value, 0, draggedItem)
    emitUpdate()
  }
  dragIndex.value = null
  dropIndex.value = null
}

onMounted(() => {
  document.addEventListener('paste', handlePaste)
})

onBeforeUnmount(() => {
  document.removeEventListener('paste', handlePaste)
})
</script>

<template>
  <div class="image-uploader">
    <div
      class="upload-area"
      :class="{ 'dragover': isDragover }"
      @dragenter="handleDragEnter"
      @dragover="handleDragEnter"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <div class="flex flex-wrap gap-3">
        <div
          v-for="(image, index) in images"
          :key="image.id"
          class="image-item"
          :class="{
            'sortable-item': sortable,
            'dragging': dragIndex === index,
            'drop-target': dropIndex === index && dragIndex !== index,
          }"
          draggable="true"
          @dragstart="handleDragStart($event, index)"
          @dragover="handleDragOver($event, index)"
          @dragend="handleDragEnd"
        >
          <img :src="image.preview" class="w-full h-full object-cover" alt="" />

          <div v-if="sortable" class="drag-handle">
            <GripVertical class="w-4 h-4 text-white" />
          </div>

          <button
            type="button"
            @click.stop="removeImage(image.id)"
            class="remove-btn"
          >
            <X class="w-3 h-3" />
          </button>

          <div v-if="image.status === 'uploading'" class="progress-overlay">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: image.progress + '%' }"></div>
            </div>
            <span class="progress-text">{{ image.progress }}%</span>
            <button
              type="button"
              @click.stop="cancelUpload(image.id)"
              class="cancel-btn"
            >
              取消
            </button>
          </div>

          <div v-if="image.status === 'error'" class="error-overlay">
            <AlertCircle class="w-6 h-6 text-red-400" />
            <p class="text-xs text-red-400 mt-1 text-center px-1">{{ image.error }}</p>
            <button
              type="button"
              @click.stop="retryUpload(image.id)"
              class="retry-btn"
            >
              <RefreshCw class="w-3 h-3" />
              重试
            </button>
          </div>

          <div v-if="image.status === 'success'" class="success-badge">
            <Upload class="w-3 h-3" />
          </div>

          <div v-if="index === 0" class="cover-badge">主图</div>
        </div>

        <div
          v-if="canAddMore"
          class="add-btn"
          @click="triggerFileSelect"
        >
          <Plus class="w-6 h-6 text-wood-400" />
          <span class="text-xs text-wood-500 mt-1">添加图片</span>
        </div>
      </div>

      <input
        ref="fileInputRef"
        type="file"
        accept="image/*"
        multiple
        class="hidden"
        @change="handleFileChange"
      />
    </div>

    <div class="mt-2 text-xs text-wood-500 flex items-center justify-between">
      <span>支持拖拽上传、粘贴上传，最多 {{ maxCount }} 张图片</span>
      <span>{{ images.length }}/{{ maxCount }}</span>
    </div>
  </div>
</template>

<style scoped>
.upload-area {
  min-height: 100px;
  padding: 4px;
  border-radius: 8px;
  border: 2px dashed transparent;
  transition: all 0.2s;
}

.upload-area.dragover {
  border-color: #8b7355;
  background-color: rgba(139, 115, 85, 0.05);
}

.image-item {
  position: relative;
  width: 96px;
  height: 96px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #d4c4a8;
  cursor: default;
  transition: transform 0.2s, opacity 0.2s;
}

.sortable-item {
  cursor: grab;
}

.sortable-item:active {
  cursor: grabbing;
}

.image-item.dragging {
  opacity: 0.5;
  transform: scale(0.95);
}

.image-item.drop-target {
  border-color: #8b7355;
  box-shadow: 0 0 0 2px rgba(139, 115, 85, 0.3);
}

.drag-handle {
  position: absolute;
  top: 4px;
  left: 4px;
  width: 20px;
  height: 20px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
}

.remove-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
}

.remove-btn:hover {
  background: #dc2626;
}

.progress-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.6);
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.progress-bar {
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #22c55e;
  border-radius: 2px;
  transition: width 0.2s;
}

.progress-text {
  font-size: 10px;
  color: white;
  text-align: center;
}

.cancel-btn {
  font-size: 10px;
  color: #fca5a5;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.cancel-btn:hover {
  color: #f87171;
}

.error-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.retry-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #fbbf24;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.2s;
}

.retry-btn:hover {
  background: rgba(251, 191, 36, 0.1);
}

.success-badge {
  position: absolute;
  bottom: 4px;
  left: 4px;
  width: 18px;
  height: 18px;
  background: #22c55e;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-badge {
  position: absolute;
  top: 4px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(139, 115, 85);
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
}

.add-btn {
  width: 96px;
  height: 96px;
  border-radius: 8px;
  border: 2px dashed #d4c4a8;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.2s, background-color 0.2s;
}

.add-btn:hover {
  border-color: #8b7355;
  background-color: rgba(139, 115, 85, 0.05);
}
</style>
