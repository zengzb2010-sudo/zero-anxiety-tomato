// 极简 Markdown 渲染（AI 复盘回复展示用）：
// 先做 HTML 转义防注入，再替换标题/列表/加粗标记，不引入第三方库
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function renderMd(text) {
  return String(text || '')
    .split('\n')
    .map((line) => {
      const l = esc(line)
      if (/^#{1,3}\s/.test(l)) return `<p class="md-h">${l.replace(/^#{1,3}\s/, '')}</p>`
      if (/^\s*(?:[-•*]|\d+[.)])\s/.test(l)) {
        return `<p class="md-li">${l.replace(/^\s*(?:[-•*]|\d+[.)])\s/, '')}</p>`
      }
      if (!l.trim()) return ''
      return `<p>${l}</p>`
    })
    .join('')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
}