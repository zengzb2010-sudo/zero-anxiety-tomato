// 零焦虑番茄 · Service Worker
// 策略：构建产物静态缓存（cache-first），运行时资源网络优先并回填缓存；
// 弱网/离线时回退到缓存的 index.html，应用仍可打开使用。
// 发版时递增版本号，客户端下次访问会自动更新缓存
const CACHE = 'zt-v2'

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(['./', './index.html', './manifest.webmanifest']))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return
  e.respondWith(
    caches.match(e.request).then(
      (hit) =>
        hit ||
        fetch(e.request)
          .then((res) => {
            // 只缓存同源的 GET 响应（构建后的 hash 静态资源自然更新）
            const copy = res.clone()
            if (res.ok && new URL(e.request.url).origin === location.origin) {
              caches.open(CACHE).then((c) => c.put(e.request, copy))
            }
            return res
          })
          .catch(() => caches.match('./index.html'))
    )
  )
})