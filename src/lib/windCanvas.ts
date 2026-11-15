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

  const N = 1500
  const lon = new Float32Array(N), lat = new Float32Array(N), age = new Float32Array(N), life = new Float32Array(N)
  const spawn = (i: number) => {
    const b = map.getBounds()
    const w = Math.max(b.getWest(), grid.west), e = Math.min(b.getEast(), grid.east)
    const s = Math.max(b.getSouth(), grid.south), n = Math.min(b.getNorth(), grid.north)
    if (w >= e || s >= n) { lon[i] = grid.west + Math.random() * (grid.east - grid.west); lat[i] = grid.south + Math.random() * (grid.north - grid.south) }
    else { lon[i] = w + Math.random() * (e - w); lat[i] = s + Math.random() * (n - s) }
    age[i] = 0
    life[i] = 60 + Math.random() * 90
  }
  for (let i = 0; i < N; i++) { spawn(i); age[i] = Math.random() * life[i] }

  let raf = 0
  const clear = () => ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)
  const frame = () => {
    ctx.globalCompositeOperation = 'destination-out'
    ctx.fillStyle = 'rgba(0,0,0,0.08)'
    ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr)
    ctx.globalCompositeOperation = 'source-over'
    ctx.lineWidth = 1.5
    ctx.lineCap = 'round'
    const ppd = (512 * 2 ** map.getZoom()) / 360 // pixels per degree of longitude
    for (let i = 0; i < N; i++) {
      const w = windAt(grid, lon[i], lat[i])
      if (!w || ++age[i] > life[i]) { spawn(i); continue }
      const sp = Math.hypot(w.u, w.v) || 0.01
      const px = Math.min(5, sp * 0.4) // screen pixels per frame
      const a = map.project([lon[i], lat[i]])
      lon[i] += ((w.u / sp) * px) / ppd
      lat[i] += ((w.v / sp) * px * Math.cos((lat[i] * Math.PI) / 180)) / ppd
      const b = map.project([lon[i], lat[i]])
      const fade = Math.min(1, age[i] / 12, (life[i] - age[i]) / 12)
      const k = Math.min(1, sp / 12)
      ctx.strokeStyle = `rgba(${Math.round(59 + 190 * k)},${Math.round(224 + 20 * k)},${Math.round(197 + 50 * k)},${0.25 + 0.6 * fade * (0.5 + k)})`
      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(b.x, b.y)
      ctx.stroke()
    }
    raf = requestAnimationFrame(frame)
  }
  raf = requestAnimationFrame(frame)

  map.on('move', clear)
  map.on('resize', size)
  return () => {
    cancelAnimationFrame(raf)
    map.off('move', clear)
    map.off('resize', size)
    canvas.remove()
  }
}
