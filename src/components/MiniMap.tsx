import { useEffect, useRef, useState } from 'react'
import * as maplibregl from 'maplibre-gl'
import type { GeoJSONSource, StyleSpecification } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { BASE_LAYERS, OVERLAYS, REGION_BOUNDS, type OverlayId } from '../lib/catalog'
import { gibsUrl, overlayUrl } from '../lib/gibs'
import { useViewRect } from '../lib/hover'
import { useI18n } from '../lib/i18n'
import { registerProtocols } from '../lib/protocols'
import type { LonLat, OverlayState } from '../lib/types'

interface Props {
  overlays: OverlayState
  blocked: string[]
  imageryMs: number
  inspected: LonLat | null
  onGo: (p: LonLat) => void
}

/** Fixed flat map of the whole region: the active NASA layers, where the 3D view is looking, and click to go there. */
function style(ms: number): StyleSpecification {
  const sources: StyleSpecification['sources'] = {
    bm: { type: 'raster', tiles: [gibsUrl(BASE_LAYERS.bluemarble, ms)], tileSize: 256, maxzoom: 5 },
    view: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } },
    point: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } },
  }
  for (const o of OVERLAYS) sources[o.id] = { type: 'raster', tiles: [overlayUrl(o, ms)], tileSize: 256, maxzoom: Math.min(o.maxLevel, 6) }
  return {
    version: 8,
    sources,
    layers: [
      { id: 'bg', type: 'background', paint: { 'background-color': '#0b0e12' } },
      { id: 'bm', type: 'raster', source: 'bm', paint: { 'raster-brightness-max': 0.85, 'raster-saturation': -0.25 } },
      ...OVERLAYS.map((o) => ({ id: o.id, type: 'raster' as const, source: o.id, layout: { visibility: 'none' as const }, paint: { 'raster-opacity': o.opacity } })),
      { id: 'view-fill', type: 'fill', source: 'view', paint: { 'fill-color': '#ffffff', 'fill-opacity': 0.14 } },
      { id: 'view-line', type: 'line', source: 'view', paint: { 'line-color': '#ffffff', 'line-width': 1.5 } },
      { id: 'point', type: 'circle', source: 'point', paint: { 'circle-radius': 4, 'circle-color': '#5eead4', 'circle-stroke-color': '#0b0e12', 'circle-stroke-width': 1.5 } },
    ],
  }
}

export default function MiniMap({ overlays, blocked, imageryMs, inspected, onGo }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const [ready, setReady] = useState(false)
  const view = useViewRect()
  const { t } = useI18n()
  const go = useRef(onGo)
  useEffect(() => {
    go.current = onGo
  })

  useEffect(() => {
    if (!host.current) return
    registerProtocols()
    const map = new maplibregl.Map({
      container: host.current,
      style: style(imageryMs),
      bounds: REGION_BOUNDS,
      fitBoundsOptions: { padding: 4, animate: false },
      interactive: false,
      attributionControl: false,
      renderWorldCopies: false,
      pixelRatio: Math.min(window.devicePixelRatio || 1, 1.5),
    })
    mapRef.current = map
    if (import.meta.env.DEV) (window as unknown as { __mini?: maplibregl.Map }).__mini = map
    map.on('error', () => {})
    map.on('load', () => setReady(true))
    map.on('click', (e) => go.current({ lon: e.lngLat.lng, lat: e.lngLat.lat }))
    return () => {
      mapRef.current = null
      setReady(false)
      map.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Layers and their opacity follow the main map's choices.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    for (const o of OVERLAYS) {
      const s = overlays[o.id as OverlayId]
      map.setLayoutProperty(o.id, 'visibility', s.on && !blocked.includes(o.id) ? 'visible' : 'none')
      map.setPaintProperty(o.id, 'raster-opacity', s.opacity)
    }
  }, [ready, overlays, blocked])

  // Date-driven tiles.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    for (const o of OVERLAYS) if (overlays[o.id as OverlayId].on) (map.getSource(o.id) as maplibregl.RasterTileSource | undefined)?.setTiles([overlayUrl(o, imageryMs)])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, imageryMs, overlays])

  // Where the 3D view is looking.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    const src = map.getSource('view') as GeoJSONSource | undefined
    if (!src) return
    if (!view) {
      src.setData({ type: 'FeatureCollection', features: [] })
      return
    }
    const hw = Math.max(view.w, 1.6) / 2 // never smaller than a few pixels of the overview
    const hh = Math.max(view.h, 1.6) / 2
    const [w, e, s, n] = [view.lon - hw, view.lon + hw, view.lat - hh, view.lat + hh]
    src.setData({ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[w, s], [e, s], [e, n], [w, n], [w, s]]] } })
  }, [ready, view])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    const src = map.getSource('point') as GeoJSONSource | undefined
    src?.setData(inspected
      ? { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [inspected.lon, inspected.lat] } }
      : { type: 'FeatureCollection', features: [] })
  }, [ready, inspected])

  return <div className="minimap glass" aria-label={t('Overview map')}><div ref={host} className="minimap-host" /></div>
}
