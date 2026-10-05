// 时间工具：格式化、问候语、日期换算

export function pad2(n) {
  return String(n).padStart(2, '0')
}

/** 秒 → 时钟显示："25:00" / "1:30:05"（超过 1 小时自动切换为时分秒） */
export function formatClock(totalSec) {
  const s = Math.max(0, Math.round(totalSec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return h > 0 ? `${h}:${pad2(m)}:${pad2(sec)}` : `${pad2(m)}:${pad2(sec)}`
}

/** 秒 → 友好时长："32 分钟" / "1 小时 12 分" */
export function formatMinutes(sec) {
  const min = Math.round(sec / 60)
  if (min < 60) return `${min} 分钟`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h} 小时 ${m} 分` : `${h} 小时`
}

/** 当前日期中文格式："10月5日 · 周日" */
export function formatDateCN(d = new Date()) {
  return `${d.getMonth() + 1}月${d.getDate()}日 · 周${'日一二三四五六'[d.getDay()]}`
}

/** 按时段问候 */
export function greeting(d = new Date()) {
  const h = d.getHours()
  if (h < 6) return '夜深了'
  if (h < 9) return '早上好'
  if (h < 12) return '上午好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
}

/** YYYY-MM-DD（本地时区，用于按天聚合统计） */
export function dateStr(d = new Date()) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

/** 本周周一的日期字符串（周一为一周起点） */
export function weekStartStr(base = new Date()) {
  const d = new Date(base)
  const day = d.getDay() // 0=周日 1=周一 ...
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return dateStr(d)
}