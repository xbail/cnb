<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { copyToClipboard, formatFileSize, formatDate } from '@/lib/utils'
import type { ImageRecord } from '@/composables/useImages'
import { isVideo, isAudio } from '@/composables/useImages'

interface Props {
  image: ImageRecord
  hasPrev?: boolean
  hasNext?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'prev'): void
  (e: 'next'): void
  (e: 'delete', id: string): void
}>()

const copiedType = ref<string | null>(null)
const videoUnsupported = ref(false)

function handleCopy(type: string) {
  const url = props.image.url
  let content = url
  if (type === 'markdown') {
    if (isAudio(props.image)) {
      content = `<audio src="${url}" controls></audio>`
    } else if (isVideo(props.image)) {
      content = `<video src="${url}" controls></video>`
    } else {
      content = `![${props.image.name}](${url})`
    }
  } else if (type === 'html') {
    if (isAudio(props.image)) {
      content = `<audio src="${url}" controls></audio>`
    } else if (isVideo(props.image)) {
      content = `<video src="${url}" controls></video>`
    } else {
      content = `<img src="${url}" alt="${props.image.name}" />`
    }
  }
  
  copyToClipboard(content)
  copiedType.value = type
  setTimeout(() => (copiedType.value = null), 2000)
}

function handleVideoLoaded(event: Event) {
  const video = event.target as HTMLVideoElement
  videoUnsupported.value = video.videoWidth === 0 && video.videoHeight === 0
}

function handleVideoError() {
  videoUnsupported.value = true
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
  if (e.key === 'ArrowLeft' && props.hasPrev) emit('prev')
  if (e.key === 'ArrowRight' && props.hasNext) emit('next')
}

onMounted(() => {
  document.body.style.overflow = 'hidden'
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.body.style.overflow = ''
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl"
      @click.self="emit('close')"
    >
      <button
        @click="emit('close')"
        class="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300 hover:scale-110 z-10"
      >
        <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <button
        v-if="hasPrev"
        @click="emit('prev')"
        class="absolute left-6 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300 hover:scale-110 z-10"
      >
        <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        v-if="hasNext"
        @click="emit('next')"
        class="absolute right-6 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300 hover:scale-110 z-10"
      >
        <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <div class="max-w-6xl max-h-[85vh] mx-4">
        <div v-if="isAudio(image)" class="flex flex-col items-center gap-6 py-16">
          <svg class="w-24 h-24 gradient-text" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 6l12-3" />
          </svg>
          <audio :src="image.url" controls class="w-full max-w-xl" preload="metadata" />
        </div>
        <div v-else-if="isVideo(image)" class="relative">
          <video
            :src="image.url"
            controls
            preload="metadata"
            playsinline
            class="max-w-full max-h-[75vh] rounded-2xl bg-black shadow-2xl"
            @loadedmetadata="handleVideoLoaded"
            @error="handleVideoError"
          />
          <div
            v-if="videoUnsupported"
            class="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 rounded-2xl text-center p-8"
          >
            <svg class="w-12 h-12 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p class="text-white font-semibold text-lg">视频画面无法播放</p>
            <p class="text-white/70 text-sm max-w-md">
              此视频可能使用了浏览器不支持的编码（如 H.265/HEVC）。建议用 Safari / Edge / 移动端打开，或将视频转码为 H.264 后重新上传。
            </p>
          </div>
        </div>
        <img
          v-else
          :src="image.url"
          :alt="image.name"
          class="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl"
        />
      </div>

      <div class="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
        <div class="max-w-4xl mx-auto">
          <h3 class="text-white font-bold text-xl truncate">{{ image.name }}</h3>
          <p class="text-white/70 text-sm mt-2">
            {{ formatFileSize(image.size) }} · {{ formatDate(image.createdAt) }}
          </p>

          <div class="flex items-center gap-3 mt-5 flex-wrap">
            <button
              @click="handleCopy('link')"
              :class="[
                'px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-300',
                copiedType === 'link'
                  ? 'bg-green-500 text-white shadow-lg'
                  : 'bg-white/10 text-white hover:bg-white/20 hover:scale-105'
              ]"
            >
              {{ copiedType === 'link' ? '✓ 已复制' : '链接' }}
            </button>
            <button
              @click="handleCopy('markdown')"
              :class="[
                'px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-300',
                copiedType === 'markdown'
                  ? 'bg-green-500 text-white shadow-lg'
                  : 'bg-white/10 text-white hover:bg-white/20 hover:scale-105'
              ]"
            >
              {{ copiedType === 'markdown' ? '✓ 已复制' : 'Markdown' }}
            </button>
            <button
              @click="handleCopy('html')"
              :class="[
                'px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-300',
                copiedType === 'html'
                  ? 'bg-green-500 text-white shadow-lg'
                  : 'bg-white/10 text-white hover:bg-white/20 hover:scale-105'
              ]"
            >
              {{ copiedType === 'html' ? '✓ 已复制' : 'HTML' }}
            </button>

            <button
              @click="emit('delete', image.id)"
              class="px-5 py-3 rounded-xl text-sm font-semibold bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-all duration-300 hover:scale-105 border border-red-500/30"
            >
              删除
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>