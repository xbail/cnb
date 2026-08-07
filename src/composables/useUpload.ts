import { ref } from 'vue'
import { useImages } from './useImages'

export interface UploadResult {
  url: string
  name: string
  size: number
  type: string
  key: string
  originalSize?: number
  compressed?: boolean
}

export interface UploadOptions {
  compress?: boolean
  maxWidth?: number
  maxHeight?: number
}

export interface CompressResult {
  file: File
  compressed: boolean
}

const API_BASE = '/api'

function getUploadType(fileName: string): string {
  const ext = fileName.toLowerCase().split('.').pop() || ''
  const videoExts = ['mp4', 'mov', 'mkv', 'webm', 'm4v', '3gp']
  return videoExts.includes(ext) ? 'files' : 'imgs'
}

function isImageFile(file: File): boolean {
  return file.type.startsWith('image/') && !file.type.startsWith('image/gif')
}

async function compressImage(
  file: File,
  maxWidth: number,
  maxHeight: number,
): Promise<CompressResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (e) => {
      const img = new Image()
      img.src = e.target?.result as string
      img.onload = () => {
        let width = img.width
        let height = img.height

        if (width <= maxWidth && height <= maxHeight) {
          resolve({ file, compressed: false })
          return
        }

        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('无法获取 canvas context'))
          return
        }
        ctx.drawImage(img, 0, 0, width, height)

        const keepPng = file.type === 'image/png'
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('图片压缩失败'))
              return
            }
            const ext = keepPng ? 'png' : file.name.toLowerCase().split('.').pop() || 'jpg'
            const type = keepPng ? 'image/png' : file.type || 'image/jpeg'
            const compressedFile = new File([blob], file.name.replace(/\.\w+$/, '.' + ext), {
              type,
            })
            resolve({
              file: compressedFile,
              compressed: true,
            })
          },
          file.type === 'image/png' ? 'image/png' : 'image/jpeg',
          keepPng ? 1 : 0.95,
        )
      }
      img.onerror = () => reject(new Error('图片加载失败'))
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
  })
}

function extractMediaPath(url: string): string {
  if (url.includes('-/imgs/')) {
    return url.split('-/imgs/')[1]
  } else if (url.includes('-/files/')) {
    return url.split('-/files/')[1]
  }
  return url
}

async function signUpload(name: string, size: number): Promise<{ upload_url: string; assets: any; safeFileName: string }> {
  const res = await fetch(
    `${API_BASE}/upload/sign?name=${encodeURIComponent(name)}&size=${size}`,
    { method: 'GET' },
  )

  if (!res.ok) {
    let errorMsg = `获取签名失败: ${res.status}`
    try {
      const data = await res.json()
      errorMsg = data.msg || errorMsg
    } catch {}
    throw new Error(errorMsg)
  }

  const data = await res.json()
  if (data.code !== 0) {
    throw new Error(data.msg || '获取签名失败')
  }
  return data.data
}

async function putWithProgress(uploadUrl: string, file: File, onProgress?: (pct: number) => void): Promise<void> {
  if (onProgress && typeof XMLHttpRequest !== 'undefined') {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', `${API_BASE}/upload/put?upload_url=${encodeURIComponent(uploadUrl)}`)
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100))
        }
      }
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve()
        else reject(new Error(`上传失败: ${xhr.status}`))
      }
      xhr.onerror = () => reject(new Error('上传失败: 网络错误'))
      xhr.send(file)
    })
  }

  const res = await fetch(`${API_BASE}/upload/put?upload_url=${encodeURIComponent(uploadUrl)}`, {
    method: 'POST',
    body: file,
  })
  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`上传失败: ${res.status} ${errText}`)
  }
}

export function useUpload() {
  const uploading = ref(false)
  const progress = ref(0)
  const error = ref('')
  const processing = ref(false)
  const { saveImage } = useImages()

  async function upload(
    file: File,
    options: UploadOptions = {},
  ): Promise<UploadResult | null> {
    const {
      compress = false,
      maxWidth = 1920,
      maxHeight = 1080,
    } = options

    uploading.value = true
    progress.value = 0
    error.value = ''

    try {
      let uploadFile = file
      let originalSize = file.size
      let compressed = false

      if (compress && isImageFile(file)) {
        processing.value = true
        try {
          const result = await compressImage(file, maxWidth, maxHeight)
          uploadFile = result.file
          compressed = result.compressed
        } catch (e) {
          console.warn('[Upload] 压缩失败,使用原图:', e)
        } finally {
          processing.value = false
        }
      }

      progress.value = 5

      const sign = await signUpload(uploadFile.name, uploadFile.size)
      console.log('[Upload] Signed:', sign)

      progress.value = 10
      await putWithProgress(sign.upload_url, uploadFile, (pct) => {
        progress.value = 10 + Math.round(pct * 0.85)
      })

      progress.value = 95

      const baseUrl = window.location.origin
      const mediaPath = extractMediaPath(sign.assets.path)
      const mainUrl = baseUrl + '/img-api/' + mediaPath

      const record = {
        url: mainUrl,
        name: file.name,
        size: uploadFile.size,
        type: getUploadType(file.name) === 'files' ? 'video/' + (file.name.toLowerCase().split('.').pop() || 'mp4') : (uploadFile.type || 'image/jpeg'),
        key: sign.assets.path,
        originalSize,
        compressed,
      }

      saveImage(record)

      progress.value = 100

      return record
    } catch (e) {
      console.error('[Upload] Error:', e)
      error.value = e instanceof Error ? e.message : '上传失败'
      return null
    } finally {
      uploading.value = false
      processing.value = false
    }
  }

  return {
    uploading,
    progress,
    error,
    processing,
    upload,
  }
}