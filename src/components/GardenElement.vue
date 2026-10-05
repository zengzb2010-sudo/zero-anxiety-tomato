<script setup>
// 花园元素：按类型渲染不同的小图形（纯 SVG 手工绘制），带「生长」入场动画
import { computed } from 'vue'

const props = defineProps({
  el: { type: Object, required: true }, // { type, x, y, size, rotate, variant }
  index: { type: Number, default: 0 }, // 用于入场动画错峰
})

// 各元素的低饱和配色
const COLORS = {
  book: '#C9899F',
  triangle: '#7FB5A5',
  circle: '#A3B98A',
  square: '#86B3C2',
  letter: '#93A9CF',
  bolt: '#E5C77F',
  flask: '#AC94C9',
  leaf: '#83B57E',
  scroll: '#C2A67A',
  mountain: '#9AA5B5',
  flag: '#D8A793',
  flower: '#D8A9A0',
  grass: '#8FBF8A',
  sun: '#E8C98F',
}

const color = computed(() => COLORS[props.el.type] || '#83B294')
</script>

<template>
  <div
    class="absolute garden-el"
    :style="{
      left: el.x + '%',
      top: el.y + '%',
      '--rot': el.rotate + 'deg',
      '--i': Math.min(index, 10),
    }"
  >
    <svg
      :width="el.size"
      :height="el.size"
      viewBox="0 0 24 24"
      fill="none"
      :stroke="color"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <!-- 语文：小书本 -->
      <g v-if="el.type === 'book'" :fill="color">
        <path d="M12 6C10.5 4.5 8 4 5 4v13.5c3 0 5.5.5 7 2 1.5-1.5 4-2 7-2V4c-3 0-5.5.5-7 2z" />
        <path d="M12 6v13.5" stroke="#fff" stroke-width="1.2" />
      </g>
      <!-- 数学：几何图形（三角/圆/方块） -->
      <polygon v-else-if="el.type === 'triangle'" points="12,4.5 20,18.5 4,18.5" :fill="color" />
      <circle v-else-if="el.type === 'circle'" cx="12" cy="12" r="7.5" :fill="color" />
      <rect v-else-if="el.type === 'square'" x="5" y="5" width="14" height="14" rx="2" :fill="color" />
      <!-- 英语：字母块 -->
      <text
        v-else-if="el.type === 'letter'"
        x="12"
        y="16.5"
        text-anchor="middle"
        font-size="13"
        font-weight="700"
        :fill="color"
        stroke="none"
      >
        {{ el.variant || 'A' }}
      </text>
      <!-- 物理：小闪电 -->
      <polygon v-else-if="el.type === 'bolt'" points="13,3 6,14 11,14 9,21 18,10 12,10" :fill="color" />
      <!-- 化学：小锥形瓶 -->
      <g v-else-if="el.type === 'flask'">
        <path d="M10 3h4M11 3v5l-5 8.5A2 2 0 0 0 7.8 19.5h8.4A2 2 0 0 0 18 16.5L13 8V3" />
        <path d="M8.5 17h7" stroke-width="1.2" />
      </g>
      <!-- 生物：小叶子 -->
      <g v-else-if="el.type === 'leaf'">
        <path d="M19.5 4.5C12 4.5 6.5 9.5 6 17c7-.5 12-5.5 13.5-12.5z" :fill="color" />
        <path d="M5.5 18.5C7.5 14 10 11 13.5 9.5" />
      </g>
      <!-- 历史：小卷轴 -->
      <g v-else-if="el.type === 'scroll'">
        <rect x="5.5" y="3.5" width="13" height="17" rx="2" :fill="color" />
        <path d="M8.5 3.5v17M9 7h6M9 10h6" stroke="#fff" stroke-width="1" />
      </g>
      <!-- 地理：小山峰 -->
      <g v-else-if="el.type === 'mountain'">
        <path d="M3.5 18.5L9 8l4 6 2.5-3.5 5 8H3.5z" :fill="color" />
        <path d="M9 8l4 6 2.5-3.5" stroke="#fff" stroke-width="1" />
      </g>
      <!-- 政治：小红旗 -->
      <g v-else-if="el.type === 'flag'">
        <path d="M6 21V4" />
        <path d="M6 5h11l-2.4 3L17 11H6" :fill="color" />
      </g>
      <!-- 其他：小花花 -->
      <g v-else-if="el.type === 'flower'">
        <circle cx="12" cy="7" r="2.4" :fill="color" stroke="none" />
        <circle cx="12" cy="17" r="2.4" :fill="color" stroke="none" />
        <circle cx="7" cy="12" r="2.4" :fill="color" stroke="none" />
        <circle cx="17" cy="12" r="2.4" :fill="color" stroke="none" />
        <circle cx="12" cy="12" r="2.6" fill="#F5E9C9" stroke="none" />
      </g>
      <!-- 其他：小绿草 -->
      <g v-else-if="el.type === 'grass'">
        <path d="M7 20.5c0-5.5 1.8-8.5 5-9.5" stroke-width="2" />
        <path d="M12 20.5c0-6.5 2.8-9.5 6-9.5" stroke-width="2" />
      </g>
      <!-- 其他：小太阳 -->
      <g v-else>
        <circle cx="12" cy="12" r="4.2" :fill="color" />
        <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M18.7 5.3l-1.8 1.8M7.1 16.9l-1.8 1.8" stroke-width="1.2" />
      </g>
    </svg>
  </div>
</template>