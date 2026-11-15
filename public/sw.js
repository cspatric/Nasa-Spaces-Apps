/* Tile cache: map tiles are slow (they come from servers far away) and never change for a given URL,
   so every tile is kept on this device and served from there from the second time on. */
const CACHE = 'saris-tiles-v1'
const MAX_ENTRIES = 6000
const HOSTS = new Set([
  'tiles.maps.eox.at',
  's3.amazonaws.com',
  'elevation-tiles-prod.s3.amazonaws.com',
  'gibs.earthdata.nasa.gov',
  'tiles.openfreemap.org',
])
let puts = 0

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

async function trim(cache) {
  const keys = await cache.keys()
  if (keys.length > MAX_ENTRIES) await Promise.all(keys.slice(0, keys.length - MAX_ENTRIES).map((k) => cache.delete(k)))
}

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (!HOSTS.has(url.hostname) || url.pathname.endsWith('.json') || url.pathname === '/planet') return
  e.respondWith((async () => {
    const cache = await caches.open(CACHE)
    const hit = await cache.match(req)
    if (hit) return hit
    const res = await fetch(req)
    if (res.ok && res.status === 200) {
      cache.put(req, res.clone()).then(() => { if (++puts % 300 === 0) trim(cache) }).catch(() => {})
    }
    return res
  })())
})
