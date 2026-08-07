<script setup lang="ts">
import { ref } from 'vue'
import NavBar from '@/components/layout/NavBar.vue'
import DropZone from '@/components/DropZone.vue'
import UploadCard from '@/components/UploadCard.vue'
import { useUpload, type UploadResult } from '@/composables/useUpload'

const { uploading, progress, error, processing, upload } = useUpload()

const compressEnabled = ref(true)

const uploadedFiles = ref<UploadResult[]>([])
const uploadQueue = ref<File[]>([])
const currentUploadIndex = ref(0)

const showApiDocs = ref(false)

async function handleFiles(files: File[]) {
  if (files.length === 0) return

  uploadQueue.value = files
  currentUploadIndex.value = 0

  for (let i = 0; i < files.length; i++) {
    currentUploadIndex.value = i
    const result = await upload(files[i], {
      compress: compressEnabled.value,
      maxWidth: 1920,
      maxHeight: 1080,
    })
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

      <div class="mt-4 glass-card rounded-2xl p-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div
              class="w-9 h-9 rounded-xl flex items-center justify-center"
              :class="compressEnabled ? 'gradient-btn' : 'bg-surface-elevated'"
            >
              <svg class="w-5 h-5" :class="compressEnabled ? 'text-white' : 'text-text-secondary'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <p class="text-sm font-semibold text-text-primary">图片压缩</p>
              <p class="text-xs text-text-secondary mt-0.5">超大图片自动等比缩小（超过 1920×1080），无损保留画质、格式不变（GIF 动图除外）</p>
            </div>
          </div>
          <button
            @click="compressEnabled = !compressEnabled"
            :class="[
              'relative w-12 h-7 rounded-full transition-all duration-300',
              compressEnabled ? 'gradient-btn' : 'bg-surface-elevated'
            ]"
            role="switch"
            :aria-checked="compressEnabled"
          >
            <span
              :class="[
                'absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all duration-300',
                compressEnabled ? 'left-6' : 'left-1'
              ]"
            />
          </button>
        </div>
      </div>

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
            :original-size="file.originalSize"
            :compressed="file.compressed"
          />
        </div>
      </div>
      <div class="mt-10 glass-card rounded-2xl overflow-hidden">
        <button
          @click="showApiDocs = !showApiDocs"
          class="w-full flex items-center justify-between px-5 py-4 text-left transition-colors hover:bg-surface-elevated/50"
        >
          <span class="flex items-center gap-2 font-semibold text-text-primary">
            <svg class="w-5 h-5 gradient-text" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            API 接口文档
          </span>
          <svg
            :class="['w-5 h-5 text-text-secondary transition-transform duration-300', showApiDocs ? 'rotate-180' : '']"
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div v-if="showApiDocs" class="px-5 pb-5 space-y-3">
          <p class="text-xs text-text-secondary">统一返回 <code class="text-accent font-mono">{"code":0,"msg":"ok","data":...}</code>，<code class="text-accent font-mono">code</code> 为 0 表示成功。</p>

          <div class="space-y-4">
            <div>
              <p class="font-mono text-xs text-accent mb-1">POST /api/auth/verify</p>
              <p class="text-xs text-text-secondary">验证访问密码，body: <code class="font-mono">{"password":"xxx"}</code></p>
            </div>
            <div>
              <p class="font-mono text-xs text-accent mb-1">GET /api/upload/sign?name=x.png&size=10240</p>
              <p class="text-xs text-text-secondary">获取上传签名，返回 <code class="font-mono">upload_url</code>（含随机重命名的文件名）</p>
            </div>
            <div>
              <p class="font-mono text-xs text-accent mb-1">POST /api/upload/put?upload_url=&lt;签名返回&gt;</p>
              <p class="text-xs text-text-secondary">上传文件，请求体为文件二进制（Content-Type: application/octet-stream）</p>
            </div>
            <div>
              <p class="font-mono text-xs text-accent mb-1">GET /api/files</p>
              <p class="text-xs text-text-secondary">获取文件列表（按创建时间倒序）</p>
            </div>
            <div>
              <p class="font-mono text-xs text-accent mb-1">DELETE /api/file?path=&lt;key&gt;</p>
              <p class="text-xs text-text-secondary">按 key（含 /-/imgs/ 或 /-/files/）删除文件</p>
            </div>
            <div>
              <p class="font-mono text-xs text-accent mb-1">GET /img-api/&lt;mediaPath&gt;</p>
              <p class="text-xs text-text-secondary">访问图片/视频直链（CDN 加速，支持 Range 播放）</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
</style>
