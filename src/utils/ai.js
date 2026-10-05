// AI 复盘请求封装：调用用户配置的 OpenAI 格式 chat/completions 接口
// （OpenAI、DeepSeek、通义、智谱等兼容接口均可），Key 只保存在本机

// 默认系统提示词：锁死「鼓励式」基调，杜绝批评与焦虑
export const DEFAULT_SYSTEM_PROMPT = `你是一位温柔的学习伙伴，正在给一名初中或高中学生写「每日专注复盘」。基于学生本周的专注数据：
1. 先肯定他做得好的地方（尽量具体到科目）；
2. 再给 1~2 条温和的次日学习小建议；
3. 绝不批评、绝不制造焦虑，禁止出现"失败、落后、不够努力、荒废"等负面词；
4. 语气像朋友聊天，全文 150 字以内，分成 2~3 个短段；
5. 可以用「你今天…」「明天可以试试…」这样的开头。`

/**
 * 发起一次 AI 复盘请求
 * @param {object} ai { baseUrl, apiKey, model }
 * @param {string} systemPrompt 系统提示词
 * @param {string} userContent 学生本周专注数据
 * @returns 返回 AI 文本；失败时抛出异常（组件层做温柔提示）
 */
export async function callAiReview(ai, systemPrompt, userContent) {
  const url = ai.baseUrl.replace(/\/+$/, '') + '/chat/completions'
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 30000) // 30 秒超时
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ai.apiKey}`,
      },
      body: JSON.stringify({
        model: ai.model || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt || DEFAULT_SYSTEM_PROMPT },
          { role: 'user', content: userContent },
        ],
        temperature: 0.8,
      }),
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    const content = data?.choices?.[0]?.message?.content || ''
    if (!content) throw new Error('empty')
    return content
  } finally {
    clearTimeout(timer)
  }
}