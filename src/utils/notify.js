// 浏览器系统通知封装：专注完成/休息结束时，若用户不在页面内才轻轻提醒
export function canNotify() {
  return typeof window !== 'undefined' && 'Notification' in window
}

/** 请求通知权限（返回是否已授权；浏览器不支持时返回 false） */
export async function ensureNotifyPermission() {
  if (!canNotify()) return false
  try {
    if (Notification.permission === 'granted') return true
    if (Notification.permission === 'denied') return false
    return (await Notification.requestPermission()) === 'granted'
  } catch (e) {
    return false
  }
}

/** 发一条轻提醒（tag 相同会合并，避免打扰） */
export function notifyComplete(title, body) {
  if (!canNotify() || Notification.permission !== 'granted') return
  try {
    new Notification(title, {
      body,
      icon: './icons/icon-192.png',
      tag: 'zt-done',
      silent: false,
    })
  } catch (e) {
    /* 部分环境构造会抛错，静默忽略 */
  }
}