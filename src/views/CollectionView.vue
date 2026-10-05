<script setup>
// =====================================================================
// 收集页：卡牌册（纯收集展示）+ 零焦虑小花园（元素永久保留）
// 无兑换、无商城、无任何付费入口
// =====================================================================
import { ref, computed } from 'vue'
import CardTile from '../components/CardTile.vue'
import GardenElement from '../components/GardenElement.vue'
import { CARDS } from '../data/cards'
import { cardsState } from '../store/cards'
import { gardenState } from '../store/garden'
import { SUBJECT_ELEMENTS, ELEMENT_LABELS } from '../data/garden'
import { SUBJECTS } from '../constants'

const section = ref('cards') // 'cards' 卡牌册 | 'garden' 小花园

// —— 卡牌册 ——
const collectedSet = computed(() => new Set(cardsState.collected))
const collectedCount = computed(() => cardsState.collected.length)

// 已收集的排前面，未收集的排后面
const sortedCards = computed(() =>
  [...CARDS].sort((a, b) => {
    const ca = collectedSet.value.has(a.id) ? 0 : 1
    const cb = collectedSet.value.has(b.id) ? 0 : 1
    return ca - cb
  })
)

// —— 科目图鉴（联动规则说明） ——
const legend = computed(() =>
  SUBJECTS.map((s) => ({
    subject: s,
    labels: (SUBJECT_ELEMENTS[s.name] || []).map((t) => ELEMENT_LABELS[t] || t),
  }))
)
</script>

<template>
  <div class="max-w-md mx-auto px-5 pt-8 pb-32">
    <!-- 顶部 -->
    <header>
      <h1 class="text-xl font-semibold tracking-wide">收集</h1>
      <p class="mt-1 text-sm text-ink-400">把每一次专注，都变成小小的收藏</p>
    </header>

    <!-- 内部切换：卡牌册 / 小花园 -->
    <div class="mt-5 bg-sand-100 rounded-full p-1 grid grid-cols-2">
      <button
        class="py-2 rounded-full text-sm transition-colors"
        :class="section === 'cards' ? 'bg-surface text-ink-900 shadow-sm font-medium' : 'text-ink-400'"
        @click="section = 'cards'"
      >
        卡牌册
      </button>
      <button
        class="py-2 rounded-full text-sm transition-colors"
        :class="section === 'garden' ? 'bg-surface text-ink-900 shadow-sm font-medium' : 'text-ink-400'"
        @click="section = 'garden'"
      >
        小花园
      </button>
    </div>

    <!-- ==================== 卡牌册 ==================== -->
    <template v-if="section === 'cards'">
      <!-- 收集进度：只显示正向的进度条 -->
      <section class="mt-5 bg-surface rounded-2xl px-5 py-4 shadow-sm border border-sand-200">
        <div class="flex items-baseline justify-between">
          <h2 class="text-sm font-medium">我的卡牌册</h2>
          <span class="text-xs text-ink-400">已收集 {{ collectedCount }} / {{ CARDS.length }}</span>
        </div>
        <div class="mt-2.5 h-2 rounded-full bg-sand-100 overflow-hidden">
          <div
            class="h-full rounded-full bg-sage-400 transition-all duration-500"
            :style="{ width: (collectedCount / CARDS.length) * 100 + '%' }"
          ></div>
        </div>
        <p v-if="collectedCount === CARDS.length" class="mt-2 text-xs text-sage-600">
          全图鉴达成！二十张全部到手
        </p>
      </section>

      <!-- 卡牌网格 -->
      <div class="mt-4 grid grid-cols-3 gap-2.5">
        <CardTile
          v-for="c in sortedCards"
          :key="c.id"
          :card="c"
          :collected="collectedSet.has(c.id)"
        />
      </div>

      <p class="mt-5 text-center text-xs text-ink-300 leading-relaxed">
        每完成一轮专注（或保存半专注），随机掉落 1 张新卡牌<br />只收集，不兑换，攒着就好
      </p>
    </template>

    <!-- ==================== 小花园 ==================== -->
    <template v-else>
      <section class="mt-5 bg-surface rounded-2xl px-5 py-4 shadow-sm border border-sand-200">
        <div class="flex items-baseline justify-between">
          <h2 class="text-sm font-medium">我的小花园</h2>
          <span class="text-xs text-ink-400">{{ gardenState.elements.length }} 个小生命</span>
        </div>
        <!-- 花园画布：所有元素永久保留 -->
        <div
          class="mt-3 relative h-80 rounded-2xl overflow-hidden bg-gradient-to-b from-sage-50 to-sage-100 border border-sage-200"
        >
          <GardenElement
            v-for="(el, i) in gardenState.elements"
            :key="el.id"
            :el="el"
            :index="i"
          />
          <!-- 空状态 -->
          <div
            v-if="gardenState.elements.length === 0"
            class="absolute inset-0 flex flex-col items-center justify-center text-center"
          >
            <p class="text-sm text-ink-400">花园里还空空的</p>
            <p class="mt-1 text-xs text-ink-300">完成一轮专注，就会长出第一个小生命</p>
          </div>
        </div>
        <p class="mt-2 text-xs text-ink-300">每一个元素都会永久留下来，永远不会枯萎消失</p>
      </section>

      <!-- 科目图鉴：联动规则说明 -->
      <section class="mt-4 bg-surface rounded-2xl px-5 py-4 shadow-sm border border-sand-200">
        <h2 class="text-sm font-medium">科目图鉴</h2>
        <p class="text-xs text-ink-400 mt-0.5">花园元素会跟着你的专注科目长出来</p>
        <ul class="mt-3 space-y-2">
          <li v-for="l in legend" :key="l.subject.name" class="flex items-center gap-2 text-xs">
            <span class="w-1.5 h-1.5 rounded-full shrink-0" :style="{ background: l.subject.color }"></span>
            <span class="text-ink-600 shrink-0">{{ l.subject.name }}</span>
            <span class="text-ink-300 shrink-0">→</span>
            <span class="text-ink-400 truncate">{{ l.labels.join(' / ') }}</span>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>