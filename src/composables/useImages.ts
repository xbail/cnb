import { ref } from 'vue'

export interface ImageRecord {
  id: string
  key: string
  url: string
  thumbnailUrl?: string
  name: string
  size: number
  type: string
  createdAt: string
}

export function isVideo(file: ImageRecord): boolean {
  if (file.type.startsWith('video/')) return true
  const ext = file.name.toLowerCase().split('.').pop() || ''
  return ['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v', '3gp'].includes(ext)
}

const API_BASE = '/api'

export function useImages() {
  const images = ref<ImageRecord[]>([])
  const loading = ref(false)
  const error = ref('')

  async function fetchImages() {
    loading.value = true
    error.value = ''

    try {
      const res = await fetch(`${API_BASE}/files`)
      if (!res.ok) {
        throw new Error(`获取文件列表失败: ${res.status}`)
      }
      const data = await res.json()
      if (data.code !== 0) {
        throw new Error(data.msg || '获取文件列表失败')
      }
      images.value = (data.data || []).map((item: any) => ({
        id: item.key,
        key: item.key,
        url: item.url,
        thumbnailUrl: item.thumbnailUrl,
        name: item.name,
        size: item.size,
        type: item.type,
        createdAt: item.createdAt,
      }))
    } catch (e) {
      console.error('[useImages] fetch error:', e)
      error.value = e instanceof Error ? e.message : '获取文件列表失败'
    } finally {
      loading.value = false
    }
  }

  function saveImage(record: Omit<ImageRecord, 'id' | 'key' | 'createdAt'>) {
    // 服务端已通过 /api/upload/confirm 持久化，此处仅作为内存即时反馈
    images.value.unshift({
      ...record,
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      key: '',
      createdAt: new Date().toISOString(),
    })
  }

  async function deleteImage(id: string) {
    const target = images.value.find(img => img.id === id)
    if (!target || !target.key) {
      images.value = images.value.filter(img => img.id !== id)
      return true
    }

    const res = await fetch(`${API_BASE}/file?key=${encodeURIComponent(target.key)}`, {
      method: 'DELETE',
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || data.code !== 0) {
      throw new Error(data.msg || `删除失败: ${res.status}`)
    }

    images.value = images.value.filter(img => img.id !== id)
    return true
  }

  return {
    images,
    loading,
    error,
    fetchImages,
    saveImage,
    deleteImage
  }
}