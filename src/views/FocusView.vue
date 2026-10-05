<script setup>
// =====================================================================
// 首页（专注页）：大尺寸计时器 + 一步开始专注，减少操作层级
// =====================================================================
import { ref, computed, inject } from 'vue'
import TimerRing from '../components/TimerRing.vue'
import ToggleSwitch from '../components/ToggleSwitch.vue'
import GentleAbandonModal from '../components/GentleAbandonModal.vue'
import WhiteNoisePanel from '../components/WhiteNoisePanel.vue'
import { settings } from '../store/settings'
import { tasksState } from '../store/tasks'
import { SUBJECTS, FOCUS_PRESETS } from '../constants'
import {
  state,
  progress,
  displayTime,
  elapsedSec,
  startFocus,
  pauseTimer,
  resumeTimer,
  abandonSession,
  startBreak,
  skipBreak,
  endBreak,
} from '../composables/useTimer'
import { formatMinutes, greeting, formatDateCN } from '../utils/time'
import { quip } from '../utils/quips'
import { ELEMENT_LABELS } from '../data/garden'

// 底部导航切换（由 App.vue provide）
const setTab = inject('setTab')

// 可选任务：只显示未完成的（已完成任务不再需要绑定专注）
const activeTasks = computed(() => tasksState.list.filter((t) => !t.completed))

// —— 状态文案与颜色 ——
const isIdleFocus = computed(() => state.mode === 'focus' && state.status === 'idle')
const isCustom = computed(() => !FOCUS_PRESETS.includes(settings.focusMinutes) && settings.focusMinutes !== 25)

// 碎碎念：每次状态切换随机取一条学生友好梗文案（科目/时长自适应）
const statusText = computed(() => {
  const minutes = Math.round(state.totalMs / 60000)
  if (state.status === 'completed') return quip('completed')
  if (state.mode === 'break') {
    return state.status === 'running' ? quip('breakRunning') : '休息一下'
  }
  if (state.status === 'running') return quip('running', { subject: state.subject, minutes })
  if (state.status === 'paused') return quip('paused')
  return quip('idle', { subject: state.subject })
})

// 圆环颜色用主题变量，深色模式下自动调整亮度
const ringColor = computed(() => {
  if (state.mode === 'break') return '#8FB7B3'
  if (state.status === 'idle') return 'var(--color-sage-200)'
  if (state.status === 'paused') return 'var(--color-sage-300)'
  return 'var(--color-sage-400)'
})

const primaryLabel = computed(() =>
  state.status === 'running'
    ? '暂停一下'
    : state.status === 'paused'
      ? '继续专注'
      : '开始专注'
)

function onPrimary() {
  if (state.status === 'idle') startFocus()
  else if (state.status === 'running') pauseTimer()
  else if (state.status === 'paused') resumeTimer()
}

// 自定义时长输入（1~240 分钟）
function onCustomInput(e) {
  const v = parseInt(e.target.value, 10)
  if (!v) return
  settings.focusMinutes = Math.min(240, Math.max(1, v))
}

// —— 放弃（温柔确认）——
const showAbandon = ref(false)
const canSaveElapsed = computed(() => elapsedSec.value >= 60)

function savePartial() {
  showAbandon.value = false
  abandonSession(true)
}
function discardSession() {
  showAbandon.value = false
  abandonSession(false)
}
</script>

<template>
  <div class="max-w-md mx-auto px-5 pt-8 pb-32">
    <!-- 顶部问候：正向、无压力 -->
    <header>
      <h1 class="text-xl font-semibold tracking-wide">零焦虑番茄</h1>
      <p class="mt-1 text-sm text-ink-400">{{ greeting() }}，今天也慢慢来就好</p>
      <p class="mt-0.5 text-xs text-ink-300">{{ formatDateCN() }}</p>
    </header>

    <!-- 本轮绑定：科目 + 任务 -->
    <section class="mt-6">
      <div class="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 pb-1">
        <button
          v-for="s in SUBJECTS"
          :key="s.name"
          class="chip shrink-0 flex items-center gap-1.5"
          :class="state.subject === s.name ? 'chip-on' : ''"
          @click="state.subject = s.name"
        >
          <span class="w-2 h-2 rounded-full" :style="{ background: s.color }"></span>
          {{ s.name }}
        </button>
      </div>
      <select
        v-model="state.taskId"
        class="mt-3 w-full bg-surface border border-sand-200 rounded-2xl px-3.5 py-2.5 text-sm outline-none focus:border-sage-400"
      >
        <option value="">自由专注（不绑定任务）</option>
        <option v-for="t in activeTasks" :key="t.id" :value="t.id">{{ t.title }}</option>
      </select>
      <button
        v-if="activeTasks.length === 0"
        class="mt-2 text-xs text-sage-600"
        @click="setTab('tasks')"
      >
        还没有任务？去新建一个
      </button>
    </section>

    <!-- 大尺寸计时器 -->
    <section class="mt-8 flex flex-col items-center">
      <TimerRing :progress="isIdleFocus ? 1 : progress" :color="ringColor" :size="300">
        <span class="text-6xl font-light tabular tracking-wide text-ink-900">{{ displayTime }}</span>
        <span class="mt-2 text-sm text-ink-400">{{ statusText }}</span>
      </TimerRing>
      <p v-if="isIdleFocus" class="mt-3 text-xs text-ink-400">
        本轮计划 {{ settings.focusMinutes }} 分钟
      </p>
    </section>

    <!-- 完成提示卡（正向、无压力） -->
    <section
      v-if="state.status === 'completed'"
      class="mt-8 bg-surface rounded-3xl px-6 py-6 text-center shadow-sm border border-sand-200"
    >
      <p class="text-base font-medium">这一轮专注完成啦</p>
      <p class="mt-1.5 text-xs text-ink-400">
        已记录 · {{ state.lastDone?.subject }} · {{ state.lastDone?.min }} 分钟
      </p>

      <!-- 掉落的新卡牌（正向奖励展示） -->
      <div
        v-if="state.lastDroppedCard"
        class="mt-4 bg-sage-50 border border-sage-200 rounded-xl px-3 py-2.5 flex items-center gap-2.5 text-left"
      >
        <span
          class="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-semibold shrink-0"
          :style="{ background: state.lastDroppedCard.color }"
        >
          {{ state.lastDroppedCard.char }}
        </span>
        <div class="min-w-0">
          <p class="text-xs font-medium text-sage-700 truncate">
            掉落新卡牌 · {{ state.lastDroppedCard.name }}
          </p>
          <p class="text-[10px] text-ink-400">已收入卡牌册，去「收集」页看看</p>
        </div>
      </div>
      <!-- 花园新元素提示 -->
      <div
        v-else-if="state.lastGrown"
        class="mt-4 bg-sage-50 border border-sage-200 rounded-xl px-3 py-2 text-xs text-sage-700"
      >
        小花园里新长出了{{ ELEMENT_LABELS[state.lastGrown.type] }}，去看看
      </div>

      <div class="mt-5 grid gap-2.5">
        <button
          v-if="!settings.continuous && settings.breakMinutes > 0"
          class="btn-primary"
          @click="startBreak()"
        >
          休息 {{ settings.breakMinutes }} 分钟
        </button>
        <button class="btn-ghost" @click="skipBreak()">
          {{ settings.continuous || settings.breakMinutes <= 0 ? '再来一轮' : '不用休息，继续专注' }}
        </button>
      </div>
    </section>

    <!-- 控制按钮 -->
    <section v-else class="mt-9 flex flex-col items-center gap-4">
      <button class="btn-primary" @click="onPrimary">{{ primaryLabel }}</button>
      <button
        v-if="state.mode === 'focus' && state.status !== 'idle'"
        class="text-sm text-ink-400 hover:text-ink-600"
        @click="showAbandon = true"
      >
        放弃本次（不算失败）
      </button>
      <button
        v-else-if="state.mode === 'break' && state.status !== 'idle'"
        class="text-sm text-ink-400"
        @click="endBreak()"
      >
        结束休息，回到专注
      </button>
    </section>

    <!-- 时长选择（仅空闲时显示，避免打断） -->
    <section v-if="isIdleFocus" class="mt-9">
      <h2 class="text-sm font-medium text-ink-900">专注时长</h2>
      <div class="mt-3 flex flex-wrap gap-2">
        <button
          v-for="m in FOCUS_PRESETS"
          :key="m"
          class="chip"
          :class="settings.focusMinutes === m && !isCustom ? 'chip-on' : ''"
          @click="settings.focusMinutes = m"
        >
          {{ m }} 分
        </button>
        <!-- 自定义时长输入 -->
        <label class="chip flex items-center gap-1" :class="isCustom ? 'chip-on' : ''">
          <input
            type="number"
            min="1"
            max="240"
            inputmode="numeric"
            class="w-12 bg-transparent outline-none text-center tabular"
            :value="isCustom ? settings.focusMinutes : ''"
            placeholder="自定义"
            @input="onCustomInput"
          />
          <span class="text-xs">{{ isCustom ? '分钟' : '' }}</span>
        </label>
      </div>

      <!-- 连续专注模式快捷开关 -->
      <div
        class="mt-4 bg-surface rounded-2xl px-4 py-3.5 flex items-center justify-between shadow-sm border border-sand-200"
      >
        <div>
          <p class="text-sm">连续专注模式</p>
          <p class="text-xs text-ink-400 mt-0.5">专注结束不提醒休息，不打断心流</p>
        </div>
        <ToggleSwitch v-model="settings.continuous" />
      </div>
    </section>

    <!-- 白噪音（随时可用，专注时可后台播放） -->
    <WhiteNoisePanel class="mt-4" />

    <!-- 轻提示（Toast） -->
    <Transition name="toast">
      <div
        v-if="state.toast"
        class="fixed bottom-24 inset-x-0 z-40 flex justify-center pointer-events-none"
      >
        <div class="bg-slate-900/90 text-white text-sm rounded-full px-5 py-2.5 whitespace-nowrap">
          {{ state.toast }}
        </div>
      </div>
    </Transition>

    <!-- 放弃确认 -->
    <GentleAbandonModal
      :visible="showAbandon"
      :can-save="canSaveElapsed"
      :elapsed-text="formatMinutes(elapsedSec)"
      @close="showAbandon = false"
      @save="savePartial"
      @discard="discardSession"
    />
  </div>
</template>