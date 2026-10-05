// AI 复盘存储：缓存最近一次生成结果（同一天打开直接展示，可重新生成）
import { useStoredState } from './useStoredState'
import { STORE_KEYS } from '../constants'

export const aiLogState = useStoredState(STORE_KEYS.aiLog, { date: '', content: '' })

/** 保存一次复盘结果 */
export function saveAiLog(date, content) {
  aiLogState.date = date
  aiLogState.content = content
}