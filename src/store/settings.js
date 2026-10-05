// 设置存储：音效开关、专注/休息时长、连续专注模式、AI 配置（留空待用户填入）
import { useStoredState } from './useStoredState'
import { STORE_KEYS } from '../constants'

export const settings = useStoredState(STORE_KEYS.settings, {
  theme: 'system', // 外观：'light' 浅色 | 'dark' 深色 | 'system' 跟随系统
  focusMinutes: 25, // 默认专注时长（分钟），支持自定义
  breakMinutes: 5, // 默认休息时长（分钟）
  continuous: false, // 连续专注模式：true 时不提醒休息、不打断心流
  soundOn: true, // 结束提示音开关
  noiseVolume: 0.4, // 白噪音音量（0~1）
  notifyOn: false, // 完成通知（后台时系统提醒，默认关，避免打扰）
  // AI 每日复盘配置：MVP 阶段留空，用户后续填入
  ai: {
    baseUrl: '', // 如 https://api.openai.com/v1（兼容 OpenAI 格式的接口均可）
    apiKey: '',
    model: '',
    prompt: '', // 自定义系统提示词（可选）
  },
})