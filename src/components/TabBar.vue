<script setup>
// 底部导航：专注 / 任务 / 统计 / 我的
defineProps({
  current: { type: String, default: 'focus' },
})
defineEmits(['change'])

const tabs = [
  { key: 'focus', label: '专注', icon: 'clock' },
  { key: 'tasks', label: '任务', icon: 'list' },
  { key: 'stats', label: '统计', icon: 'chart' },
  { key: 'collection', label: '收集', icon: 'star' },
  { key: 'settings', label: '我的', icon: 'user' },
]
</script>

<template>
  <nav
    class="fixed bottom-0 inset-x-0 z-40 bg-surface/90 backdrop-blur border-t border-sand-200 pb-[env(safe-area-inset-bottom)]"
  >
    <div class="max-w-md mx-auto grid grid-cols-5">
      <button
        v-for="t in tabs"
        :key="t.key"
        class="flex flex-col items-center gap-1 py-2.5"
        :class="current === t.key ? 'text-sage-600' : 'text-ink-400'"
        @click="$emit('change', t.key)"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <!-- 专注：时钟 -->
          <g v-if="t.icon === 'clock'">
            <circle cx="12" cy="12" r="8.5" />
            <path d="M12 7.5V12l3 1.8" />
          </g>
          <!-- 任务：清单 -->
          <g v-else-if="t.icon === 'list'">
            <path d="M4 6h2M4 12h2M4 18h2" />
            <path d="M10 6h10M10 12h10M10 18h10" />
          </g>
          <!-- 统计：柱状图 -->
          <g v-else-if="t.icon === 'chart'">
            <path d="M6 20V11M12 20V5M18 20v-6" />
            <path d="M4 20h16" />
          </g>
          <!-- 收集：星星 -->
          <g v-else-if="t.icon === 'star'">
            <path d="M12 4.5l2.3 4.9 5.2.5-3.9 3.6 1.2 5.3L12 16l-4.8 2.8 1.2-5.3-3.9-3.6 5.2-.5z" />
          </g>
          <!-- 我的：用户 -->
          <g v-else>
            <circle cx="12" cy="8" r="3.6" />
            <path d="M5 20c0-3.3 3.1-5.2 7-5.2s7 1.9 7 5.2" />
          </g>
        </svg>
        <span class="text-[11px]">{{ t.label }}</span>
      </button>
    </div>
  </nav>
</template>