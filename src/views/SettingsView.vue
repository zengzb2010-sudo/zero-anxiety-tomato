<script setup>
// 「我的」页：设置 + AI 复盘入口 + 数据管理（备份/导入/清除）
import { ref } from 'vue'
import ToggleSwitch from '../components/ToggleSwitch.vue'
import AiReviewView from './AiReviewView.vue'
import { settings } from '../store/settings'
import { BREAK_PRESETS, STORE_KEYS, APP_VERSION } from '../constants'
import { playChime } from '../utils/audio'
import { ensureNotifyPermission } from '../utils/notify'
import { exportBackup, importBackup } from '../utils/backup'

// AI 复盘二级页面开关
const showAi = ref(false)

// —— 完成通知（浏览器权限） ——
const notifyDenied = ref(false)
async function onNotifyToggle(v) {
  if (!v) {
    settings.notifyOn = false
    return
  }
  const ok = await ensureNotifyPermission()
  settings.notifyOn = ok
  notifyDenied.value = !ok
}

// —— 数据备份 ——
const fileInput = ref(null)
const backupTip = ref('')

// 导出
function onExport() {
  exportBackup()
  backupTip.value = '备份已导出，可在浏览器下载中查看'
  setTimeout(() => (backupTip.value = ''), 3000)
}

// 导入（二次确认防误覆盖）
const confirmImport = ref(false)
function onImportClick() {
  if (!confirmImport.value) {
    confirmImport.value = true
    setTimeout(() => {
      confirmImport.value = false
    }, 4000)
    return
  }
  confirmImport.value = false
  fileInput.value?.click()
}

async function onImportFile(e) {
  const file = e.target.files?.[0]
  e.target.value = '' // 允许重复选择同一文件
  if (!file) return
  try {
    await importBackup(file)
    location.reload()
  } catch (err) {
    backupTip.value = '导入失败：文件格式不对，请选择本应用导出的备份文件'
    setTimeout(() => (backupTip.value = ''), 3000)
  }
}

// —— 清除本地数据（二次确认，防误触） ——
const confirmClear = ref(false)
function onClear() {
  if (!confirmClear.value) {
    confirmClear.value = true
    setTimeout(() => {
      confirmClear.value = false
    }, 4000)
    return
  }
  // 清除全部本地数据后刷新（仅此一次，产品刻意不提供"误删恢复"）
  Object.values(STORE_KEYS).forEach((k) => localStorage.removeItem(k))
  location.reload()
}
</script>

<template>
  <!-- ============ AI 复盘二级页面 ============ -->
  <AiReviewView v-if="showAi" @back="showAi = false" />

  <div v-else class="max-w-md mx-auto px-5 pt-8 pb-32">
    <h1 class="text-xl font-semibold tracking-wide">我的</h1>

    <!-- 外观：浅色 / 深色 / 跟随系统 -->
    <section class="mt-5 bg-surface rounded-2xl px-5 py-4 shadow-sm border border-sand-200">
      <h2 class="text-sm font-medium">外观</h2>
      <p class="text-xs text-ink-400 mt-1">深色模式低亮度护眼配色，夜间自习更舒服</p>
      <div class="mt-3 bg-sand-100 rounded-full p-1 grid grid-cols-3">
        <button
          v-for="opt in [
            { key: 'light', label: '浅色' },
            { key: 'dark', label: '深色' },
            { key: 'system', label: '跟随系统' },
          ]"
          :key="opt.key"
          class="py-2 rounded-full text-xs transition-colors"
          :class="settings.theme === opt.key ? 'bg-surface text-ink-900 shadow-sm font-medium' : 'text-ink-400'"
          @click="settings.theme = opt.key"
        >
          {{ opt.label }}
        </button>
      </div>
    </section>

    <!-- AI 每日复盘入口 -->
    <section class="mt-5 bg-surface rounded-2xl px-5 py-4 shadow-sm border border-sand-200">
      <button class="w-full flex items-center justify-between text-left" @click="showAi = true">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-sage-100 flex items-center justify-center text-sage-600">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 5c-4 0-7 2-7.5 5.5.6 1 1.6 1.8 3 2.2-.3 1.2-.8 2.2-1.5 3.3 1.5-.5 2.8-1.3 3.7-2.4C10.4 13.8 11.2 14 12 14c4 0 7-2 7.5-5.5C19 7 16 5 12 5z" />
            </svg>
          </div>
          <div>
            <h2 class="text-sm font-medium">AI 每日复盘</h2>
            <p class="text-xs text-ink-400 mt-0.5">基于本周数据，生成鼓励式复盘</p>
          </div>
        </div>
        <span class="text-ink-300">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </button>
    </section>

    <!-- 提示音设置 -->
    <section class="mt-4 bg-surface rounded-2xl px-5 py-4 shadow-sm border border-sand-200">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-sm font-medium">结束提示音</h2>
          <p class="text-xs text-ink-400 mt-1">专注完成时播放轻柔的「叮咚」声</p>
        </div>
        <ToggleSwitch v-model="settings.soundOn" />
      </div>
      <button
        v-if="settings.soundOn"
        class="mt-3 text-xs text-sage-600"
        @click="playChime('focus')"
      >
        试听一下
      </button>
    </section>

    <!-- 休息时长设置 -->
    <section class="mt-4 bg-surface rounded-2xl px-5 py-4 shadow-sm border border-sand-200">
      <h2 class="text-sm font-medium">休息时长</h2>
      <p class="text-xs text-ink-400 mt-1">完成一轮专注后的建议休息时长</p>
      <div class="mt-3 flex flex-wrap gap-2">
        <button
          v-for="m in BREAK_PRESETS"
          :key="m"
          class="chip"
          :class="settings.breakMinutes === m ? 'chip-on' : ''"
          @click="settings.breakMinutes = m"
        >
          {{ m }} 分
        </button>
      </div>
    </section>

    <!-- 连续专注模式 -->
    <section class="mt-4 bg-surface rounded-2xl px-5 py-4 shadow-sm border border-sand-200">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-sm font-medium">连续专注模式</h2>
          <p class="text-xs text-ink-400 mt-1">关闭休息提醒，专注到底不被打断</p>
        </div>
        <ToggleSwitch v-model="settings.continuous" />
      </div>
    </section>

    <!-- 完成通知 -->
    <section class="mt-4 bg-surface rounded-2xl px-5 py-4 shadow-sm border border-sand-200">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-sm font-medium">完成通知</h2>
          <p class="text-xs text-ink-400 mt-1">切出页面时，用系统通知轻轻提醒专注完成</p>
        </div>
        <ToggleSwitch :checked="settings.notifyOn" @update:checked="onNotifyToggle" />
      </div>
      <p v-if="notifyDenied" class="mt-2 text-xs text-ink-400">
        浏览器未授权通知，可到浏览器隐私设置里重新开启
      </p>
    </section>

    <!-- 数据管理 -->
    <section class="mt-4 bg-surface rounded-2xl px-5 py-4 shadow-sm border border-sand-200">
      <h2 class="text-sm font-medium">数据管理</h2>
      <p class="text-xs text-ink-400 mt-1">所有数据仅保存在本机浏览器，删除前建议先导出备份</p>
      <div class="mt-3 flex gap-2">
        <button class="btn-ghost flex-1 !py-2 text-xs" @click="onExport">导出备份</button>
        <button
          class="btn-ghost flex-1 !py-2 text-xs transition-colors"
          :class="confirmImport ? 'danger-soft font-medium' : ''"
          @click="onImportClick"
        >
          {{ confirmImport ? '确认覆盖导入？' : '导入备份' }}
        </button>
        <button
          class="flex-1 text-xs px-3 py-2 rounded-full transition-colors"
          :class="confirmClear ? 'danger-soft font-medium' : 'text-ink-400 bg-sand-100'"
          @click="onClear"
        >
          {{ confirmClear ? '确认清除全部？' : '清除数据' }}
        </button>
      </div>
      <input ref="fileInput" type="file" accept="application/json,.json" class="hidden" @change="onImportFile" />
      <p v-if="backupTip" class="mt-2 text-xs text-sage-600">{{ backupTip }}</p>
    </section>

    <p class="mt-8 text-center text-xs text-ink-300 leading-relaxed">
      零焦虑番茄 · 无广告、无惩罚、纯本地存储 · v{{ APP_VERSION }}<br />祝你今天也有稳稳的进步
    </p>
  </div>
</template>