<script setup>
// 白噪音控制面板（专注页内嵌的折叠卡片，非弹窗）：
// 4 种自习环境音 + 音量调节，切换页签/开始专注后继续后台播放
import { ref, computed } from 'vue'
import { settings } from '../store/settings'
import { noiseType, setNoise, stopNoise } from '../utils/noise'

const open = ref(false)

const TYPES = [
  { key: 'classroom', label: '安静教室', desc: '沙沙的教室底噪' },
  { key: 'rain', label: '雨声', desc: '淅淅沥沥的白噪音' },
  { key: 'pages', label: '翻书声', desc: '偶尔轻轻翻过一页' },
  { key: 'cafe', label: '咖啡馆', desc: '远处低声细语' },
]

const currentLabel = computed(() => TYPES.find((t) => t.key === noiseType.value)?.label || '')

function pick(key) {
  // 重复点击同一音源 = 关闭
  if (noiseType.value === key) stopNoise()
  else setNoise(key)
}
</script>

<template>
  <section class="bg-surface rounded-2xl px-4 py-3.5 shadow-sm border border-sand-200">
    <!-- 折叠行 -->
    <button class="w-full flex items-center justify-between" @click="open = !open">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-lg bg-sage-100 flex items-center justify-center text-sage-600">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 9v6h3l5 4V5L7 9H4z" />
            <path d="M16.5 8.5a5 5 0 0 1 0 7" />
            <path d="M19 6a8.5 8.5 0 0 1 0 12" />
          </svg>
        </div>
        <div class="text-left">
          <p class="text-sm">白噪音</p>
          <p class="text-[10px] text-ink-400">
            {{ noiseType ? '正在播放：' + currentLabel : '自习环境音，专注时可后台播放' }}
          </p>
        </div>
      </div>
      <span class="text-xs shrink-0" :class="noiseType ? 'text-sage-600 font-medium' : 'text-ink-300'">
        {{ noiseType ? '播放中' : '关' }}
      </span>
    </button>

    <!-- 展开面板 -->
    <div v-if="open" class="mt-3 pt-3 border-t border-sand-100">
      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="t in TYPES"
          :key="t.key"
          class="rounded-xl border px-3 py-2.5 text-left transition-colors"
          :class="noiseType === t.key ? 'border-sage-400 bg-sage-50' : 'border-sand-200 bg-surface'"
          @click="pick(t.key)"
        >
          <p class="text-xs font-medium" :class="noiseType === t.key ? 'text-sage-700' : 'text-ink-900'">
            {{ t.label }}
          </p>
          <p class="text-[10px] text-ink-400 mt-0.5">{{ t.desc }}</p>
        </button>
      </div>
      <div v-if="noiseType" class="mt-3 flex items-center gap-3">
        <span class="text-[10px] text-ink-400 shrink-0">音量</span>
        <input
          v-model="settings.noiseVolume"
          type="range"
          min="0"
          max="1"
          step="0.05"
          class="flex-1 accent-sage-500"
        />
        <button class="text-[10px] px-2.5 py-1 rounded-full bg-sand-100 text-ink-600" @click="stopNoise()">
          关闭
        </button>
      </div>
      <p class="mt-2 text-[10px] text-ink-300">切换页面或开始专注后，声音会继续陪伴你</p>
    </div>
  </section>
</template>