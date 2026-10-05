// 小花园存储：每次完成专注（含半专注）长出一个新元素，永久保留
import { useStoredState } from './useStoredState'
import { STORE_KEYS } from '../constants'
import { uid } from '../utils/id'
import { SUBJECT_ELEMENTS } from '../data/garden'

export const gardenState = useStoredState(STORE_KEYS.garden, { elements: [] })

/**
 * 花园长出一个新元素：类型按专注科目联动，位置/大小/角度随机。
 * @param {string} subject 专注科目
 * @returns 新元素对象
 */
export function growGarden(subject) {
  const pool = SUBJECT_ELEMENTS[subject] || SUBJECT_ELEMENTS['其他']
  const type = pool[Math.floor(Math.random() * pool.length)]
  const el = {
    id: uid(),
    type,
    subject: subject || '其他',
    x: 6 + Math.random() * 78, // 水平位置 %（留出边距）
    y: 6 + Math.random() * 56, // 垂直位置 %
    size: 22 + Math.random() * 16, // 尺寸 px
    rotate: Math.round(Math.random() * 50 - 25), // 随机倾斜，更自然
    variant: type === 'letter' ? String.fromCharCode(65 + Math.floor(Math.random() * 6)) : 0,
    createdAt: Date.now(),
  }
  gardenState.elements.push(el)
  return el
}