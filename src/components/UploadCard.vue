<script setup lang="ts">
import { ref } from 'vue'
import { formatFileSize, copyToClipboard } from '@/lib/utils'

interface Props {
  url: string
  name: string
  size: number
  type: string
  originalSize?: number
  compressed?: boolean
}

const props = defineProps<Props>()
const copiedType = ref<string | null>(null)

const videoExts = ['mp4', 'mov', 'mkv', 'webm', 'm4v', '3gp']
const audioExts = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac']

function isVideoFile(): boolean {
  if (props.type.startsWith('video/')) return true
  const ext = props.name.toLowerCase().split('.').pop() || ''
  return videoExts.includes(ext)
}

function isAudioFile(): boolean {
  if (props.type.startsWith('audio/')) return true
  const ext = props.name.toLowerCase().split('.').pop() || ''
  return audioExts.includes(ext)
}

async function handleCopy(type: string) {
  const url = props.url
  let content = url
  if (type === 'markdown') {
    if (isAudioFile()) {
      content = `<audio src="${url}" controls></audio>`
    } else if (isVideoFile()) {
      content = `<video src="${url}" controls></video>`
    } else {
      content = `![${props.name}](${url})`
    }
  } else if (type === 'html') {
    if (isAudioFile()) {
      content = `<audio src="${url}" controls></audio>`
    } else if (isVideoFile()) {
      content = `<video src="${url}" controls></video>`
    } else {
      content = `<img src="${url}" alt="${props.name}" />`
    }
  }
  
  await copyToClipboard(content)
  copiedType.value = type
  setTimeout(() => (copiedType.value = null), 2000)
}
</script>

<template>
  <div class="glass-card rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01]">
    <div class="aspect-video bg-surface-elevated flex items-center justify-center">
      <img
        v-if="!isVideoFile() && !isAudioFile()"
        :src="url"
        :alt="name"
        class="max-w-full max-h-full object-contain"
      />
      <video
        v-else-if="isVideoFile()"
        :src="url"
        controls
        preload="metadata"
        playsinline
        class="max-w-full max-h-full object-contain"
      />
      <audio
        v-else
        :src="url"
        controls
        preload="metadata"
        class="w-5/6"
      />
    </div>

    <div class="p-4">
      <p class="font-semibold text-text-primary truncate text-base">{{ name }}</p>
      <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary mt-1.5">
        <p v-if="compressed && originalSize">
          {{ formatFileSize(originalSize) }} → <span class="gradient-text font-bold">{{ formatFileSize(size) }}</span>
          <span class="ml-1 px-1.5 py-0.5 rounded bg-green-500/10 text-green-500 text-[10px] font-medium">已压缩 · WebP</span>
        </p>
        <p v-else>{{ formatFileSize(size) }} · {{ type }}</p>
      </div>

      <div class="mt-3 flex items-center gap-2">
        <div class="flex-1 min-w-0 px-3 py-2 bg-surface-elevated rounded-lg text-xs text-text-secondary truncate font-mono">
          {{ url }}
        </div>
        <button
          @click="handleCopy('link')"
          :class="[
            'shrink-0 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-300',
            copiedType === 'link'
              ? 'bg-green-500/20 text-green-500 border border-green-500/30'
              : 'gradient-btn text-white'
          ]"
        >
          {{ copiedType === 'link' ? '✓ 已复制' : '链接' }}
        </button>
      </div>

      <div class="mt-2 flex items-center gap-2">
        <button
          @click="handleCopy('markdown')"
          :class="[
            'flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-300',
            copiedType === 'markdown'
              ? 'bg-green-500/20 text-green-500 border border-green-500/30'
              : 'gradient-btn text-white'
          ]"
        >
          {{ copiedType === 'markdown' ? '✓ 已复制' : 'Markdown' }}
        </button>
        <button
          @click="handleCopy('html')"
          :class="[
            'flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-300',
            copiedType === 'html'
              ? 'bg-green-500/20 text-green-500 border border-green-500/30'
              : 'gradient-btn text-white'
          ]"
        >
          {{ copiedType === 'html' ? '✓ 已复制' : 'HTML' }}
        </button>
      </div>
    </div>
  </div>
</template>
