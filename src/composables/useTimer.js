// =====================================================================
// 计时核心（模块级单例 composable）
// 设计要点：
// 1. 基于时间戳（endAt）计算剩余时间，而不是简单累减 ——
//    即使浏览器标签页被节流、甚至中途关闭浏览器，恢复后时间依然准确；
// 2. 运行状态持久化到 LocalStorage：刷新页面/误关页面后自动恢复计时；
// 3. 放弃 = 温柔确认，只询问"是否保存已专注时长"，不记录失败、不扣分；
// 4. 专注完成自动写入记录（绑定科目/任务），连续专注模式下不提醒休息。
// =====================================================================
import { reactive, computed, ref, watch } from 'vue'
import { settings } from '../store/settings'
import { tasksState } from '../store/tasks'
import { addRecord } from '../store/records'
import { dropCard } from '../store/cards'
import { growGarden } from '../store/garden'
import { playChime } from '../utils/audio'
import { formatClock } from '../utils/time'
import { quip } from '../utils/quips'
import { notifyComplete } from '../utils/notify'
import { STORE_KEYS } from '../constants'

// —— 当前计时状态 ——
const state = reactive({
  mode: 'focus', // 'focus' 专注 | 'break' 休息
  status: 'idle', // 'idle' 待开始 | 'running' 进行中 | 'paused' 已暂停 | 'completed' 刚完成一轮
  totalMs: 0, // 本段计划时长（毫秒）
  remainingMs: 0, // 暂停/待开始时的剩余时长（毫秒）
  endAt: 0, // 运行中：计划结束的时间戳
  startedAt: 0, // 本段开始时间戳（用于生成记录）
  subject: '其他', // 当前绑定的科目
  taskId: '', // 当前绑定的任务 id（空 = 自由专注）
  taskTitle: '',
  lastDone: null, // 最近完成的一轮信息 { subject, min }，供完成提示卡展示
  lastDroppedCard: null, // 本轮掉落的卡牌（完成提示卡里展示）
  lastGrown: null, // 本轮花园长出的新元素
  toast: '', // 轻提示文字（自动消失）
})

// 当前时间（每 250ms 刷新一次，驱动 computed 重算）
const now = ref(Date.now())

// 实际剩余毫秒：运行中按 endAt 实时推算，暂停时读快照
const currentRemainingMs = computed(() =>
  state.status === 'running' ? Math.max(0, state.endAt - now.value) : state.remainingMs
)

// —— 对外的响应式数据 ——
export const remainingSec = computed(() => currentRemainingMs.value / 1000)
export const progress = computed(() =>
  state.totalMs ? remainingSec.value / (state.totalMs / 1000) : 1
)
export const displayTime = computed(() => formatClock(remainingSec.value))
// 本段已实际专注的秒数（用于放弃时的"半专注"提示与记录）
export const elapsedSec = computed(() =>
  Math.max(0, Math.round((state.totalMs - currentRemainingMs.value) / 1000))
)

// 切换任务时同步任务标题
watch(
  () => state.taskId,
  (id) => {
    const t = tasksState.list.find((x) => x.id === id)
    state.taskTitle = t ? t.title : ''
  }
)

// 已绑定的任务被完成/删除后自动解绑，避免记录挂到不可见任务上
watch(
  () => tasksState.list.map((t) => `${t.id}:${t.completed ? 1 : 0}`).join('|'),
  () => {
    if (state.taskId && !tasksState.list.some((t) => t.id === state.taskId && !t.completed)) {
      state.taskId = ''
      state.taskTitle = ''
    }
  }
)

// 空闲状态下，专注时长设置变化时同步环上显示的时长
watch(
  () => settings.focusMinutes,
  (m) => {
    if (state.status === 'idle' && state.mode === 'focus') syncIdleFocus(m)
  }
)

// 轻提示自动消失
let toastTimer = null
watch(
  () => state.toast,
  (v) => {
    if (!v) return
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => {
      state.toast = ''
    }, 3200)
  }
)

// —— 内部工具 ——

/** 空闲专注态：按设置同步计划时长 */
function syncIdleFocus(min) {
  state.totalMs = (min || 25) * 60000
  state.remainingMs = state.totalMs
}

/** 回到"专注待开始"的空闲状态（不丢任何历史，也不产生负面记录） */
function resetToIdleFocus() {
  state.mode = 'focus'
  state.status = 'idle'
  syncIdleFocus(settings.focusMinutes)
  state.endAt = 0
  state.startedAt = 0
  state.lastDone = null
  state.lastDroppedCard = null
  state.lastGrown = null
  persistTimer()
}

/** 持久化进行中的计时（仅 running/paused 需要；其余状态清除） */
function persistTimer() {
  try {
    if (state.status !== 'running' && state.status !== 'paused') {
      localStorage.removeItem(STORE_KEYS.timer)
      return
    }
    localStorage.setItem(
      STORE_KEYS.timer,
      JSON.stringify({
        mode: state.mode,
        status: state.status,
        totalMs: state.totalMs,
        remainingMs: currentRemainingMs.value,
        endAt: state.endAt,
        startedAt: state.startedAt,
        subject: state.subject,
        taskId: state.taskId,
        taskTitle: state.taskTitle,
      })
    )
  } catch (e) {
    /* 忽略存储异常 */
  }
}

/** 一段计时自然结束（专注 → 记录；休息 → 回到专注空闲态） */
function completeSegment() {
  const durationSec = Math.max(
    1,
    Math.round((state.totalMs - currentRemainingMs.value) / 1000)
  )
  if (state.mode === 'focus') {
    // 完整完成：写入正向记录
    addRecord({
      type: 'full',
      subject: state.subject,
      taskId: state.taskId || null,
      taskTitle: state.taskTitle || '',
      plannedMin: Math.round(state.totalMs / 60000),
      durationSec,
      startedAt: state.startedAt || Date.now() - durationSec * 1000,
      endedAt: state.endAt || Date.now(),
    })
    if (settings.soundOn) {
      try {
        playChime('focus')
      } catch (e) {}
    }
    // 切出页面/锁屏时用系统通知轻轻提醒（前台时 toast 就够，避免重复打扰）
    if (settings.notifyOn && document.hidden) {
      notifyComplete('一轮专注完成啦', `${state.subject} · 已记录 ${Math.round(state.totalMs / 60000)} 分钟`)
    }
    state.status = 'completed'
    state.lastDone = { subject: state.subject, min: Math.round(state.totalMs / 60000) }
    // 趣味反馈：掉卡牌 + 花园长出新元素（纯正向奖励）
    state.lastDroppedCard = dropCard()
    state.lastGrown = growGarden(state.subject)
    state.toast = quip('toastDone')
    if (state.lastDroppedCard) {
      state.toast += ` · 掉落新卡牌「${state.lastDroppedCard.name}」`
    } else {
      state.toast += ' · 卡牌已集齐！'
    }
  } else {
    // 休息结束：轻轻提醒，回到专注准备态
    if (settings.soundOn) {
      try {
        playChime('break')
      } catch (e) {}
    }
    if (settings.notifyOn && document.hidden) {
      notifyComplete('休息结束啦', '准备好就可以继续下一轮')
    }
    resetToIdleFocus()
    state.toast = quip('toastBreakEnd')
  }
  persistTimer()
}

/** 页面标题实时显示剩余时间（切走标签页也能看到进度） */
let lastTitle = ''
function updateTitle() {
  const t =
    state.status === 'running'
      ? `${displayTime.value} ${state.mode === 'focus' ? '专注中' : '休息中'} · 零焦虑番茄`
      : '零焦虑番茄专注钟'
  if (t !== lastTitle) {
    document.title = t
    lastTitle = t
  }
}

/** 心跳：每 250ms 校准一次，到点自动结算 */
function tick() {
  now.value = Date.now()
  if (state.status === 'running' && now.value >= state.endAt) completeSegment()
  updateTitle()
}

// —— 页面打开时恢复上次未完成的计时 ——
function restoreTimer() {
  let d = null
  try {
    d = JSON.parse(localStorage.getItem(STORE_KEYS.timer) || 'null')
  } catch (e) {}
  now.value = Date.now()
  if (!d) {
    resetToIdleFocus()
    return
  }
  state.mode = d.mode === 'break' ? 'break' : 'focus'
  state.totalMs = d.totalMs || 0
  state.remainingMs = d.remainingMs || 0
  state.startedAt = d.startedAt || 0
  state.subject = d.subject || '其他'
  state.taskId = d.taskId || ''
  state.taskTitle = d.taskTitle || ''
  const endAt = d.endAt || 0
  if (d.status === 'running') {
    if (endAt > now.value) {
      // 计时还未结束：无缝恢复继续
      state.endAt = endAt
      state.status = 'running'
      state.toast = '上次的计时还在继续，欢迎回来'
    } else {
      // 结束时间已过（如中途关了浏览器）：按正常完成结算并记录
      state.endAt = endAt
      state.status = 'running'
      completeSegment()
    }
  } else if (d.status === 'paused') {
    state.status = 'paused'
  } else {
    resetToIdleFocus()
  }
}

// —— 对外操作 ——

/** 开始专注（时长取当前设置） */
export function startFocus() {
  state.mode = 'focus'
  state.status = 'running'
  state.totalMs = settings.focusMinutes * 60000
  state.remainingMs = state.totalMs
  state.startedAt = Date.now()
  state.endAt = state.startedAt + state.totalMs
  state.lastDone = null
  persistTimer()
}

/** 暂停（保留剩余时长，可随时继续） */
export function pauseTimer() {
  if (state.status !== 'running') return
  state.remainingMs = Math.max(0, state.endAt - now.value)
  state.status = 'paused'
  persistTimer()
}

/** 继续 */
export function resumeTimer() {
  if (state.status !== 'paused') return
  state.endAt = now.value + state.remainingMs
  state.status = 'running'
  persistTimer()
}

/**
 * 放弃本次专注（不标记失败、不扣分、不记录负面历史）
 * @param {boolean} save true=保存已专注时长（半专注记录）
 */
export function abandonSession(save) {
  if (save && state.mode === 'focus' && elapsedSec.value >= 60) {
    // 半专注记录：只记下来的时长，给用户台阶，无负罪感
    addRecord({
      type: 'partial',
      subject: state.subject,
      taskId: state.taskId || null,
      taskTitle: state.taskTitle || '',
      plannedMin: Math.round(state.totalMs / 60000),
      durationSec: elapsedSec.value,
      startedAt: state.startedAt || Date.now() - elapsedSec.value * 1000,
      endedAt: Date.now(),
    })
    // 半专注同样有正向奖励：掉卡牌 + 花园长元素
    const card = dropCard()
    growGarden(state.subject)
    state.toast = quip('toastSave')
    if (card) state.toast += ` · 掉落新卡牌「${card.name}」`
  } else {
    // 温柔告别，绝不出现失败/未完成/扣分等负面词
    state.toast = quip('toastDiscard')
  }
  resetToIdleFocus()
}

/** 专注完成后：进入休息（若开启连续专注模式，界面不会引导进来） */
export function startBreak() {
  state.mode = 'break'
  state.status = 'running'
  state.totalMs = settings.breakMinutes * 60000
  state.remainingMs = state.totalMs
  state.startedAt = Date.now()
  state.endAt = state.startedAt + state.totalMs
  state.lastDone = null
  persistTimer()
}

/** 专注完成后：跳过休息，准备下一轮 */
export function skipBreak() {
  resetToIdleFocus()
  state.toast = quip('toastAgain')
}

/** 休息进行中：提前结束休息，回到专注 */
export function endBreak() {
  resetToIdleFocus()
  state.toast = quip('toastBreakEnd')
}

// —— 模块加载时初始化 ——
restoreTimer()
setInterval(tick, 250)
window.addEventListener('beforeunload', persistTimer)
updateTitle()

// 供视图层读取的原始状态（响应式）
export { state }