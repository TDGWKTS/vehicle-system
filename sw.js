// sw.js - Service Worker 车辆数据缓存
const CACHE_NAME = 'vehicle-system-v1';
const API_URL = 'https://script.google.com/macros/s/AKfycbyAzYXGpsPoXq1AA3njK_zj7ggouBa_rn-Ya8oxjunYoAsb2-PK72AgfbVpWKrWZUkemw/exec';

self.addEventListener('install', (event) => {
  console.log('[SW] 安装中...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] 激活中...');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  
  if (url.includes('/macros/s/') && url.includes('getVehicles')) {
    event.respondWith(staleWhileRevalidate(event.request));
    return;
  }
  
  event.respondWith(fetch(event.request));
});

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then(async (networkResponse) => {
    if (networkResponse && networkResponse.status === 200) {
      const responseToCache = networkResponse.clone();
      await cache.put(request, responseToCache);
      console.log('[SW] 缓存已更新');
    }
    return networkResponse;
  }).catch(err => {
    console.error('[SW] 网络请求失败', err);
    return null;
  });
  
  if (cachedResponse) {
    console.log('[SW] 返回缓存数据');
    return cachedResponse;
  }
  
  console.log('[SW] 无缓存，等待网络');
  return await fetchPromise;
}