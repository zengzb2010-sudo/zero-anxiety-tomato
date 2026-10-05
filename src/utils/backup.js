// 数据备份：全量 JSON 导出 / 导入（换设备迁移、防误删数据）
import { STORE_KEYS } from '../constants'
import { dateStr } from './time'

const APP_TAG = 'zero-anxiety-tomato'

/** 把所有 zt.* 数据打包下载为 JSON 文件 */
export function exportBackup() {
  const data = {}
  for (const k of Object.values(STORE_KEYS)) {
    const raw = localStorage.getItem(k)
    if (raw != null) {
      try {
        data[k] = JSON.parse(raw)
      } catch (e) {
        data[k] = raw
      }
    }
  }
  const payload = { app: APP_TAG, version: 1, exportedAt: new Date().toISOString(), data }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `零焦虑番茄备份-${dateStr().replace(/-/g, '')}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * 从备份文件恢复数据（会覆盖当前同 key 数据，调用方需先让用户确认）
 * @param {File} file
 */
export function importBackup(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const payload = JSON.parse(String(reader.result))
        if (payload.app !== APP_TAG || !payload.data || typeof payload.data !== 'object') {
          throw new Error('not-a-backup')
        }
        const validKeys = new Set(Object.values(STORE_KEYS))
        for (const [k, v] of Object.entries(payload.data)) {
          if (!validKeys.has(k)) continue
          localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v))
        }
        resolve()
      } catch (e) {
        reject(e)
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}