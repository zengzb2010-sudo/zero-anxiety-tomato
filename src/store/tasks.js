// 任务存储：任务列表 + 增删（LocalStorage 持久化）
import { useStoredState } from './useStoredState'
import { STORE_KEYS } from '../constants'
import { uid } from '../utils/id'

export const tasksState = useStoredState(STORE_KEYS.tasks, { list: [] })

/**
 * 新建任务
 * @param {string} title 任务名
 * @param {string} subject 科目名
 */
export function addTask(title, subject) {
  const t = String(title || '').trim()
  if (!t) return null
  const task = {
    id: uid(),
    title: t,
    subject: subject || '其他',
    completed: false, // 已完成勾选：纯成就感标记，无超时/惩罚概念
    createdAt: Date.now(),
  }
  tasksState.list.unshift(task)
  return task
}

/** 切换任务的完成状态（正向勾选，永不显示「超时」「失败」） */
export function toggleTask(id) {
  const t = tasksState.list.find((x) => x.id === id)
  if (t) t.completed = !t.completed
}

/** 删除任务（已绑定的历史专注记录不受影响，历史只增不减） */
export function removeTask(id) {
  tasksState.list = tasksState.list.filter((t) => t.id !== id)
}