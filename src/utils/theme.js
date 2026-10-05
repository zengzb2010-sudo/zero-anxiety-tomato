// 主题管理：浅色 / 深色 / 跟随系统（默认跟随系统）
// 实现：切换 <html> 的 .dark 类，配合 style.css 中的变量覆盖，全站组件自动换肤
import { watch } from 'vue'
import { settings } from '../store/settings'

const mq = window.matchMedia('(prefers-color-scheme: dark)')

function applyTheme() {
  const dark = settings.theme === 'dark' || (settings.theme === 'system' && mq.matches)
  document.documentElement.classList.toggle('dark', dark)
  // 同步浏览器地址栏/状态栏颜色
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', dark ? '#191d1a' : '#faf9f6')
}

// 跟随系统时，系统主题变化实时生效
if (mq.addEventListener) mq.addEventListener('change', () => {
  if (settings.theme === 'system') applyTheme()
})

watch(() => settings.theme, applyTheme, { immediate: true })