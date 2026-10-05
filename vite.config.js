import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// Vite 配置：Vue3 + TailwindCSS v4（仅这三个依赖，保持项目轻量）
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  // 相对路径打包，方便后续 PWA / 混合壳打包（安卓、鸿蒙、iOS）
  base: './',
  server: {
    host: true, // 允许局域网访问，手机可以直接预览
    port: 5173,
  },
})