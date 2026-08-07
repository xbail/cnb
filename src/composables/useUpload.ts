import { ref } from 'vue'
import { useImages } from './useImages'

export interface UploadResult {
  url: string
  name: string
  size: number
  type: string
  key: string
}

export interface UploadOptions {
  generateThumbnail?: boolean
  thumbnailMaxWidth?: number
  thumbnailMaxHeight?: number
  thumbnailQuality?: number
}

const API_BASE = '/api'

function getUploadType(fileName: string): string {
  const ext = fileName.toLowerCase().split('.').pop() || ''
  const videoExts = ['mp4', 'mov', 'mkv', 'webm', 'm4v', '3gp']
  return videoExts.includes(ext) ? 'files' : 'imgs'
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
    void options
    uploading.value = true
    progress.value = 0
    error.value = ''

    try {
      progress.value = 5

      const sign = await signUpload(file.name, file.size)
      console.log('[Upload] Signed:', sign)

      progress.value = 10
      await putWithProgress(sign.upload_url, file, (pct) => {
        progress.value = 10 + Math.round(pct * 0.85)
      })

      progress.value = 95

      const baseUrl = window.location.origin
      const mediaPath = extractMediaPath(sign.assets.path)
      const mainUrl = baseUrl + '/img-api/' + mediaPath

      const record = {
        url: mainUrl,
        name: file.name,
        size: file.size,
        type: getUploadType(file.name) === 'files' ? 'video/' + (file.name.toLowerCase().split('.').pop() || 'mp4') : (file.type || 'image/jpeg'),
        key: sign.assets.path,
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