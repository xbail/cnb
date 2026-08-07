<script setup lang="ts">
import { ref } from 'vue'
import NavBar from '@/components/layout/NavBar.vue'
import DropZone from '@/components/DropZone.vue'
import UploadCard from '@/components/UploadCard.vue'
import { useUpload, type UploadResult } from '@/composables/useUpload'

const { uploading, progress, error, processing, upload } = useUpload()

const uploadedFiles = ref<UploadResult[]>([])
const uploadQueue = ref<File[]>([])
const currentUploadIndex = ref(0)

async function handleFiles(files: File[]) {
  if (files.length === 0) return

  uploadQueue.value = files
  currentUploadIndex.value = 0

  for (let i = 0; i < files.length; i++) {
    currentUploadIndex.value = i
    const result = await upload(files[i])
    if (result) {
      uploadedFiles.value.unshift(result)
    }
  }

  uploadQueue.value = []
}

function getUploadProgress() {
  if (uploadQueue.value.length === 0) return progress.value
  const baseProgress = (currentUploadIndex.value / uploadQueue.value.length) * 100
  const currentFileProgress = (progress.value / uploadQueue.value.length)
  return baseProgress + currentFileProgress
}
</script>

<template>
  <div class="min-h-screen">
    <NavBar />

    <main class="max-w-3xl mx-auto px-4 py-10">
      <div class="text-center mb-10">
        <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card text-xs font-medium text-text-secondary mb-5">
          <span class="w-2 h-2 rounded-full gradient-btn"></span>
          永久存储 · 直链分享 · 视频可播
        </div>
        <h1 class="text-4xl sm:text-5xl font-bold gradient-text tracking-tight">CNB 图床</h1>
        <p class="text-text-secondary mt-4 text-base leading-relaxed">
          上传图片或视频，获取永久直链，随处分享
        </p>
      </div>

      <DropZone @files="handleFiles" />

      <div v-if="processing" class="mt-5 glass-card rounded-2xl p-4">
        <div class="flex items-center gap-2 text-sm text-text-secondary">
          <svg class="h-5 w-5 animate-spin text-accent" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>上传中...</span>
        </div>
      </div>

      <div v-if="uploading" class="mt-5 glass-card rounded-2xl p-5">
        <div class="flex items-center justify-between text-sm mb-3">
          <span class="text-text-secondary">上传中...</span>
          <span class="text-text-primary font-medium">
            {{ uploadQueue.length > 0 ? `${currentUploadIndex + 1}/${uploadQueue.length}` : '' }}
            <span class="gradient-text font-bold">{{ Math.round(getUploadProgress()) }}%</span>
          </span>
        </div>
        <div class="h-2.5 bg-surface-elevated rounded-full overflow-hidden">
          <div
            class="h-full gradient-btn transition-all duration-300 rounded-full"
            :style="{ width: getUploadProgress() + '%' }"
          />
        </div>
      </div>

      <div v-if="error" class="mt-5 glass-card rounded-2xl p-4 border-red-500/30 bg-red-500/5">
        <div class="flex items-center gap-2 text-red-500">
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="text-sm">{{ error }}</span>
        </div>
      </div>

      <div v-if="uploadedFiles.length > 0" class="mt-10">
        <h2 class="text-xl font-bold gradient-text mb-5 flex items-center gap-2">
          上传成功 ({{ uploadedFiles.length }})
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </h2>
        <div class="space-y-4">
          <UploadCard
            v-for="file in uploadedFiles"
            :key="file.url"
            :url="file.url"
            :name="file.name"
            :size="file.size"
            :type="file.type"
          />
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
</style>
