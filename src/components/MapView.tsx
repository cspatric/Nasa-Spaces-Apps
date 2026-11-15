import { useEffect, useRef, useState } from 'react'
import * as maplibregl from 'maplibre-gl'
import type { ExpressionSpecification, FilterSpecification, GeoJSONSource, LayerSpecification, RasterTileSource, StyleSpecification } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { BASE_LAYERS, MAX_ZOOM, MIN_ZOOM, OVERLAYS, REGION_BOUNDS, type BaseId, type OverlayId } from '../lib/catalog'
import { CITIES, CITY_MIN_ZOOM } from '../lib/cities'
import { isoDay } from '../lib/dates'
import { GIBS, gibsUrl, overlayUrl } from '../lib/gibs'
import { hoverStore } from '../lib/hover'
import { bbox, FLOOD_RADIUS_KM, floodArea, zonesFor, type Disaster, type ZoneStats } from '../lib/disasters'
import { sampleGlow } from '../lib/lights'
import { loadWind } from '../lib/wind'
import { startWind } from '../lib/windCanvas'
import { hexToRgb } from '../lib/tint'
import { registerProtocols } from '../lib/protocols'
import type { Area, CameraCommand, FlyRequest, LonLat, OverlayState, Pin } from '../lib/types'
import type { ForecastMark } from '../lib/forecastMarks'

interface Props {
  baseId: BaseId
  overlays: OverlayState
  imageryMs: number
  inspected: LonLat | null
  pins: Pin[]
  selectedPinId: string | null
  flyTo: FlyRequest | null
  command: CameraCommand | null
  /** Air currents (animated wind particles). */
  wind: boolean
  onWind: (live: boolean | null) => void
  /** Area selection: drag a rectangle on the map. */
  selectMode: boolean
  area: Area | null
  onArea: (a: Area) => void
  /** Forecast labels (one per point, or per sample place of a region). */
  marks: ForecastMark[]
  cities: boolean
  buildings: boolean
  /** Overlay ids with no data for the timeline date (before the layer exists, or in the scenario period). */
  blocked: string[]
  disaster: Disaster | null
  onDisasterStats: (s: ZoneStats[] | null) => void
  /** Overall risk at the inspected point (colors its marker), when a forecast has been run. */
  inspectLevel: string | null
  exaggeration: number
  onPick: (p: LonLat) => void
}

/** Same bucket under two hostnames: HTTP/1.1 allows 6 connections per host, so this doubles the parallel tile reads. */
const TERRARIUM = [
  'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
  'https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{z}/{x}/{y}.png',
]
/** Coarse layers fade from flat blocks to a smooth glow of the same color as the map is zoomed in. */
/** Whether map.queryTerrainElevation returns heights multiplied by the terrain exaggeration. */
const QUERY_INCLUDES_EXAGGERATION = true
const GLOW_FROM = 5.5
const GLOW_TO = 7.5
const COARSE = OVERLAYS.filter((o) => o.coarse)
const rasterOpacity = (o: { coarse?: boolean }, v: number): number | ExpressionSpecification =>
  o.coarse ? ['interpolate', ['linear'], ['zoom'], GLOW_FROM, v, GLOW_TO, 0] : v
const glowOpacity = (v: number): ExpressionSpecification => ['interpolate', ['linear'], ['zoom'], GLOW_FROM, 0, GLOW_TO, v]
const glowColor = (hex: string): ExpressionSpecification => {
  const [r, g, b] = hexToRgb(hex)
  const c = (a: number) => `rgba(${r},${g},${b},${a})`
  return ['interpolate', ['linear'], ['heatmap-density'], 0, c(0), 0.2, c(0.22), 0.55, c(0.55), 1, c(0.92)]
}
const EOX = 'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2025_3857/default/GoogleMapsCompatible/{z}/{y}/{x}.jpg'
const BOUNDS: [number, number, number, number] = [REGION_BOUNDS[0][0], REGION_BOUNDS[0][1], REGION_BOUNDS[1][0], REGION_BOUNDS[1][1]]

/** Only South and Central America are worked on: no tile outside the region bounds is ever requested. */
const rasterSource = (tiles: string[], maxzoom: number, attribution?: string, tileSize: 256 | 512 = 256) =>
  ({ type: 'raster', tiles, tileSize, maxzoom, attribution, bounds: BOUNDS }) as const

/**
 * NASA layers are drawn twice so something shows at once and the picture then sharpens: a "base" copy of only the
 * first 4 zoom levels (a handful of tiles for the whole region, so it fills the screen almost instantly, soft but
 * complete) under the detailed copy that loads tile by tile. The base fades out once the detailed copy is sharp
 * enough on its own. Coarse layers also use 512 px tiles: a quarter of the requests.
 */
const BASE_MAX_ZOOM = 3
const baseOpacity = (v: number): ExpressionSpecification => ['interpolate', ['linear'], ['zoom'], 0, v * 0.6, 6.5, v * 0.6, 8.5, 0]

/** Soft edge: nested rings darken the map toward the region border, fully dark just outside it. */
const FADE_RINGS = 7
function fadeData() {
  const [[w, s], [e, n]] = REGION_BOUNDS
  const features = []
  for (let k = 0; k <= FADE_RINGS; k++) {
    const d = k * 1.1 // degrees inside the border where this ring starts
    const hole = [[w + d, s + d], [e - d, s + d], [e - d, n - d], [w + d, n - d], [w + d, s + d]]
    features.push({
      type: 'Feature' as const,
      properties: { op: k === 0 ? 1 : 0.16 },
      geometry: { type: 'Polygon' as const, coordinates: [[[-180, -85], [180, -85], [180, 85], [-180, 85], [-180, -85]], hole.reverse()] },
    })
  }
  return { type: 'FeatureCollection' as const, features }
}

/** Street network (OpenStreetMap), draped on the terrain: dark casing under a light line so it reads on satellite imagery. */
const ROAD_CLASSES: { id: string; classes: string[]; minzoom: number; width: [number, number]; color: string }[] = [
  { id: 'minor', classes: ['minor', 'service', 'track', 'path'], minzoom: 14.5, width: [0.6, 3], color: '#d8dde3' },
  { id: 'tertiary', classes: ['tertiary'], minzoom: 13, width: [0.8, 5], color: '#e9edf1' },
  { id: 'secondary', classes: ['secondary'], minzoom: 11, width: [1, 7], color: '#f4d58a' },
  { id: 'primary', classes: ['primary', 'trunk'], minzoom: 9, width: [1.2, 9], color: '#f2b45c' },
  { id: 'motorway', classes: ['motorway'], minzoom: 8, width: [1.4, 11], color: '#f08a5d' },
]
const ROAD_LAYERS: LayerSpecification[] = ROAD_CLASSES.flatMap((r) =>
  (['casing', 'line'] as const).map((part) => ({
    id: `road-${r.id}-${part}`, type: 'line' as const, source: 'osm', 'source-layer': 'transportation', minzoom: r.minzoom,
    filter: ['all', ['in', ['get', 'class'], ['literal', r.classes]], ['!=', ['get', 'brunnel'], 'tunnel']] as unknown as FilterSpecification,
    layout: { visibility: 'none' as const, 'line-cap': 'round' as const, 'line-join': 'round' as const },
    paint: {
      'line-color': part === 'casing' ? 'rgba(10,14,18,0.75)' : r.color,
      'line-width': ['interpolate', ['exponential', 1.6], ['zoom'], 8, part === 'casing' ? r.width[0] + 0.8 : r.width[0], 17, part === 'casing' ? r.width[1] + 2.5 : r.width[1]] as unknown as ExpressionSpecification,
    },
  })),
)
const ROAD_IDS = ROAD_LAYERS.map((l) => l.id)

/** All sources and layers are created once; later changes only toggle visibility and swap tile URLs. */
function buildStyle(ms: number): StyleSpecification {
  const sources: StyleSpecification['sources'] = {
    // 512 px tiles: the map asks for one zoom level less, so the terrain needs 4x fewer requests
    dem: { type: 'raster-dem', tiles: TERRARIUM, tileSize: 512, maxzoom: 12, encoding: 'terrarium', bounds: BOUNDS },
    sat: rasterSource([EOX], 13, 'Sentinel-2 cloudless by EOX (contains modified Copernicus Sentinel data 2025)'),
    bm: rasterSource([gibsUrl(BASE_LAYERS.bluemarble, ms)], 8),
    'modis-aqua': rasterSource([`clear://${GIBS}/MODIS_Aqua_CorrectedReflectance_TrueColor/default/${isoDay(ms)}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpeg`], 9),
    'modis-terra': rasterSource([gibsUrl(BASE_LAYERS.modis, ms, true)], 9),
    area: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } },
    fcmarks: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } },
    fade: { type: 'geojson', data: fadeData() },
    disaster: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } },
    dflood: rasterSource(['flood://0/{z}/{x}/{y}'], 12),
    cities: { type: 'geojson', data: { type: 'FeatureCollection', features: CITIES.map((c) => ({ type: 'Feature' as const, properties: { name: c.name, rank: c.rank }, geometry: { type: 'Point' as const, coordinates: [c.lon, c.lat] } })) } },
    osm: { type: 'vector', url: 'https://tiles.openfreemap.org/planet', bounds: BOUNDS, attribution: 'Buildings © OpenStreetMap contributors, OpenFreeMap' },
  }
  for (const o of OVERLAYS) {
    sources[o.id] = rasterSource([overlayUrl(o, ms)], o.maxLevel, undefined, o.coarse ? 512 : 256)
    sources[`${o.id}-base`] = rasterSource([overlayUrl(o, ms)], BASE_MAX_ZOOM, undefined, 512)
  }
  for (const o of COARSE) sources[`glow-${o.id}`] = { type: 'geojson', data: { type: 'FeatureCollection', features: [] } }

  const vis = { visibility: 'none' } as const
  return {
    version: 8,
    glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
    sources,
    layers: [
      { id: 'bg', type: 'background', paint: { 'background-color': '#0b0e12' } },
      { id: 'bm', type: 'raster', source: 'bm', layout: vis },
      { id: 'sat', type: 'raster', source: 'sat', layout: vis,
        paint: { 'raster-brightness-min': 0.1, 'raster-brightness-max': 1, 'raster-saturation': 0.18, 'raster-contrast': 0.1 } },
      { id: 'modis-aqua', type: 'raster', source: 'modis-aqua', layout: vis },
      { id: 'modis-terra', type: 'raster', source: 'modis-terra', layout: vis },
      ...OVERLAYS.map((o): LayerSpecification => ({ id: `${o.id}-base`, type: 'raster', source: `${o.id}-base`, layout: vis, paint: { 'raster-opacity': baseOpacity(o.opacity) } })),
      ...OVERLAYS.map((o): LayerSpecification => ({ id: o.id, type: 'raster', source: o.id, layout: vis, paint: { 'raster-opacity': rasterOpacity(o, o.opacity) } })),
      { id: 'fade', type: 'fill', source: 'fade', paint: { 'fill-color': '#0b0e12', 'fill-opacity': ['get', 'op'], 'fill-antialias': false } },
      ...ROAD_LAYERS,
      { id: 'dflood', type: 'raster', source: 'dflood', layout: vis, paint: { 'raster-opacity': 0.8 } },
      { id: 'disaster-fill', type: 'fill', source: 'disaster', paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.34 } },
      { id: 'disaster-line', type: 'line', source: 'disaster', paint: { 'line-color': ['get', 'color'], 'line-width': 1.8, 'line-opacity': 0.95 } },
      // Place names are drawn by the GPU (one symbol layer per rank, each from its own zoom), not as page elements.
      ...([1, 2, 3] as const).map((rank): LayerSpecification => ({
        id: `cities-${rank}`, type: 'symbol', source: 'cities', minzoom: CITY_MIN_ZOOM[rank], filter: ['==', ['get', 'rank'], rank],
        layout: {
          visibility: 'visible', 'text-field': ['get', 'name'], 'text-font': [rank === 1 ? 'Noto Sans Bold' : 'Noto Sans Regular'],
          'text-size': rank === 1 ? 14 : 12, 'text-anchor': 'left', 'text-offset': [0.7, 0], 'text-optional': true, 'text-padding': 3,
        },
        paint: { 'text-color': '#ffffff', 'text-halo-color': 'rgba(5,7,10,0.9)', 'text-halo-width': 1.4, 'text-halo-blur': 0.5 },
      })),
      ...([1, 2, 3] as const).map((rank): LayerSpecification => ({
        id: `cities-dot-${rank}`, type: 'circle', source: 'cities', minzoom: CITY_MIN_ZOOM[rank], filter: ['==', ['get', 'rank'], rank],
        paint: { 'circle-radius': rank === 1 ? 3.5 : 2.5, 'circle-color': '#ffffff', 'circle-stroke-color': 'rgba(5,7,10,0.85)', 'circle-stroke-width': 1.5 },
      })),
      {
        id: 'buildings', type: 'fill-extrusion', source: 'osm', 'source-layer': 'building', minzoom: 13, layout: vis,
        paint: {
          'fill-extrusion-color': ['interpolate', ['linear'], ['coalesce', ['get', 'render_height'], 8], 0, '#9aa3ad', 40, '#c3c9d0', 150, '#eef1f4'],
          'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 8],
          'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
          'fill-extrusion-opacity': 0.94,
          'fill-extrusion-vertical-gradient': true,
        },
      },
      ...COARSE.map((o): LayerSpecification => ({
        id: `glow-${o.id}`, type: 'heatmap', source: `glow-${o.id}`, layout: vis,
        paint: {
          'heatmap-weight': ['get', 'w'],
          'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], GLOW_FROM, 0.9, 13, 1.5],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], GLOW_FROM, 34, 13, 56],
          'heatmap-color': glowColor(o.color),
          'heatmap-opacity': glowOpacity(o.opacity),
        },
      })),
      { id: 'area-fill', type: 'fill', source: 'area', paint: { 'fill-color': '#5eead4', 'fill-opacity': 0.1 } },
      { id: 'area-line', type: 'line', source: 'area', paint: { 'line-color': '#5eead4', 'line-width': 2, 'line-dasharray': [3, 2] } },
      { id: 'fc-disc', type: 'circle', source: 'fcmarks', paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 3, 9, 8, 16, 13, 24],
        'circle-color': ['match', ['get', 'level'], 'high', '#f87171', 'moderate', '#fbbf24', '#5eead4'],
        'circle-opacity': 0.35, 'circle-stroke-width': 2.5, 'circle-stroke-color': ['match', ['get', 'level'], 'high', '#f87171', 'moderate', '#fbbf24', '#5eead4'] } },
      { id: 'fc-label', type: 'symbol', source: 'fcmarks', layout: {
        'text-field': ['get', 'label'], 'text-font': ['Noto Sans Bold'], 'text-size': 12, 'text-anchor': 'top', 'text-offset': [0, 1.9], 'text-allow-overlap': true },
        paint: { 'text-color': '#ffffff', 'text-halo-color': 'rgba(5,7,10,0.92)', 'text-halo-width': 1.6 } },
    ],
  }
}

function el(cls: string, text?: string) {
  const e = document.createElement('div')
  e.className = cls
  if (text) e.textContent = text
  e.addEventListener('click', (ev) => ev.stopPropagation())
  return e
}

export default function MapView(p: Props) {
  const blocked = p.blocked
  const host = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const [ready, setReady] = useState(false)
  const onPick = useRef(p.onPick)
  const onArea = useRef(p.onArea)
  const selecting = useRef(p.selectMode)
  useEffect(() => {
    onPick.current = p.onPick
    onArea.current = p.onArea
    selecting.current = p.selectMode
    mapRef.current?.getCanvas().style.setProperty('cursor', p.selectMode ? 'crosshair' : '')
  })

  // Create and destroy the map.
  useEffect(() => {
    if (!host.current) return
    registerProtocols()
    const map = new maplibregl.Map({
      container: host.current,
      style: buildStyle(p.imageryMs),
      center: [-60.8, -3.7], zoom: 7.4, pitch: 45, bearing: 0,
      minZoom: MIN_ZOOM, maxZoom: MAX_ZOOM, maxPitch: 75, maxBounds: REGION_BOUNDS,
      attributionControl: false, renderWorldCopies: false, fadeDuration: 120,
      maxTileCacheSize: 600, pixelRatio: Math.min(window.devicePixelRatio || 1, 1.5), cancelPendingTileRequestsWhileZooming: true,
    })
    mapRef.current = map
    if (import.meta.env.DEV) (window as unknown as { __map?: maplibregl.Map }).__map = map

    map.on('error', () => {}) // missing GIBS tiles (no data that day) are expected and simply stay transparent
    map.on('load', () => {
      map.setTerrain({ source: 'dem', exaggeration: 2.6 })
      map.setSky({
        'sky-color': '#27456f', 'horizon-color': '#b7cbe0', 'fog-color': '#9db2c7',
        'sky-horizon-blend': 0.55, 'horizon-fog-blend': 0.6, 'fog-ground-blend': 0.3,
      })
      map.setLight({ anchor: 'viewport', color: '#ffffff', intensity: 0.4, position: [1.4, 210, 35] })
      setReady(true)
      // Opening shot: the Amazon seen from above, then a slow dive into a tilted 3D view of Manaus.
      const dive = setTimeout(() => {
        map.flyTo({ center: [-60.02, -3.12], zoom: 13.4, pitch: 62, bearing: 20, duration: 5000, essential: true })
      }, 900)
      const stop = () => { clearTimeout(dive); map.stop() }
      map.once('mousedown', stop)
      map.once('wheel', stop)
      map.once('touchstart', stop)
    })

    map.on('click', (e) => {
      if (!selecting.current) onPick.current({ lon: e.lngLat.lng, lat: e.lngLat.lat })
    })
    // Area selection (also on the tilted 3D map): drag a rectangle ON THE SCREEN, then its four corners are put on the ground.
    // Works with the Area button, or by holding Shift while dragging. A box follows the mouse so what you draw is what you see.
    const box = document.createElement('div')
    box.className = 'select-box'
    box.style.display = 'none'
    map.getContainer().appendChild(box)
    let start: { x: number; y: number } | null = null
    let last = { x: 0, y: 0 }
    const place = () => {
      if (!start) return
      Object.assign(box.style, { display: 'block', left: `${Math.min(start.x, last.x)}px`, top: `${Math.min(start.y, last.y)}px`, width: `${Math.abs(last.x - start.x)}px`, height: `${Math.abs(last.y - start.y)}px` })
    }
    const finish = () => {
      if (!start) return
      const s = start, e = last
      start = null
      box.style.display = 'none'
      window.removeEventListener('mouseup', finish)
      map.dragPan.enable()
      const x0 = Math.min(s.x, e.x), x1 = Math.max(s.x, e.x), y0 = Math.min(s.y, e.y), y1 = Math.max(s.y, e.y)
      if (x1 - x0 < 6 && y1 - y0 < 6) { // a click, not a drag: a point
        const ll = map.unproject([s.x, s.y])
        onArea.current({ west: ll.lng, east: ll.lng, south: ll.lat, north: ll.lat })
        return
      }
      const corners = ([[x0, y0], [x1, y0], [x1, y1], [x0, y1]] as [number, number][]).map((pt) => map.unproject(pt))
      if (corners.some((c) => !Number.isFinite(c.lng) || !Number.isFinite(c.lat))) return // a corner above the horizon: nothing to select
      const lons = corners.map((c) => c.lng), lats = corners.map((c) => c.lat)
      onArea.current({ west: Math.min(...lons), east: Math.max(...lons), south: Math.min(...lats), north: Math.max(...lats), corners: corners.map((c) => [c.lng, c.lat] as [number, number]) })
    }
    map.on('mousedown', (e) => {
      if (!selecting.current && !e.originalEvent.shiftKey) return
      e.preventDefault()
      map.dragPan.disable()
      start = { x: e.point.x, y: e.point.y }
      last = start
      window.addEventListener('mouseup', finish) // even if the button is released outside the map
    })
    map.on('mousemove', (e) => {
      if (!start) return
      last = { x: e.point.x, y: e.point.y }
      place()
    })
    const cancel = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape' && start) {
        start = null
        box.style.display = 'none'
        window.removeEventListener('mouseup', finish)
        map.dragPan.enable()
      }
    }
    window.addEventListener('keydown', cancel)
    map.boxZoom.disable() // Shift+drag is for selecting here

    let lastMove = 0
    map.on('mousemove', (e) => {
      const now = performance.now()
      if (now - lastMove < 80) return
      lastMove = now
      hoverStore.patch({ lon: e.lngLat.lng, lat: e.lngLat.lat })
    })
    map.on('mouseout', () => hoverStore.patch({ lon: null, lat: null }))
    let loadTimer = 0
    map.on('dataloading', () => {
      if (!loadTimer) loadTimer = window.setTimeout(() => hoverStore.patch({ loading: true }), 400) // a quick load needs no spinner
    })
    map.on('idle', () => {
      clearTimeout(loadTimer)
      loadTimer = 0
      if (hoverStore.get().loading) hoverStore.patch({ loading: false })
    })
    let moveFrame = 0
    map.on('move', () => {
      if (moveFrame) return
      moveFrame = requestAnimationFrame(() => {
        moveFrame = 0
        const zoom = Math.round(map.getZoom() * 20) / 20
        const tilted = map.getPitch() > 20
        const cur = hoverStore.get()
        const c = map.getCenter()
        const cv = map.getContainer()
        const lonSpan = ((cv.clientWidth / 512) * 360) / 2 ** map.getZoom()
        const latSpan = ((cv.clientHeight / 512) * 360 * Math.cos((c.lat * Math.PI) / 180)) / 2 ** map.getZoom()
        const view = { lon: c.lng, lat: c.lat, w: lonSpan, h: latSpan }
        const moved = !cur.view || Math.abs(cur.view.lon - view.lon) > 0.005 || Math.abs(cur.view.lat - view.lat) > 0.005 || Math.abs(cur.view.w - view.w) > 0.002
        if (cur.zoom !== zoom || cur.tilted !== tilted || moved) hoverStore.patch({ zoom, tilted, view })
      })
    })

    return () => {
      box.remove()
      window.removeEventListener('keydown', cancel)
      window.removeEventListener('mouseup', finish)
      mapRef.current = null
      setReady(false)
      map.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Base map and overlay visibility.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    const show = (id: string, on: boolean) => map.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none')
    show('sat', p.baseId === 'satellite')
    show('bm', p.baseId === 'bluemarble' || p.baseId === 'modis')
    show('modis-aqua', p.baseId === 'modis')
    show('modis-terra', p.baseId === 'modis')
    show('buildings', p.buildings)
    for (const id of ROAD_IDS) show(id, p.buildings)
    for (const o of OVERLAYS) {
      const s = p.overlays[o.id as OverlayId]
      const on = s.on && !blocked.includes(o.id)
      show(o.id, on)
      show(`${o.id}-base`, on)
      map.setPaintProperty(o.id, 'raster-opacity', rasterOpacity(o, s.opacity))
      map.setPaintProperty(`${o.id}-base`, 'raster-opacity', baseOpacity(s.opacity))
      if (o.coarse) {
        show(`glow-${o.id}`, on)
        map.setPaintProperty(`glow-${o.id}`, 'heatmap-opacity', glowOpacity(s.opacity))
      }
    }
  }, [ready, p.baseId, p.overlays, p.buildings, blocked])

  // Date-driven tiles: only the layers that are on, and not again when just an opacity slider moves.
  const activeKey = OVERLAYS.filter((o) => p.overlays[o.id as OverlayId].on && !blocked.includes(o.id)).map((o) => o.id).join(',')
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    const set = (id: string, url: string) => (map.getSource(id) as RasterTileSource | undefined)?.setTiles([url])
    if (p.baseId === 'modis') {
      set('modis-terra', gibsUrl(BASE_LAYERS.modis, p.imageryMs, true))
      set('modis-aqua', `clear://${GIBS}/MODIS_Aqua_CorrectedReflectance_TrueColor/default/${isoDay(p.imageryMs)}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpeg`)
    }
    for (const id of activeKey ? activeKey.split(',') : []) {
      const o = OVERLAYS.find((x) => x.id === id)!
      set(id, overlayUrl(o, p.imageryMs))
      set(`${id}-base`, overlayUrl(o, p.imageryMs))
    }
  }, [ready, p.imageryMs, activeKey, p.baseId])

  // Terrain exaggeration.
  useEffect(() => {
    const map = mapRef.current
    if (map && ready) map.setTerrain({ source: 'dem', exaggeration: p.exaggeration })
  }, [ready, p.exaggeration])

  // Air currents: real wind (or typical trade winds) drawn as particles over the map.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready || !p.wind) return
    let stop: (() => void) | null = null
    let cancelled = false
    void loadWind().then((g) => {
      if (cancelled) return
      p.onWind(g.live)
      stop = startWind(map, g)
    })
    return () => {
      cancelled = true
      stop?.()
      p.onWind(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, p.wind])

  // Area selection outline and forecast labels.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    const a = p.area
    const ring = a ? (a.corners ? [...a.corners, a.corners[0]] : [[a.west, a.south], [a.east, a.south], [a.east, a.north], [a.west, a.north], [a.west, a.south]]) : null
    ;(map.getSource('area') as GeoJSONSource).setData(ring
      ? { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [ring] } }
      : { type: 'FeatureCollection', features: [] })
  }, [ready, p.area])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    ;(map.getSource('fcmarks') as GeoJSONSource).setData({
      type: 'FeatureCollection',
      features: p.marks.map((m) => ({ type: 'Feature' as const, properties: { level: m.level, label: m.label }, geometry: { type: 'Point' as const, coordinates: [m.lon, m.lat] } })),
    })
  }, [ready, p.marks])

  // Pins and the inspected point.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    const marks: maplibregl.Marker[] = []
    for (const pin of p.pins) {
      const e = el(`mk-pin ${pin.id === p.selectedPinId ? 'sel' : ''}`)
      e.append(Object.assign(document.createElement('span'), { textContent: pin.label }))
      marks.push(new maplibregl.Marker({ element: e, anchor: 'bottom' }).setLngLat([pin.lon, pin.lat]).addTo(map))
    }
    if (p.inspected) marks.push(new maplibregl.Marker({ element: el(`mk-inspect ${p.inspectLevel ? `lvl-${p.inspectLevel}` : ''}`) }).setLngLat([p.inspected.lon, p.inspected.lat]).addTo(map))
    return () => marks.forEach((m) => m.remove())
  }, [ready, p.pins, p.selectedPinId, p.inspected, p.inspectLevel])

  // City names.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    for (const rank of [1, 2, 3]) for (const id of [`cities-${rank}`, `cities-dot-${rank}`]) map.setLayoutProperty(id, 'visibility', p.cities ? 'visible' : 'none')
  }, [ready, p.cities])

  // Close-up glow of the coarse layers (same color as the raster), resampled when the view or the date changes.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    const ctl = new AbortController()
    let timer = 0
    const refresh = async () => {
      const c = map.getCenter()
      const view = { lon: c.lng, lat: c.lat, zoom: map.getZoom() }
      await Promise.all(COARSE.map(async (o) => {
        const src = map.getSource(`glow-${o.id}`) as GeoJSONSource | undefined
        if (!src) return
        const on = p.overlays[o.id as OverlayId].on && !blocked.includes(o.id) && view.zoom >= GLOW_FROM - 0.5
        const features = on ? await sampleGlow(o, isoDay(p.imageryMs), view, ctl.signal) : []
        if (!ctl.signal.aborted) src.setData({ type: 'FeatureCollection', features })
      }))
    }
    const later = () => {
      clearTimeout(timer)
      timer = window.setTimeout(refresh, 350)
    }
    map.on('moveend', later)
    later()
    return () => {
      ctl.abort()
      clearTimeout(timer)
      map.off('moveend', later)
    }
  }, [ready, p.overlays, p.imageryMs, blocked])

  // Natural disaster simulation: damage zones grow from the point, then area and buildings are counted.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    const src = map.getSource('disaster') as GeoJSONSource
    const d = p.disaster
    const empty = { type: 'FeatureCollection' as const, features: [] }
    if (!d) {
      src.setData(empty)
      map.setLayoutProperty('dflood', 'visibility', 'none')
      p.onDisasterStats(null)
      return
    }
    const center: [number, number] = [d.center.lon, d.center.lat]
    const ELEVATION_SCALE = () => (QUERY_INCLUDES_EXAGGERATION ? map.getTerrain()?.exaggeration ?? 1 : 1)
    const elevationAt = (lon: number, lat: number) => {
      const e = map.queryTerrainElevation([lon, lat])
      return typeof e === 'number' ? e / ELEVATION_SCALE() : null
    }
    const zones = zonesFor(d).sort((a, b) => b.areaKm2 - a.areaKm2) // largest first, so the strong colors end up on top
    let level = 0
    if (d.kind === 'flood') {
      level = (elevationAt(center[0], center[1]) ?? 0) + d.params.rise
      ;(map.getSource('dflood') as RasterTileSource).setTiles([`flood://${Math.round(level * 10) / 10}/${center[0]}/${center[1]}/${FLOOD_RADIUS_KM}/{z}/{x}/{y}`])
      map.setLayoutProperty('dflood', 'visibility', 'visible')
    } else {
      map.setLayoutProperty('dflood', 'visibility', 'none')
    }

    // camera: frame the damage
    if (zones.length) {
      const [sw, ne] = bbox(zones[0].ring(1))
      map.fitBounds([sw, ne], { padding: { top: 120, bottom: 160, left: 340, right: 340 }, maxZoom: 12.5, pitch: 48, duration: 2200 })
    } else {
      map.flyTo({ center, zoom: 10.6, pitch: 55, duration: 2200 })
    }

    // growth animation
    const t0 = performance.now()
    let raf = 0
    const draw = (now: number) => {
      const k = Math.min(1, (now - t0) / 1600)
      const e = 1 - (1 - k) ** 3
      src.setData({ type: 'FeatureCollection', features: zones.map((z) => ({ type: 'Feature' as const, properties: { color: z.color }, geometry: { type: 'Polygon' as const, coordinates: [z.ring(Math.max(0.001, e))] } })) })
      if (k < 1) raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)

    // numbers: areas, and the buildings of the tiles that are loaded (zoom in for a full count)
    const stats = () => {
      const buildings = map.getZoom() >= 13.2 ? map.querySourceFeatures('osm', { sourceLayer: 'building' }) : null
      const seen = new Set<string>()
      const pts: [number, number][] = []
      for (const f of buildings ?? []) {
        const g = f.geometry as { type: string; coordinates: unknown }
        const c = (g.type === 'Polygon' ? (g.coordinates as number[][][])[0][0] : g.type === 'MultiPolygon' ? (g.coordinates as number[][][][])[0][0][0] : null)
        if (!c) continue
        const key = `${c[0].toFixed(6)},${c[1].toFixed(6)}`
        if (!seen.has(key)) { seen.add(key); pts.push([c[0], c[1]]) }
      }
      const out: ZoneStats[] = zones.map((z) => ({ id: z.id, label: z.label, color: z.color, areaKm2: z.areaKm2, buildings: buildings ? pts.filter(([x, y]) => z.contains(x, y)).length : null }))
      if (d.kind === 'flood') {
        const wet = (lon: number, lat: number) => {
          const e = elevationAt(lon, lat)
          const dx = (lon - center[0]) * 111.32 * Math.cos((center[1] * Math.PI) / 180), dy = (lat - center[1]) * 110.57
          return e !== null && e > 1 && e < level && dx * dx + dy * dy <= FLOOD_RADIUS_KM ** 2
        }
        const { areaKm2 } = floodArea(d.center, level, FLOOD_RADIUS_KM, elevationAt)
        out.push({ id: 'flooded', label: 'Flooded land (below the water level)', color: '#38bdf8', areaKm2, buildings: buildings ? pts.filter(([x, y]) => wet(x, y)).length : null })
      }
      p.onDisasterStats(out)
    }
    let timer = window.setTimeout(stats, 3000)
    const later = () => {
      clearTimeout(timer)
      timer = window.setTimeout(stats, 700)
    }
    map.on('moveend', later)
    const mark = new maplibregl.Marker({ element: el('mk-disaster') }).setLngLat(center).addTo(map)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(timer)
      map.off('moveend', later)
      mark.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, p.disaster])

  // Camera moves.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !p.flyTo) return
    const { lon, lat, zoom, pitch, bearing } = p.flyTo
    map.flyTo({ center: [lon, lat], zoom, pitch, bearing, duration: 2800, essential: true })
  }, [p.flyTo])

  // Zoom, north-up and tilt buttons.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !p.command) return
    if (p.command.type === 'zoomIn') map.zoomIn({ duration: 400 })
    if (p.command.type === 'zoomOut') map.zoomOut({ duration: 400 })
    if (p.command.type === 'north') map.easeTo({ bearing: 0, duration: 600 })
    if (p.command.type === 'tilt') map.easeTo({ pitch: map.getPitch() > 20 ? 0 : 62, duration: 1200 })
  }, [p.command])

  return <div ref={host} className="map-host" />
}
