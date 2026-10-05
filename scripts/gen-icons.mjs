// =====================================================================
// PWA 图标生成脚本（零第三方依赖：手写 PNG 编码 + 程序化像素绘制）
// 用法：node scripts/gen-icons.mjs [输出目录]
//   - 不带参数：产出到 public/icons（本地开发用）
//   - 带参数如 dist/icons：产出到构建目录（CI 发版时用）
// 图案：品牌绿底 + 白色番茄钟（挂扣 + 圆环 + 时针分针）
// =====================================================================
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// 输出目录：支持命令行参数（CI 构建后写入 dist/icons），默认 public/icons
const OUT_DIR = process.argv[2]
  ? resolve(process.argv[2])
  : join(dirname(fileURLToPath(import.meta.url)), '../public/icons')

// ---------- PNG 编码（CRC32 + chunk 组装） ----------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const typeBuf = Buffer.from(type, 'ascii')
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
  return Buffer.concat([len, typeBuf, data, crcBuf])
}

function encodePng(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // 位深
  ihdr[9] = 6 // RGBA
  // 每行前加 1 字节 filter(0)
  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }
  const idat = deflateSync(raw, { level: 9 })
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])
}

// ---------- 像素绘制 ----------
const BG = [95, 159, 117] // #5F9F75 品牌深绿
const FG = [255, 255, 255]

function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax
  const dy = by - ay
  const l2 = dx * dx + dy * dy
  let t = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0
  t = Math.max(0, Math.min(1, t))
  const x = ax + t * dx
  const y = ay + t * dy
  return Math.hypot(px - x, py - y)
}

/** 绘制番茄钟图标：shapeScale 用于 maskable（图案缩小留安全区，背景仍全出血） */
function drawIcon(size, shapeScale) {
  const rgba = Buffer.alloc(size * size * 4, 0)
  const cx = size / 2
  const cy = size * 0.57
  const R = size * 0.3 * shapeScale // 圆环外径
  const rw = size * 0.075 * shapeScale // 环宽
  // 挂扣
  const knobCx = cx
  const knobCy = cy - R - size * 0.07 * shapeScale
  const knobR = size * 0.05 * shapeScale
  // 指针：分针朝 12 点，时针朝 10 点
  const lenM = R - rw * 1.1
  const lenH = R * 0.52
  const aH = Math.PI + Math.PI / 6 // 时针朝左上（10 点方向）
  const hx = cx + Math.cos(aH) * lenH
  const hy = cy + Math.sin(aH) * lenH
  const wh = rw * 0.9 // 时针宽
  const wm = rw * 0.55 // 分针宽

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let c = BG
      const inShape = () => {
        // 挂扣
        if (Math.hypot(x - knobCx, y - knobCy) <= knobR) return true
        // 圆环
        const d = Math.hypot(x - cx, y - cy)
        if (d >= R - rw && d <= R) return true
        // 分针（向上）
        if (distToSegment(x, y, cx, cy, cx, cy - lenM) <= wm / 2) return true
        // 时针（左上）
        if (distToSegment(x, y, cx, cy, hx, hy) <= wh / 2) return true
        // 中心轴点
        if (d <= rw * 0.55) return true
        return false
      }
      if (inShape()) c = FG
      const i = (y * size + x) * 4
      rgba[i] = c[0]
      rgba[i + 1] = c[1]
      rgba[i + 2] = c[2]
      rgba[i + 3] = 255
    }
  }
  return encodePng(size, size, rgba)
}

// ---------- 生成 ----------
mkdirSync(OUT_DIR, { recursive: true })
writeFileSync(join(OUT_DIR, 'icon-192.png'), drawIcon(192, 1))
writeFileSync(join(OUT_DIR, 'icon-512.png'), drawIcon(512, 1))
// maskable：图案缩到 78%，四周留安全区（背景铺满）
writeFileSync(join(OUT_DIR, 'icon-512-maskable.png'), drawIcon(512, 0.78))
console.log('已生成 3 个图标到', OUT_DIR)