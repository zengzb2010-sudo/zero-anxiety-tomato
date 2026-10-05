<script setup>
// 环形饼图（纯 SVG 实现，无第三方图表库）
// 用于「本周各科专注时长分布」，中心插槽可放汇总数字
import { computed } from 'vue'

const props = defineProps({
  data: { type: Array, default: () => [] }, // [{ name, value, color }]，value 均 > 0
  size: { type: Number, default: 180 }, // 最大直径 px
  strokeWidth: { type: Number, default: 15 },
})

const R = 42
const C = 2 * Math.PI * R // 圆周长

const total = computed(() => props.data.reduce((s, d) => s + d.value, 0))

// 把数据换算成 SVG 弧段：dash 长度 = 占比 × 周长，offset 逐段累加
const segments = computed(() => {
  let acc = 0
  return props.data.map((d) => {
    const frac = total.value ? d.value / total.value : 0
    const seg = { ...d, dash: frac * C, offset: -acc * C }
    acc += frac
    return seg
  })
})
</script>

<template>
  <div class="relative mx-auto" :style="{ width: size + 'px', maxWidth: '100%' }">
    <svg viewBox="0 0 100 100" class="w-full h-auto block -rotate-90">
      <!-- 底色轨道（随深色模式自适应） -->
      <circle cx="50" cy="50" :r="R" fill="none" :style="{ stroke: 'var(--color-sand-200)' }" :stroke-width="strokeWidth" />
      <!-- 各科弧段 -->
      <circle
        v-for="(s, i) in segments"
        :key="i"
        cx="50"
        cy="50"
        :r="R"
        fill="none"
        :stroke="s.color"
        :stroke-width="strokeWidth"
        :stroke-dasharray="`${s.dash} ${C - s.dash}`"
        :stroke-dashoffset="s.offset"
      />
    </svg>
    <!-- 中心汇总 -->
    <div class="absolute inset-0 flex flex-col items-center justify-center">
      <slot />
    </div>
  </div>
</template>