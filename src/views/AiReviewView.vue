<script setup>
// =====================================================================
// AI 每日复盘（二级页面，从「我的」页进入）
// - 未配置 API：显示配置表单（密钥只存本机，MVP 留空由用户填入）
// - 已配置：展示本周数据一览 → 生成鼓励式复盘 → 当天结果缓存
// - 全程温柔文案：报错也是「没连上，检查一下就好」，绝不制造焦虑
// =====================================================================
import { ref, computed } from 'vue'
import { settings } from '../store/settings'
import { aiLogState, saveAiLog } from '../store/ai'
import { totalWeekSec, weekBySubject, streakDays, weekByPeriod } from '../composables/useStats'
import { formatMinutes, dateStr } from '../utils/time'
import { renderMd } from '../utils/markdown'
import { callAiReview, DEFAULT_SYSTEM_PROMPT } from '../utils/ai'

const emit = defineEmits(['back'])

// —— 配置表单 ——
const form = ref({
  baseUrl: settings.ai.baseUrl,
  apiKey: settings.ai.apiKey,
  model: settings.ai.model,
  prompt: settings.ai.prompt,
})
const needConfig = computed(() => !settings.ai.baseUrl || !settings.ai.apiKey)

function saveConfig() {
  settings.ai.baseUrl = form.value.baseUrl.trim()
  settings.ai.apiKey = form.value.apiKey.trim()
  settings.ai.model = form.value.model.trim()
  settings.ai.prompt = form.value.prompt.trim()
}

// —— 复盘生成 ——
const loading = ref(false)
const error = ref('')
const today = dateStr()
const hasToday = computed(() => aiLogState.date === today && aiLogState.content)
const aiHtml = computed(() => renderMd(aiLogState.content))

// 本周数据摘要（发给 AI 的内容）
function buildUserContent() {
  const subjects = weekBySubject.value.map((s) => `${s.name} ${formatMinutes(s.sec)}`).join('、')
  const periods = weekByPeriod.value
    .filter((p) => p.sec > 0)
    .map((p) => `${p.name} ${formatMinutes(p.sec)}`)
    .join('、')
  return [
    `今天是${today}。`,
    `学生本周共专注 ${formatMinutes(totalWeekSec.value)}，连续专注 ${streakDays.value} 天。`,
    subjects ? `各科专注时长：${subjects}。` : '本周还没有专注记录。',
    periods ? `专注时段分布：${periods}。` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

async function generate() {
  loading.value = true
  error.value = ''
  try {
    const content = await callAiReview(
      {
        baseUrl: settings.ai.baseUrl,
        apiKey: settings.ai.apiKey,
        model: settings.ai.model,
      },
      settings.ai.prompt,
      buildUserContent()
    )
    saveAiLog(today, content)
  } catch (e) {
    error.value =
      e.name === 'AbortError'
        ? '请求超时了。检查网络，或换个接口地址再试试'
        : '没能拿到 AI 回复。检查接口地址、密钥和模型名后重试'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-md mx-auto px-5 pt-6 pb-32">
    <!-- 顶部返回 -->
    <header class="flex items-center gap-3">
      <button
        class="w-9 h-9 rounded-full bg-surface border border-sand-200 flex items-center justify-center text-ink-600"
        aria-label="返回"
        @click="emit('back')"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 5l-7 7 7 7" />
        </svg>
      </button>
      <div>
        <h1 class="text-lg font-semibold tracking-wide">AI 每日复盘</h1>
        <p class="text-xs text-ink-400">基于本周专注数据，说点温柔的</p>
      </div>
    </header>

    <!-- ============ 未配置：API 配置表单 ============ -->
    <section v-if="needConfig" class="mt-6 bg-surface rounded-2xl px-5 py-5 shadow-sm border border-sand-200">
      <h2 class="text-sm font-medium">接入你的 AI 接口</h2>
      <p class="mt-1 text-xs text-ink-400 leading-relaxed">
        支持任意 OpenAI 格式接口（OpenAI / DeepSeek / 通义 / 智谱等）。密钥只保存在本机浏览器
        LocalStorage，不会发送到任何其他服务器。
      </p>
      <div class="mt-4 space-y-3">
        <label class="block">
          <span class="text-xs text-ink-600">接口地址 Base URL</span>
          <input
            v-model="form.baseUrl"
            type="text"
            placeholder="https://api.openai.com/v1"
            class="mt-1 w-full bg-sand-50 rounded-xl px-3 py-2.5 text-sm outline-none border border-sand-200 focus:border-sage-400"
          />
        </label>
        <label class="block">
          <span class="text-xs text-ink-600">API Key</span>
          <input
            v-model="form.apiKey"
            type="password"
            placeholder="sk-..."
            class="mt-1 w-full bg-sand-50 rounded-xl px-3 py-2.5 text-sm outline-none border border-sand-200 focus:border-sage-400"
          />
        </label>
        <label class="block">
          <span class="text-xs text-ink-600">模型名（可选）</span>
          <input
            v-model="form.model"
            type="text"
            placeholder="留空默认 gpt-4o-mini"
            class="mt-1 w-full bg-sand-50 rounded-xl px-3 py-2.5 text-sm outline-none border border-sand-200 focus:border-sage-400"
          />
        </label>
        <label class="block">
          <span class="text-xs text-ink-600">自定义提示词（可选）</span>
          <textarea
            v-model="form.prompt"
            rows="3"
            :placeholder="DEFAULT_SYSTEM_PROMPT.slice(0, 60) + '……（留空使用默认鼓励式提示词）'"
            class="mt-1 w-full bg-sand-50 rounded-xl px-3 py-2.5 text-sm outline-none border border-sand-200 focus:border-sage-400 resize-none"
          ></textarea>
        </label>
      </div>
      <button
        class="btn-primary w-full mt-4"
        :disabled="!form.baseUrl.trim() || !form.apiKey.trim()"
        @click="saveConfig"
      >
        保存配置
      </button>
    </section>

    <!-- ============ 已配置：复盘主界面 ============ -->
    <template v-else>
      <!-- 本周数据一览 -->
      <section class="mt-5 bg-surface rounded-2xl px-5 py-4 shadow-sm border border-sand-200">
        <h2 class="text-sm font-medium">本周数据一览</h2>
        <div class="mt-3 flex flex-wrap gap-2 text-xs">
          <span class="bg-sage-100 text-sage-700 rounded-full px-3 py-1.5">
            共专注 {{ formatMinutes(totalWeekSec) }}
          </span>
          <span class="bg-sage-100 text-sage-700 rounded-full px-3 py-1.5">
            连续 {{ streakDays }} 天
          </span>
          <span
            v-for="s in weekBySubject.slice(0, 3)"
            :key="s.name"
            class="bg-surface border border-sand-200 text-ink-600 rounded-full px-3 py-1.5 flex items-center gap-1.5"
          >
            <span class="w-1.5 h-1.5 rounded-full" :style="{ background: s.color }"></span>
            {{ s.name }} {{ formatMinutes(s.sec) }}
          </span>
        </div>
      </section>

      <!-- 今日复盘结果（缓存展示） -->
      <section v-if="hasToday" class="mt-4 bg-surface rounded-2xl px-5 py-4 shadow-sm border border-sand-200">
        <div class="flex items-baseline justify-between">
          <h2 class="text-sm font-medium">今日复盘</h2>
          <button class="text-xs text-sage-600" :disabled="loading" @click="generate">重新生成</button>
        </div>
        <div class="ai-md mt-2 text-sm text-ink-600" v-html="aiHtml"></div>
      </section>

      <!-- 生成按钮 / loading / 错误 -->
      <section v-else class="mt-4 bg-surface rounded-2xl px-5 py-5 shadow-sm border border-sand-200 text-center">
        <div v-if="loading" class="py-4">
          <div class="mx-auto w-7 h-7 rounded-full border-2 border-sage-200 border-t-sage-500 animate-spin"></div>
          <p class="mt-3 text-sm text-ink-600">AI 正在为你写今天的复盘…</p>
        </div>
        <template v-else>
          <p class="text-sm text-ink-600">一天结束啦，让 AI 陪你回顾一下今天</p>
          <p v-if="error" class="mt-3 text-xs text-ink-400 bg-sand-100 rounded-xl px-3 py-2.5 leading-relaxed">
            {{ error }}
          </p>
          <button class="btn-primary mt-4" @click="generate">生成今日复盘</button>
        </template>
      </section>
    </template>
  </div>
</template>