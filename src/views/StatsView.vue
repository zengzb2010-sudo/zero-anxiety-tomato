<script setup>
// =====================================================================
// 统计页：只做正向统计 —— 绝不出现失败率/未完成率等负面指标
// 亮点卡片（连续专注/今日/本周/单次最长） + 科目环形饼图
// + 本周日历热力图 + 专注时段分布 + CSV 导出
// =====================================================================
import { ref, computed, inject } from 'vue'
import DonutChart from '../components/DonutChart.vue'
import WeekHeatmap from '../components/WeekHeatmap.vue'
import { recordsState } from '../store/records'
import {
  totalTodaySec,
  totalWeekSec,
  weekBySubject,
  weekByDay,
  weekByPeriod,
  streakDays,
  longestSec,
} from '../composables/useStats'
import { formatMinutes } from '../utils/time'
import { exportRecordsCsv } from '../utils/csv'

const setTab = inject('setTab')

// —— 亮点数据文案（0 值用温和措辞，不制造压力） ——
const hasWeekData = computed(() => totalWeekSec.value > 0)
const streakText = computed(() => (streakDays.value > 0 ? `${streakDays.value} 天` : '待开启'))
const longestText = computed(() => (longestSec.value > 0 ? formatMinutes(longestSec.value) : '—'))

// 时段分布条的最大值（避免除零）
const maxPeriodSec = computed(() => Math.max(1, ...weekByPeriod.value.map((p) => p.sec)))

// —— CSV 导出（带轻提示反馈） ——
const exportTip = ref(false)
function onExport() {
  if (recordsState.list.length === 0) {
    exportTip.value = true
    setTimeout(() => (exportTip.value = false), 3000)
    return
  }
  exportRecordsCsv(recordsState.list)
  exportTip.value = true
  setTimeout(() => (exportTip.value = false), 3000)
}
</script>

<template>
  <div class="max-w-md mx-auto px-5 pt-8 pb-32">
    <!-- 顶部 -->
    <header>
      <h1 class="text-xl font-semibold tracking-wide">统计</h1>
      <p class="mt-1 text-sm text-ink-400">只记收获，不问瑕疵</p>
    </header>

    <!-- 亮点卡片：全部正向数据 -->
    <section class="mt-5 grid grid-cols-2 gap-2.5">
      <div class="bg-surface rounded-2xl px-4 py-4 shadow-sm border border-sand-200">
        <p class="text-xl font-medium tabular">{{ streakText }}</p>
        <p class="mt-1 text-xs text-ink-400">连续专注</p>
      </div>
      <div class="bg-surface rounded-2xl px-4 py-4 shadow-sm border border-sand-200">
        <p class="text-xl font-medium tabular">{{ formatMinutes(totalTodaySec) }}</p>
        <p class="mt-1 text-xs text-ink-400">今日专注</p>
      </div>
      <div class="bg-surface rounded-2xl px-4 py-4 shadow-sm border border-sand-200">
        <p class="text-xl font-medium tabular">{{ formatMinutes(totalWeekSec) }}</p>
        <p class="mt-1 text-xs text-ink-400">本周专注</p>
      </div>
      <div class="bg-surface rounded-2xl px-4 py-4 shadow-sm border border-sand-200">
        <p class="text-xl font-medium tabular">{{ longestText }}</p>
        <p class="mt-1 text-xs text-ink-400">单次最长</p>
      </div>
    </section>

    <!-- 本周科目分布：环形饼图 + 图例 -->
    <section class="mt-4 bg-surface rounded-2xl px-5 py-4 shadow-sm border border-sand-200">
      <h2 class="text-sm font-medium">本周科目分布</h2>
      <template v-if="hasWeekData">
        <DonutChart :data="weekBySubject" :size="180" class="mt-5">
          <span class="text-2xl font-medium tabular">{{ formatMinutes(totalWeekSec) }}</span>
          <span class="mt-1 text-xs text-ink-400">本周合计</span>
        </DonutChart>
        <ul class="mt-5 space-y-2.5">
          <li v-for="s in weekBySubject" :key="s.name" class="flex items-center justify-between">
            <span class="flex items-center gap-2 text-sm text-ink-600">
              <span class="w-2.5 h-2.5 rounded-full" :style="{ background: s.color }"></span>
              {{ s.name }}
            </span>
            <span class="text-xs text-ink-400">
              {{ formatMinutes(s.sec) }} · {{ Math.round((s.sec / totalWeekSec) * 100) }}%
            </span>
          </li>
        </ul>
      </template>
      <div v-else class="mt-4 text-center py-6">
        <p class="text-sm text-ink-400">本周还没有专注记录</p>
        <button class="mt-3 btn-ghost" @click="setTab('focus')">去开始第一轮</button>
      </div>
    </section>

    <!-- 本周日历热力图 -->
    <section class="mt-4 bg-surface rounded-2xl px-5 py-4 shadow-sm border border-sand-200">
      <div class="flex items-baseline justify-between">
        <h2 class="text-sm font-medium">本周打卡</h2>
        <span class="text-[10px] text-ink-300">格内数字为分钟</span>
      </div>
      <WeekHeatmap :days="weekByDay" class="mt-4" />
    </section>

    <!-- 专注时段分布：帮助学生发现自己的效率高峰 -->
    <section class="mt-4 bg-surface rounded-2xl px-5 py-4 shadow-sm border border-sand-200">
      <h2 class="text-sm font-medium">专注时段</h2>
      <p class="text-xs text-ink-400 mt-0.5">看看自己哪个时间段状态最好</p>
      <template v-if="hasWeekData">
        <div v-for="p in weekByPeriod" :key="p.name" class="mt-3">
          <div class="flex justify-between text-xs mb-1">
            <span class="text-ink-600">{{ p.name }}</span>
            <span class="text-ink-400">{{ formatMinutes(p.sec) }}</span>
          </div>
          <div class="h-2 rounded-full bg-sand-100 overflow-hidden">
            <div
              class="h-full rounded-full bg-sage-400 transition-all duration-500"
              :style="{ width: (p.sec / maxPeriodSec) * 100 + '%' }"
            ></div>
          </div>
        </div>
      </template>
      <p v-else class="mt-3 text-xs text-ink-300">本周还没有专注记录，随时可以开始第一轮~</p>
    </section>

    <!-- CSV 导出 -->
    <section class="mt-4 bg-surface rounded-2xl px-5 py-4 shadow-sm border border-sand-200">
      <h2 class="text-sm font-medium">导出数据</h2>
      <p class="text-xs text-ink-400 mt-0.5">导出全部专注记录为 CSV，可用 Excel 打开</p>
      <button class="btn-ghost w-full mt-3" @click="onExport">
        {{ recordsState.list.length > 0 ? '导出专注记录 CSV' : '还没有记录可导出' }}
      </button>
    </section>

    <!-- 导出轻提示 -->
    <Transition name="toast">
      <div v-if="exportTip" class="fixed bottom-24 inset-x-0 z-40 flex justify-center pointer-events-none">
        <div class="bg-slate-900/90 text-white text-sm rounded-full px-5 py-2.5 whitespace-nowrap">
          {{ recordsState.list.length > 0 ? '已导出，可在浏览器下载中查看' : '还没有专注记录，先去开始一轮吧' }}
        </div>
      </div>
    </Transition>
  </div>
</template>