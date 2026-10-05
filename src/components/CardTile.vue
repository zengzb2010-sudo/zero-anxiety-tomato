<script setup>
// 卡牌卡片：已收集显示彩色卡面+梗文案，未收集显示灰色剪影+问号
defineProps({
  card: { type: Object, required: true }, // { id, name, char, color, desc }
  collected: Boolean,
})
</script>

<template>
  <div
    class="rounded-2xl border p-2.5 flex flex-col items-center gap-1.5 transition-colors"
    :class="collected ? 'bg-surface border-sand-200 shadow-sm' : 'bg-sand-100 border-sand-200/60'"
  >
    <!-- 徽章大字 / 问号 -->
    <div
      class="w-full aspect-square rounded-xl flex items-center justify-center text-2xl font-semibold"
      :class="collected ? '' : 'bg-sand-200 text-ink-300'"
      :style="collected ? { background: card.color + '55', color: card.color } : {}"
    >
      {{ collected ? card.char : '?' }}
    </div>
    <!-- 名字 -->
    <p
      class="text-xs font-medium truncate w-full text-center"
      :class="collected ? 'text-ink-900' : 'text-ink-300'"
    >
      {{ collected ? card.name : '未收集' }}
    </p>
    <!-- 梗描述 -->
    <p
      class="text-[9px] leading-tight text-center line-clamp-2 min-h-[22px]"
      :class="collected ? 'text-ink-400' : 'text-ink-300'"
    >
      {{ collected ? card.desc : '继续专注，说不定下一个就是它' }}
    </p>
  </div>
</template>