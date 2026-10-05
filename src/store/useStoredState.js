// LocalStorage 持久化封装：
// 页面打开时读取一次，之后任何修改自动写回；浏览器刷新数据不丢失，
// 只有清除浏览器缓存才会丢失（符合产品要求）。
import { reactive, watch } from 'vue'

export function useStoredState(key, defaults) {
  // 深拷贝默认值，避免多个实例共享同一对象
  const state = reactive(JSON.parse(JSON.stringify(defaults)))
  try {
    const raw = localStorage.getItem(key)
    if (raw) Object.assign(state, JSON.parse(raw))
  } catch (e) {
    // 数据损坏时静默回退到默认值
  }
  // 深度监听，任何修改自动持久化
  watch(
    state,
    (v) => {
      try {
        localStorage.setItem(key, JSON.stringify(v))
      } catch (e) {
        /* 存储已满等异常时忽略，不影响使用 */
      }
    },
    { deep: true }
  )
  return state
}