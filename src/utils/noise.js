// =====================================================================
// 白噪音引擎：用 Web Audio 纯合成 4 种自习环境音，无任何音频文件。
// 引擎为模块级单例 —— 切换页签、开始专注后声音都会继续后台播放。
//  - 安静教室：轻棕噪声底 + 极轻粉噪声
//  - 雨声：粉噪声低通 + 高频细密雨丝
//  - 翻书声：极轻底噪 + 随机间隔的轻柔"沙"声
//  - 咖啡馆：棕噪声 + 缓慢起伏的"人声 murmur"
// =====================================================================
import { ref, watch } from 'vue'
import { settings } from '../store/settings'

/** 当前播放的音源类型（'' 表示关闭），供界面展示状态 */
export const noiseType = ref('')

/** 预生成 2 秒循环噪声缓冲：white 白噪声 / pink 粉噪声 / brown 棕噪声 */
function createNoiseBuffer(ctx, kind) {
  const len = Math.floor(ctx.sampleRate * 2)
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const d = buf.getChannelData(0)
  if (kind === 'white') {
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
  } else if (kind === 'pink') {
    // Paul Kellet 粉噪声算法
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + w * 0.0555179
      b1 = 0.99332 * b1 + w * 0.0750759
      b2 = 0.969 * b2 + w * 0.153852
      b3 = 0.8665 * b3 + w * 0.3104856
      b4 = 0.55 * b4 + w * 0.5329522
      b5 = -0.7616 * b5 - w * 0.016898
      d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11
      b6 = w * 0.115926
    }
  } else {
    // brown：积分白噪声，听感像远处低鸣
    let last = 0
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1
      last = (last + 0.02 * w) / 1.02
      d[i] = last * 3.5
    }
  }
  return buf
}

class NoiseEngine {
  constructor() {
    this.ctx = null
    this.master = null // 总音量节点
    this.nodes = [] // 正在发声的节点
    this.type = ''
    this.pageTimer = null
  }

  /** 初始化 AudioContext（需在用户点击等手势后调用） */
  ensure() {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext
        if (!AC) return null
        this.ctx = new AC()
        this.master = this.ctx.createGain()
        this.master.gain.value = settings.noiseVolume
        this.master.connect(this.ctx.destination)
      }
      if (this.ctx.state === 'suspended') this.ctx.resume()
      return this.ctx
    } catch (e) {
      return null
    }
  }

  /** 挂一条循环噪声：缓冲 → 滤波 → 增益 → 总音量 */
  loop(kind, gainVal, freq, filterType, q = 0.7) {
    const ctx = this.ensure()
    if (!ctx) return null
    const src = ctx.createBufferSource()
    src.buffer = createNoiseBuffer(ctx, kind)
    src.loop = true
    const f = ctx.createBiquadFilter()
    f.type = filterType || 'lowpass'
    f.frequency.value = freq || 1000
    f.Q.value = q
    const g = ctx.createGain()
    g.gain.value = gainVal || 0.2
    src.connect(f)
    f.connect(g)
    g.connect(this.master)
    src.start()
    this.nodes.push({ src, g })
    return g
  }

  play(type) {
    if (this.type === type) return
    this.stop()
    this.type = type
    if (type === 'rain') {
      this.loop('pink', 0.5, 1500, 'lowpass') // 雨的主声
      this.loop('white', 0.09, 6000, 'bandpass', 0.8) // 细密雨丝
    } else if (type === 'classroom') {
      this.loop('brown', 0.2, 450, 'lowpass') // 教室底噪
      this.loop('pink', 0.045, 800, 'lowpass') // 远处通风声
    } else if (type === 'cafe') {
      this.loop('brown', 0.26, 700, 'lowpass')
      const g = this.loop('pink', 0.05, 1200, 'bandpass', 1.2)
      if (g) this.murmur(g)
    } else if (type === 'pages') {
      this.loop('brown', 0.05, 400, 'lowpass') // 极轻底噪
      this.pageTimer = setInterval(() => this.pageSwipe(), 2600)
    }
    noiseType.value = type
  }

  /** 咖啡馆：低频振荡调制音量，模拟远处人声起伏 */
  murmur(gainNode) {
    const ctx = this.ctx
    const lfo = ctx.createOscillator()
    lfo.frequency.value = 0.15
    const lg = ctx.createGain()
    lg.gain.value = 0.02
    lfo.connect(lg)
    lg.connect(gainNode.gain)
    lfo.start()
    this.nodes.push({ src: lfo })
  }

  /** 翻书：随机触发的轻柔"沙"声（带通噪声 + 快速衰减包络） */
  pageSwipe() {
    const ctx = this.ensure()
    if (!ctx || !this.type) return
    if (Math.random() < 0.35) return // 随机跳过，节奏更自然
    const src = ctx.createBufferSource()
    src.buffer = createNoiseBuffer(ctx, 'white')
    const f = ctx.createBiquadFilter()
    f.type = 'bandpass'
    f.frequency.value = 900 + Math.random() * 1200
    const g = ctx.createGain()
    const t = ctx.currentTime
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.13, t + 0.08)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32)
    src.connect(f)
    f.connect(g)
    g.connect(this.master)
    src.start(t, Math.random(), 0.5)
    src.stop(t + 0.5)
  }

  stop() {
    this.nodes.forEach((n) => {
      try {
        n.src.stop()
      } catch (e) {
        /* 已停止的节点忽略 */
      }
    })
    this.nodes = []
    if (this.pageTimer) {
      clearInterval(this.pageTimer)
      this.pageTimer = null
    }
    this.type = ''
    noiseType.value = ''
  }

  setVolume(v) {
    if (this.master) this.master.gain.value = v
  }
}

export const engine = new NoiseEngine()

/** 打开指定音源（重复点击同一音源 = 关闭） */
export function setNoise(type) {
  engine.play(type)
}

/** 关闭白噪音 */
export function stopNoise() {
  engine.stop()
}

// 音量设置联动
watch(
  () => settings.noiseVolume,
  (v) => engine.setVolume(v)
)