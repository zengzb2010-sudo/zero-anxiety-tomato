// 专注记录存储：每一段专注（完整/半专注）都会记录在这里，只做正向统计
import { useStoredState } from './useStoredState'
import { STORE_KEYS } from '../constants'
import { uid } from '../utils/id'

export const recordsState = useStoredState(STORE_KEYS.records, { list: [] })

/**
 * 新增一条专注记录
 * @param {object} rec
 *  - type: 'full' 完整完成 | 'partial' 半专注（主动放弃但选择保存）
 *  - subject: 科目名
 *  - taskId / taskTitle: 关联任务（可选，自由专注时为空）
 *  - plannedMin: 计划专注分钟数
 *  - durationSec: 实际专注秒数
 *  - startedAt / endedAt: 起止时间戳
 */
export function addRecord(rec) {
  recordsState.list.push({ id: uid(), createdAt: Date.now(), ...rec })
}