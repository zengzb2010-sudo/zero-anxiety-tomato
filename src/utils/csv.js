// CSV 导出工具：把专注记录导出为标准 CSV（带 BOM，Excel 打开中文不乱码）
import { dateStr, pad2 } from './time'

function fmtDateTime(ts) {
  const d = new Date(ts)
  return `${dateStr(d)} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

// CSV 单元格转义（含逗号/引号/换行时用双引号包裹）
const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`

/**
 * 导出专注记录 CSV
 * @param {Array} records 专注记录列表
 */
export function exportRecordsCsv(records) {
  const head = ['日期', '科目', '关联任务', '类型', '计划分钟', '实际专注分钟', '开始时间', '结束时间']
  const rows = records.map((r) => [
    dateStr(new Date(r.startedAt)),
    r.subject,
    r.taskTitle || (r.taskId ? '（任务已删除）' : '自由专注'),
    r.type === 'partial' ? '半专注' : '完整',
    r.plannedMin,
    Math.round(r.durationSec / 60),
    fmtDateTime(r.startedAt),
    fmtDateTime(r.endedAt),
  ])
  const content = [head, ...rows].map((row) => row.map(esc).join(',')).join('\r\n')
  // \uFEFF BOM 前缀：保证 Excel 以 UTF-8 正确解析中文
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `专注记录-${dateStr().replace(/-/g, '')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}