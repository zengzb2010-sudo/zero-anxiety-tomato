// =====================================================================
// 专注统计计算层（纯正向统计：不计算任何失败率/未完成率等负面指标）
// 供「任务卡片累计时长」「统计页图表」「AI 复盘」复用
// =====================================================================
import { computed } from 'vue'
import { recordsState } from '../store/records'
import { SUBJECTS } from '../constants'
import { dateStr, weekStartStr } from '../utils/time'

/** 毫秒时间戳 → 本地 Date */
const toDate = (ts) => new Date(ts)

// —— 按任务统计（任务卡片显示已投入时长） ——

/** { taskId: 累计专注秒数 }（含半专注记录，都是真实投入） */
export const taskSecMap = computed(() => {
  const map = {}
  for (const r of recordsState.list) {
    if (r.taskId) map[r.taskId] = (map[r.taskId] || 0) + r.durationSec
  }
  return map
})

// —— 今日 / 本周总量 ——

/** 今日专注总秒数 */
export const totalTodaySec = computed(() => {
  const t = dateStr()
  return recordsState.list
    .filter((r) => dateStr(toDate(r.startedAt)) === t)
    .reduce((s, r) => s + r.durationSec, 0)
})

/** 本周（周一起）专注总秒数 */
export const totalWeekSec = computed(() => {
  const t = dateStr()
  const ws = weekStartStr()
  return recordsState.list
    .filter((r) => {
      const d = dateStr(toDate(r.startedAt))
      return d >= ws && d <= t
    })
    .reduce((s, r) => s + r.durationSec, 0)
})

// —— 本周按科目（饼图数据） ——

/** 本周各科专注秒数（只返回有数据的科目，按时长降序） */
export const weekBySubject = computed(() => {
  const t = dateStr()
  const ws = weekStartStr()
  const map = {}
  for (const r of recordsState.list) {
    const d = dateStr(toDate(r.startedAt))
    if (d < ws || d > t) continue
    map[r.subject] = (map[r.subject] || 0) + r.durationSec
  }
  return SUBJECTS.map((s) => ({ ...s, sec: map[s.name] || 0 }))
    .filter((x) => x.sec > 0)
    .sort((a, b) => b.sec - a.sec)
})

// —— 本周逐日（日历热力图数据，周一 ~ 周日） ——

export const weekByDay = computed(() => {
  const t = dateStr()
  const base = new Date()
  // 本周周一
  const day = base.getDay()
  const monday = new Date(base)
  monday.setDate(base.getDate() + (day === 0 ? -6 : 1 - day))

  const labels = ['一', '二', '三', '四', '五', '六', '日']
  const days = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const ds = dateStr(d)
    days.push({
      date: ds,
      label: labels[i],
      sec: 0,
      isToday: ds === t,
      isFuture: ds > t, // 未来的天不显示，避免「空白 = 没学」的隐性质问
    })
  }
  for (const r of recordsState.list) {
    const f = days.find((x) => x.date === dateStr(toDate(r.startedAt)))
    if (f) f.sec += r.durationSec
  }
  return days
})

// —— 专注时段分布（帮助学生发现自己的效率高峰，纯正向） ——

const PERIOD_NAMES = ['清晨', '上午', '下午', '夜晚']
// 清晨 5-9 / 上午 9-12 / 下午 12-18 / 夜晚 18-次日5点
function periodOf(h) {
  if (h >= 5 && h < 9) return '清晨'
  if (h >= 9 && h < 12) return '上午'
  if (h >= 12 && h < 18) return '下午'
  return '夜晚'
}

/** 本周各时段专注秒数（清晨/上午/下午/夜晚） */
export const weekByPeriod = computed(() => {
  const t = dateStr()
  const ws = weekStartStr()
  const map = { 清晨: 0, 上午: 0, 下午: 0, 夜晚: 0 }
  for (const r of recordsState.list) {
    const d = toDate(r.startedAt)
    const ds = dateStr(d)
    if (ds < ws || ds > t) continue
    map[periodOf(d.getHours())] += r.durationSec
  }
  return PERIOD_NAMES.map((name) => ({ name, sec: map[name] }))
})

// —— 亮点数据（只挑正向的说） ——

/** 连续专注天数：今天还没专注不算中断，从昨天起往回数 */
export const streakDays = computed(() => {
  const set = new Set(recordsState.list.map((r) => dateStr(toDate(r.startedAt))))
  let streak = 0
  const cur = new Date()
  if (!set.has(dateStr(cur))) cur.setDate(cur.getDate() - 1)
  while (set.has(dateStr(cur))) {
    streak++
    cur.setDate(cur.getDate() - 1)
  }
  return streak
})

/** 单次最长专注秒数（个人最好成绩） */
export const longestSec = computed(() =>
  recordsState.list.reduce((m, r) => Math.max(m, r.durationSec), 0)
)