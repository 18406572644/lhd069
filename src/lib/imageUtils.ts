export interface CompressOptions {
  quality?: number
  maxWidth?: number
  maxHeight?: number
  mimeType?: string
}

export interface ImageInfo {
  width: number
  height: number
  size: number
  type: string
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
const MAX_FILE_SIZE = 5 * 1024 * 1024

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: '不支持的文件格式，请上传 JPG、PNG、GIF、WebP 或 SVG 图片' }
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `文件过大，最大支持 ${MAX_FILE_SIZE / 1024 / 1024}MB` }
  }
  return { valid: true }
}

export function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function getImageInfo(file: File): Promise<ImageInfo> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
        size: file.size,
        type: file.type,
      })
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

export function compressImage(file: File, options: CompressOptions = {}): Promise<Blob> {
  const {
    quality = 0.8,
    maxWidth = 1920,
    maxHeight = 1920,
    mimeType,
  } = options

  return new Promise((resolve, reject) => {
    if (file.type === 'image/svg+xml') {
      resolve(file)
      return
    }

    const img = new Image()
    img.onload = () => {
      let { width, height } = img

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('无法创建 canvas 上下文'))
        return
      }

      ctx.drawImage(img, 0, 0, width, height)

      const outputType = mimeType || file.type || 'image/jpeg'
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('图片压缩失败'))
          }
        },
        outputType,
        quality
      )

      URL.revokeObjectURL(img.src)
    }
    img.onerror = () => {
      reject(new Error('图片加载失败'))
    }
    img.src = URL.createObjectURL(file)
  })
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / 1024 / 1024).toFixed(2)}MB`
}
