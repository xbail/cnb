import { ref } from 'vue'
import { useImages } from './useImages'

export interface UploadResult {
  url: string
  thumbnailUrl?: string
  name: string
  size: number
  type: string
  hasThumbnail?: boolean
  thumbnailWidth?: number
  thumbnailHeight?: number
  thumbnailSize?: number
}

export interface UploadOptions {
  generateThumbnail?: boolean
  thumbnailMaxWidth?: number
  thumbnailMaxHeight?: number
  thumbnailQuality?: number
}

interface ThumbnailResult {
  thumbnailFile: File
  previewUrl: string
  width: number
  height: number
  size: number
}

const API_BASE = '/api'

function isImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}

function isVideo(file: File): boolean {
  const videoExts = ['mp4', 'mov', 'mkv', 'webm', 'm4v', '3gp']
  const ext = file.name.toLowerCase().split('.').pop() || ''
  return videoExts.includes(ext)
}

async function generateThumbnailImage(
  file: File,
  thumbnailMaxWidth: number = 200,
  thumbnailMaxHeight: number = 200,
  thumbnailQuality: number = 0.9,
): Promise<ThumbnailResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const img = new Image()
      img.src = e.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          reject(new Error('无法获取 canvas context'))
          return
        }

        let width = img.width
        let height = img.height

        if (width > thumbnailMaxWidth || height > thumbnailMaxHeight) {
          const ratio = Math.min(thumbnailMaxWidth / width, thumbnailMaxHeight / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }

        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const thumbnailFile = new File(
                [blob],
                file.name.replace(/\.\w+$/, '_thumb.webp'),
                { type: 'image/webp' },
              )
              const previewUrl = URL.createObjectURL(blob)
              resolve({
                thumbnailFile,
                previewUrl,
                width,
                height,
                size: blob.size,
              })
            } else {
              reject(new Error('缩略图生成失败'))
            }
          },
          'image/webp',
          thumbnailQuality,
        )
      }
      img.onerror = () => reject(new Error('图片加载失败'))
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
  })
}

async function generateVideoThumbnail(file: File): Promise<Blob | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true

    const url = URL.createObjectURL(file)
    video.src = url

    const done = (blob: Blob | null) => {
      URL.revokeObjectURL(url)
      resolve(blob)
    }

    video.onloadedmetadata = () => {
      video.currentTime = 0.1

      video.onseeked = () => {
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth || 320
        canvas.height = video.videoHeight || 240

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          done(null)
          return
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        canvas.toBlob(
          (blob) => done(blob),
          'image/jpeg',
          0.8,
        )
      }

      video.onerror = () => done(null)
    }

    video.onerror = () => done(null)
  })
}

async function signUpload(name: string, contentType: string): Promise<{ upload_url: string; key: string; name: string }> {
  const res = await fetch(`${API_BASE}/upload/sign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, contentType }),
  })

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

async function putWithProgress(url: string, body: BodyInit, contentType: string, onProgress?: (pct: number) => void): Promise<void> {
  if (onProgress && typeof XMLHttpRequest !== 'undefined' && body instanceof Blob) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('PUT', url)
      xhr.setRequestHeader('Content-Type', contentType)
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
      xhr.send(body)
    })
  }

  const res = await fetch(url, { method: 'PUT', headers: { 'Content-Type': contentType }, body })
  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`上传失败: ${res.status} ${errText}`)
  }
}

async function confirmUpload(payload: {
  key: string
  name: string
  size: number
  type: string
  thumbKey: string
  createdAt: string
}): Promise<{ key: string; url: string }> {
  const res = await fetch(`${API_BASE}/upload/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok || data.code !== 0) {
    throw new Error(data.msg || `保存记录失败: ${res.status}`)
  }
  return data.data
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
      generateThumbnail = false,
      thumbnailMaxWidth = 400,
      thumbnailMaxHeight = 800,
      thumbnailQuality = 0.6,
    } = options

    uploading.value = true
    progress.value = 0
    error.value = ''

    try {
      let thumbResult: ThumbnailResult | null = null
      let videoThumbBlob: Blob | null = null

      if (isImageFile(file) && generateThumbnail) {
        processing.value = true
        try {
          thumbResult = await generateThumbnailImage(
            file,
            thumbnailMaxWidth,
            thumbnailMaxHeight,
            thumbnailQuality,
          )
        } catch (thumbErr) {
          console.warn('缩略图生成失败:', thumbErr)
        } finally {
          processing.value = false
        }
      } else if (isVideo(file)) {
        processing.value = true
        try {
          videoThumbBlob = await generateVideoThumbnail(file)
        } catch (thumbErr) {
          console.warn('视频缩略图生成失败:', thumbErr)
        } finally {
          processing.value = false
        }
      }

      progress.value = 5

      const sign = await signUpload(file.name, file.type || 'application/octet-stream')
      console.log('[Upload] Signed:', sign)

      progress.value = 10
      const mainContentType = file.type || 'application/octet-stream'
      await putWithProgress(sign.upload_url, file, mainContentType, (pct) => {
        progress.value = 10 + Math.round(pct * 0.7)
      })

      progress.value = 85

      let thumbKey = ''

      if (thumbResult) {
        try {
          const thumbSign = await signUpload(thumbResult.thumbnailFile.name, 'image/webp')
          await putWithProgress(thumbSign.upload_url, thumbResult.thumbnailFile, 'image/webp')
          thumbKey = thumbSign.key
        } catch (thumbErr) {
          console.warn('图片缩略图上传失败:', thumbErr)
        }
      } else if (videoThumbBlob) {
        try {
          const thumbName = file.name.replace(/\.[^.]+$/, '_thumb.jpg')
          const thumbSign = await signUpload(thumbName, 'image/jpeg')
          await putWithProgress(thumbSign.upload_url, videoThumbBlob, 'image/jpeg')
          thumbKey = thumbSign.key
        } catch (thumbErr) {
          console.warn('视频缩略图上传失败:', thumbErr)
        }
      }

      const confirmed = await confirmUpload({
        key: sign.key,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        thumbKey,
        createdAt: new Date().toISOString(),
      })

      const baseUrl = window.location.origin
      const mainUrl = baseUrl + confirmed.url
      const thumbnailUrl = thumbKey ? baseUrl + '/api/file?key=' + encodeURIComponent(thumbKey) : undefined

      saveImage({
        url: mainUrl,
        thumbnailUrl: thumbnailUrl || undefined,
        name: file.name,
        size: file.size,
        type: file.type,
      })

      progress.value = 100

      return {
        url: mainUrl,
        thumbnailUrl: thumbnailUrl || undefined,
        name: file.name,
        size: file.size,
        type: file.type,
        hasThumbnail: !!thumbResult,
        thumbnailWidth: thumbResult?.width,
        thumbnailHeight: thumbResult?.height,
        thumbnailSize: thumbResult?.size,
      }
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