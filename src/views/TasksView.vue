<script setup>
// =====================================================================
// 任务页：任务&科目管理
// - 新建任务（标题 + 科目）
// - 已完成勾选（纯正向标记，完成的沉底、划线淡化）
// - 每张卡片显示该任务已投入的累计专注时长
// - 删除二次确认（防误删），历史记录不受影响
// =====================================================================
import { ref, computed } from 'vue'
import { tasksState, addTask, toggleTask, removeTask } from '../store/tasks'
import { taskSecMap } from '../composables/useStats'
import { SUBJECTS, subjectColor } from '../constants'
import { formatMinutes } from '../utils/time'

// —— 新建任务表单 ——
const showForm = ref(false)
const newTitle = ref('')
const newSubject = ref('语文')

function onSubmit() {
  const t = addTask(newTitle.value, newSubject.value)
  if (t) {
    newTitle.value = ''
    newSubject.value = '语文'
    showForm.value = false
  }
}

// —— 删除二次确认：点一次变红「确认删除」，再点一次才真正删，3 秒后自动复位 ——
const confirmDeleteId = ref('')
function onDeleteClick(id) {
  if (confirmDeleteId.value === id) {
    removeTask(id)
    confirmDeleteId.value = ''
  } else {
    confirmDeleteId.value = id
    setTimeout(() => {
      if (confirmDeleteId.value === id) confirmDeleteId.value = ''
    }, 3000)
  }
}

// 未完成在前（按创建时间倒序），已完成沉底
const sortedTasks = computed(() => {
  const list = [...tasksState.list]
  return list.sort(
    (a, b) => (a.completed ? 1 : 0) - (b.completed ? 1 : 0) || b.createdAt - a.createdAt
  )
})

const doneCount = computed(() => tasksState.list.filter((t) => t.completed).length)

// 某任务的累计专注
function taskSec(id) {
  return taskSecMap.value[id] || 0
}
</script>

<template>
  <div class="max-w-md mx-auto px-5 pt-8 pb-32">
    <!-- 顶部 -->
    <header class="flex items-end justify-between">
      <h1 class="text-xl font-semibold tracking-wide">任务</h1>
      <p class="text-xs text-ink-400">
        共 {{ tasksState.list.length }} 个{{ doneCount > 0 ? ` · 已完成 ${doneCount}` : '' }}
      </p>
    </header>

    <!-- 新建任务按钮 / 表单 -->
    <button
      v-if="!showForm"
      class="mt-5 w-full bg-surface rounded-2xl px-4 py-3.5 text-sm text-sage-600 border border-dashed border-sage-300 shadow-sm"
      @click="showForm = true"
    >
      + 新建任务
    </button>

    <form
      v-else
      class="mt-5 bg-surface rounded-2xl px-4 py-4 shadow-sm border border-sand-200"
      @submit.prevent="onSubmit"
    >
      <input
        v-model="newTitle"
        type="text"
        maxlength="30"
        placeholder="任务名，如：背 30 个英语单词"
        class="w-full bg-sand-50 rounded-xl px-3 py-2.5 text-sm outline-none border border-sand-200 focus:border-sage-400"
      />
      <!-- 科目选择 -->
      <div class="mt-3 flex flex-wrap gap-1.5">
        <button
          v-for="s in SUBJECTS"
          :key="s.name"
          type="button"
          class="chip !py-1.5 !px-3"
          :class="newSubject === s.name ? 'chip-on' : ''"
          @click="newSubject = s.name"
        >
          {{ s.name }}
        </button>
      </div>
      <div class="mt-4 flex gap-2.5">
        <button type="submit" class="btn-ghost flex-1 !bg-sage-500 !text-white" :disabled="!newTitle.trim()">
          添加任务
        </button>
        <button type="button" class="btn-ghost flex-1" @click="showForm = false">取消</button>
      </div>
    </form>

    <!-- 任务列表 -->
    <ul class="mt-4 space-y-2.5">
      <li
        v-for="t in sortedTasks"
        :key="t.id"
        class="bg-surface rounded-2xl px-4 py-3.5 shadow-sm border border-sand-200 flex items-center gap-3"
      >
        <!-- 完成勾选（正向标记） -->
        <button
          class="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
          :class="t.completed ? 'bg-sage-500 border-sage-500 text-white' : 'border-sand-200 text-transparent'"
          :aria-label="t.completed ? '标记为未完成' : '标记为已完成'"
          @click="toggleTask(t.id)"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4.5 12.5l5 5L19.5 7" />
          </svg>
        </button>

        <!-- 标题 + 科目 + 累计专注 -->
        <div class="flex-1 min-w-0">
          <p
            class="text-sm truncate"
            :class="t.completed ? 'line-through text-ink-300' : 'text-ink-900'"
          >
            {{ t.title }}
          </p>
          <p class="mt-1 flex items-center gap-2 text-xs text-ink-400">
            <span class="inline-flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full" :style="{ background: subjectColor(t.subject) }"></span>
              {{ t.subject }}
            </span>
            <!-- 累计投入：纯正向展示，无任何负面数据 -->
            <span v-if="taskSec(t.id) > 0" class="text-sage-600">
              已专注 {{ formatMinutes(taskSec(t.id)) }}
            </span>
          </p>
        </div>

        <!-- 删除（二次确认） -->
        <button
          class="shrink-0 text-xs px-2 py-1 rounded-full transition-colors"
          :class="confirmDeleteId === t.id ? 'danger-soft font-medium' : 'text-ink-300'"
          @click="onDeleteClick(t.id)"
        >
          {{ confirmDeleteId === t.id ? '确认删除？' : '删除' }}
        </button>
      </li>
    </ul>

    <!-- 空状态：温柔引导 -->
    <div
      v-if="tasksState.list.length === 0 && !showForm"
      class="mt-6 text-center py-6"
    >
      <p class="text-sm text-ink-400">还没有任务</p>
      <p class="mt-1 text-xs text-ink-300">先列一个小目标吧，比如「今晚背 30 个单词」</p>
    </div>
  </div>
</template>