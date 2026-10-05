// 应用版本号（发版时与 package.json 同步更新，显示在「我的」页）
export const APP_VERSION = '1.0.0'

// 全局常量：科目配色、时长预设、LocalStorage 键名
export const SUBJECTS = [
  { name: '语文', color: '#D8A793' },
  { name: '数学', color: '#7FB5A5' },
  { name: '英语', color: '#93A9CF' },
  { name: '物理', color: '#AC94C9' },
  { name: '化学', color: '#A3B98A' },
  { name: '生物', color: '#83B57E' },
  { name: '历史', color: '#C2A67A' },
  { name: '地理', color: '#86B3C2' },
  { name: '政治', color: '#C9899F' },
  { name: '其他', color: '#A6A8B2' },
]

// 专注时长预设（分钟），支持手动输入任意时长
export const FOCUS_PRESETS = [10, 15, 20, 25, 30, 40, 60, 90, 120]

// 休息时长预设（分钟）
export const BREAK_PRESETS = [3, 5, 10, 15]

// LocalStorage 键名（统一前缀 zt.）
export const STORE_KEYS = {
  settings: 'zt.settings', // 设置：音效、时长、连续专注等
  tasks: 'zt.tasks', // 任务列表
  records: 'zt.records', // 专注记录
  timer: 'zt.timer', // 进行中的计时状态（意外刷新/关闭后可恢复）
  cards: 'zt.cards', // 已收集的卡牌 id
  garden: 'zt.garden', // 小花园元素（永久保留）
  aiLog: 'zt.aiLog', // 最近一次 AI 复盘结果
}

// 按科目名查颜色，找不到时用「其他」的灰色
export function subjectColor(name) {
  return (SUBJECTS.find((s) => s.name === name) || SUBJECTS[SUBJECTS.length - 1]).color
}