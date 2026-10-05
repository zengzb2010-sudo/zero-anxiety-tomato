<script setup>
// 圆环进度计时器：纯 SVG 实现，无第三方图表库
import { computed } from 'vue'

const props = defineProps({
  progress: { type: Number, default: 1 }, // 0~1 剩余比例
  size: { type: Number, default: 300 }, // 最大直径 px
  strokeWidth: { type: Number, default: 6 },
  // 颜色支持 CSS 变量（如 var(--color-sage-400)），随深色模式自动变化
  color: { type: String, default: 'var(--color-sage-400)' },
})

const R = 45
const C = 2 * Math.PI * R // 圆周长，用于 dasharray/dashoffset
const offset = computed(() => C * (1 - Math.min(1, Math.max(0, props.progress))))
// 轨道色也用主题变量（浅色=浅灰，深色=深灰）
const trackColor = 'var(--color-sand-200)'
</script>

<template>
  <div class="relative w-full mx-auto" :style="{ maxWidth: size + 'px' }">
    <svg viewBox="0 0 100 100" class="-rotate-90 w-full h-auto block">
      <!-- 底色轨道 -->
      <circle cx="50" cy="50" :r="R" fill="none" :style="{ stroke: trackColor }" :stroke-width="strokeWidth" />
      <!-- 进度弧 -->
      <circle
        cx="50"
        cy="50"
        :r="R"
        fill="none"
        :style="{ stroke: color }"
        :stroke-width="strokeWidth"
        stroke-linecap="round"
        :stroke-dasharray="C"
        :stroke-dashoffset="offset"
        class="transition-[stroke-dashoffset] duration-300 ease-linear"
      />
    </svg>
    <!-- 中心内容插槽 -->
    <div class="absolute inset-0 flex flex-col items-center justify-center">
      <slot />
    </div>
  </div>
</template>