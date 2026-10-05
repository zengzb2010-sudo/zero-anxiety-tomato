// 卡牌存储：已收集卡牌（LocalStorage 持久化），纯收集展示
import { useStoredState } from './useStoredState'
import { STORE_KEYS } from '../constants'
import { CARDS } from '../data/cards'

export const cardsState = useStoredState(STORE_KEYS.cards, { collected: [] })

/**
 * 随机掉落一张卡牌：从「未收集」的卡牌里随机抽一张，保证不会重复、
 * 最多 20 次就能集齐（避免重复挫败感）。全部集齐时返回 null。
 */
export function dropCard() {
  const pool = CARDS.filter((c) => !cardsState.collected.includes(c.id))
  if (pool.length === 0) return null
  const card = pool[Math.floor(Math.random() * pool.length)]
  cardsState.collected.push(card.id)
  return card
}