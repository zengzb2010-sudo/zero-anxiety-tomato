<script setup>
// 本周日历热力图：周一 ~ 周日 7 个色块，颜色深浅 = 当天专注时长
import { computed } from 'vue'

const props = defineProps({
  days: { type: Array, default: () => [] }, // [{ label, sec, isToday, isFuture }]
})

// 颜色阶梯（按专注分钟数）：用 CSS 变量 --hm-0~5，浅色/深色两套色阶自动切换
function tierColor(min) {
  if (min <= 0) return 'var(--hm-0)'
  if (min < 15) return 'var(--hm-1)'
  if (min < 30) return 'var(--hm-2)'
  if (min < 60) return 'var(--hm-3)'
  if (min < 90) return 'var(--hm-4)'
  return 'var(--hm-5)'
}

const cells = computed(() =>
  props.days.map((d) => {
    const min = Math.round(d.sec / 60)
    // 深色底用白字，浅色底用灰字，保证可读
    const light = min >= 30
    return { ...d, min, color: tierColor(min), light }
  })
)
</script>

<template>
  <div class="grid grid-cols-7 gap-1.5">
    <div v-for="(c, i) in cells" :key="i" class="flex flex-col items-center gap-1">
      <div
        class="w-full aspect-square rounded-xl flex items-center justify-center text-xs font-medium transition-colors"
        :class="[
          c.isFuture ? 'opacity-30' : '',
          c.light ? 'text-white' : 'text-ink-400',
          c.isToday && !c.isFuture
            ? 'ring-2 ring-sage-400 ring-offset-1 ring-offset-surface'
            : '',
        ]"
        :style="{ background: c.color }"
      >
        <span v-if="c.min > 0 && !c.isFuture">{{ c.min }}</span>
      </div>
      <span
        class="text-[10px]"
        :class="c.isToday ? 'text-sage-600 font-medium' : 'text-ink-300'"
      >
        {{ '周' + c.label }}{{ c.isToday ? '·今' : '' }}
      </span>
    </div>
  </div>
</template>