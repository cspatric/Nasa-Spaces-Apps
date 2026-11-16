import type { Map as MapLibreMap } from 'maplibre-gl'
import { windAt, type WindGrid } from './wind'

/**
 * Animated particles carried by the wind, drawn on a canvas laid over the map (it follows pan, zoom, tilt and rotation
 * because every particle is projected through the map each frame). Speed on the screen is kept steady at every zoom.
 */
export function startWind(map: MapLibreMap, grid: WindGrid): () => void {
  const host = map.getCanvasContainer()
  const box = map.getContainer() // the canvas container itself has no height: the map element gives the size
  const canvas = document.createElement('canvas')
  canvas.className = 'wind-canvas'
  Object.assign(canvas.style, { position: 'absolute', left: '0', top: '0', pointerEvents: 'none', zIndex: '2' })
  host.appendChild(canvas)
  const ctx = canvas.getContext('2d')!
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
  const size = () => {
    canvas.style.width = `${box.clientWidth}px`
    canvas.style.height = `${box.clientHeight}px`
    canvas.width = Math.round(box.clientWidth * dpr)
    canvas.height = Math.round(box.clientHeight * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }
  size()

  // Particles scale with the screen (a big window does not need the same density per pixel) and stay within a budget.
  const N = Math.max(500, Math.min(1100, Math.round((box.clientWidth * box.clientHeight) / 1800)))
  const lon = new Float32Array(N), lat = new Float32Array(N), age = new Float32Array(N), life = new Float32Array(N)
  // The view bounds are read when the map stops, not for every respawned particle (getBounds is not free).
  let bounds = map.getBounds()
  const refreshBounds = () => { bounds = map.getBounds() }
  const spawn = (i: number) => {
    const w = Math.max(bounds.getWest(), grid.west), e = Math.min(bounds.getEast(), grid.east)
    const s = Math.max(bounds.getSouth(), grid.south), n = Math.min(bounds.getNorth(), grid.north)
    if (w >= e || s >= n) { lon[i] = grid.west + Math.random() * (grid.east - grid.west); lat[i] = grid.south + Math.random() * (grid.north - grid.south) }
    else { lon[i] = w + Math.random() * (e - w); lat[i] = s + Math.random() * (n - s) }
    age[i] = 0
    life[i] = 60 + Math.random() * 90
  }
  for (let i = 0; i < N; i++) { spawn(i); age[i] = Math.random() * life[i] }

  // Strokes are drawn in a few color/opacity buckets, one path each, instead of one path per particle.
  const BUCKETS = 8
  const paths: Path2D[] = Array.from({ length: BUCKETS }, () => new Path2D())
  const colors = Array.from({ length: BUCKETS }, (_, b) => {
    const k = b / (BUCKETS - 1)
    return `rgba(${Math.round(59 + 190 * k)},${Math.round(224 + 20 * k)},${Math.round(197 + 50 * k)},${(0.3 + 0.5 * k).toFixed(2)})`
  })

  // While the camera moves the old trails no longer match the ground, so they fade out fast (instead of the canvas being
  // wiped, which left it empty for as long as the map was dragged) and new ones keep being drawn on every frame.
  let raf = 0, lastFrame = 0, moving = false
  const startMove = () => { moving = true }
  const endMove = () => { moving = false; refreshBounds() }
  const frame = (now: number) => {
    raf = requestAnimationFrame(frame)
    if (!moving && now - lastFrame < 33) return // about 30 frames a second when still: enough for slow streamlines, half the work
    const step = moving ? 1 : 2 // the same speed on screen at either rate
    lastFrame = now
    ctx.globalCompositeOperation = 'destination-out'
    ctx.fillStyle = moving ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.12)'
    ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr)
    ctx.globalCompositeOperation = 'source-over'
    ctx.lineWidth = 1.5
    ctx.lineCap = 'round'
    const ppd = (512 * 2 ** map.getZoom()) / 360 // pixels per degree of longitude
    for (let b = 0; b < BUCKETS; b++) paths[b] = new Path2D()
    for (let i = 0; i < N; i++) {
      const w = windAt(grid, lon[i], lat[i])
      if (!w || ++age[i] > life[i]) { spawn(i); continue }
      const sp = Math.hypot(w.u, w.v) || 0.01
      const px = Math.min(5, sp * 0.4) * step // screen pixels per drawn frame
      const a = map.project([lon[i], lat[i]])
      lon[i] += ((w.u / sp) * px) / ppd
      lat[i] += ((w.v / sp) * px * Math.cos((lat[i] * Math.PI) / 180)) / ppd
      const b = map.project([lon[i], lat[i]])
      const fade = Math.min(1, age[i] / 12, (life[i] - age[i]) / 12)
      const k = Math.min(1, sp / 12)
      const bucket = Math.min(BUCKETS - 1, Math.floor(Math.min(1, k * 0.7 + fade * 0.3) * BUCKETS))
      paths[bucket].moveTo(a.x, a.y)
      paths[bucket].lineTo(b.x, b.y)
    }
    for (let b = 0; b < BUCKETS; b++) { ctx.strokeStyle = colors[b]; ctx.stroke(paths[b]) }
  }
  raf = requestAnimationFrame(frame)

  map.on('movestart', startMove)
  map.on('moveend', endMove)
  map.on('resize', size)
  return () => {
    cancelAnimationFrame(raf)
    map.off('movestart', startMove)
    map.off('moveend', endMove)
    map.off('resize', size)
    canvas.remove()
  }
}
