// 应用入口：挂载 Vue 应用并引入全局样式
import { createApp } from 'vue'
import App from './App.vue'
import './style.css'
import './utils/theme' // 主题初始化（浅色/深色/跟随系统）

createApp(App).mount('#app')

// PWA：仅生产环境注册 Service Worker（避免干扰开发环境的 HMR）
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* 注册失败不影响使用 */
    })
  })
}