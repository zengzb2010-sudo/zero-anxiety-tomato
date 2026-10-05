// 音效工具：用 Web Audio API 合成轻柔提示音，不引入任何音频文件
let ctx = null

function ensureCtx() {
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume()
    return ctx
  } catch (e) {
    return null
  }
}

// 单个音符：正弦波 + 淡入淡出包络，听感柔和
function tone(ac, freq, start, dur, peak = 0.16) {
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = 'sine'
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.06)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur)
  osc.connect(gain)
  gain.connect(ac.destination)
  osc.start(start)
  osc.stop(start + dur + 0.1)
}

/**
 * 播放结束提示音
 * @param {string} kind 'focus' 专注完成（清脆两声叮咚） | 'break' 休息结束（更轻）
 */
export function playChime(kind = 'focus') {
  const ac = ensureCtx()
  if (!ac) return
  const t = ac.currentTime
  if (kind === 'focus') {
    tone(ac, 659.25, t, 1.2, 0.15) // E5
    tone(ac, 880, t + 0.18, 1.1, 0.11) // A5
  } else {
    tone(ac, 523.25, t, 1.0, 0.11) // C5
    tone(ac, 659.25, t + 0.22, 0.9, 0.08)
  }
}