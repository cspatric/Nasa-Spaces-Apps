import { useEffect, useRef } from 'react'
import {
  Cartesian2,
  Cartesian3,
  Cartographic,
  Color,
  Credit,
  HeightReference,
  ImageryLayer,
  Ion,
  Math as CesiumMath,
  Rectangle,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  Terrain,
  Viewer,
  WebMapTileServiceImageryProvider,
  type Entity,
} from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import { BASE_LAYERS, HAS_TERRAIN_TOKEN, OVERLAYS, type BaseId, type GibsLayer, type OverlayId } from '../lib/catalog'
import { isoDay } from '../lib/dates'

export interface LonLat { lon: number; lat: number }
export interface Pin extends LonLat { id: string; label: string }
export interface FlyRequest { tick: number; lon: number; lat: number; height: number }
export type OverlayState = Record<OverlayId, { on: boolean; opacity: number }>

interface Props {
  baseId: BaseId
  overlays: OverlayState
  imageryMs: number
  inspected: LonLat | null
  pins: Pin[]
  selectedPinId: string | null
  flyTo: FlyRequest | null
  flood: { on: boolean; level: number }
  exaggeration: number
  creditsId: string
  onPick: (p: LonLat) => void
}

const FLOOD_AOI = Rectangle.fromDegrees(-60.55, -3.5, -59.75, -2.75)

function provider(layer: GibsLayer, ms: number) {
  const ext = layer.format
  const time = layer.timeAware ? `${isoDay(ms)}/` : ''
  const wmts = new WebMapTileServiceImageryProvider({
    url: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${layer.gibsId}/default/${time}${layer.tileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.${ext}`,
    layer: layer.gibsId,
    style: 'default',
    format: `image/${ext === 'jpeg' ? 'jpeg' : 'png'}`,
    tileMatrixSetID: layer.tileMatrixSet,
    maximumLevel: layer.maxLevel,
    tileWidth: 256,
    tileHeight: 256,
    credit: new Credit('NASA GIBS', false),
  })
  // GIBS answers 404 or 500 for tiles that have no data. Return a transparent tile instead of an error,
  // otherwise Cesium leaves a hole in the globe and hides the layers below.
  const request = wmts.requestImage.bind(wmts)
  wmts.requestImage = (x, y, level, req) => {
    const r = request(x, y, level, req)
    return r ? r.catch(() => blankTile()) : r
  }
  return wmts
}

function blankTile() {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  return c
}

export default function CesiumMap(p: Props) {
  const host = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<Viewer | null>(null)
  const layersRef = useRef(new Map<string, ImageryLayer>())
  const onPick = useRef(p.onPick)
  useEffect(() => {
    onPick.current = p.onPick
  })

  // Create and destroy the viewer.
  useEffect(() => {
    if (!host.current) return
    const token = import.meta.env.VITE_CESIUM_TOKEN as string | undefined
    if (token) Ion.defaultAccessToken = token

    const viewer = new Viewer(host.current, {
      baseLayer: false,
      terrain: token ? Terrain.fromWorldTerrain({ requestWaterMask: true }) : undefined,
      animation: false,
      timeline: false,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      fullscreenButton: false,
      infoBox: false,
      selectionIndicator: false,
      requestRenderMode: true,
      maximumRenderTimeChange: Infinity,
      creditContainer: document.getElementById(p.creditsId) ?? undefined,
    })
    viewer.scene.globe.baseColor = Color.fromCssColorString('#0b0e12')
    viewer.scene.backgroundColor = Color.fromCssColorString('#07090c')
    viewer.scene.globe.enableLighting = false
    viewer.scene.globe.showGroundAtmosphere = true
    viewer.camera.setView({
      destination: Cartesian3.fromDegrees(-60.02, -3.12 - 0.9, 110_000),
      orientation: { heading: 0, pitch: CesiumMath.toRadians(-42), roll: 0 },
    })

    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas)
    handler.setInputAction((e: { position: Cartesian2 }) => {
      const ray = viewer.camera.getPickRay(e.position)
      const hit = ray ? viewer.scene.globe.pick(ray, viewer.scene) : undefined
      if (!hit) return
      const c = Cartographic.fromCartesian(hit)
      onPick.current({ lon: CesiumMath.toDegrees(c.longitude), lat: CesiumMath.toDegrees(c.latitude) })
    }, ScreenSpaceEventType.LEFT_CLICK)

    viewerRef.current = viewer
    if (import.meta.env.DEV) (window as unknown as { __viewer?: Viewer }).__viewer = viewer
    const layers = layersRef.current
    return () => {
      handler.destroy()
      layers.clear()
      viewer.destroy()
      viewerRef.current = null
    }
  }, [p.creditsId])

  // Imagery layers: base and NASA overlays. Diffed by key so only changed layers reload.
  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer) return
    const wanted: { key: string; layer: GibsLayer; alpha: number }[] = []
    const base = BASE_LAYERS[p.baseId]
    // Blue Marble always sits underneath, so any missing daily tile shows relief instead of black.
    if (base.id !== 'bluemarble') wanted.push({ key: 'bluemarble@', layer: BASE_LAYERS.bluemarble, alpha: 1 })
    wanted.push({ key: `${base.id}@${base.timeAware ? isoDay(p.imageryMs) : ''}`, layer: base, alpha: 1 })
    for (const o of OVERLAYS) {
      const s = p.overlays[o.id as OverlayId]
      if (s.on) wanted.push({ key: `${o.id}@${isoDay(p.imageryMs)}`, layer: o, alpha: s.opacity })
    }

    const keep = new Set(wanted.map((w) => w.key))
    for (const [k, l] of layersRef.current) {
      if (!keep.has(k)) {
        viewer.imageryLayers.remove(l, true)
        layersRef.current.delete(k)
      }
    }
    for (const w of wanted) {
      let l = layersRef.current.get(w.key)
      if (!l) {
        l = viewer.imageryLayers.addImageryProvider(provider(w.layer, p.imageryMs))
        layersRef.current.set(w.key, l)
      }
      l.alpha = w.alpha
      viewer.imageryLayers.raiseToTop(l)
    }
    viewer.scene.requestRender()
  }, [p.baseId, p.overlays, p.imageryMs])

  // Inspected point and saved pins.
  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer) return
    const added: Entity[] = []
    const point = (id: string, pos: LonLat, label: string | undefined, color: string, size: number) =>
      added.push(
        viewer.entities.add({
          id,
          position: Cartesian3.fromDegrees(pos.lon, pos.lat),
          point: {
            pixelSize: size,
            color: Color.fromCssColorString(color),
            outlineColor: Color.fromCssColorString('#0b0e12'),
            outlineWidth: 2,
            heightReference: HeightReference.CLAMP_TO_GROUND,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
          label: label
            ? {
                text: label,
                font: '600 13px system-ui, sans-serif',
                fillColor: Color.WHITE,
                showBackground: true,
                backgroundColor: Color.fromCssColorString('#10151b').withAlpha(0.85),
                backgroundPadding: new Cartesian2(8, 5),
                pixelOffset: new Cartesian2(0, -24),
                heightReference: HeightReference.CLAMP_TO_GROUND,
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
              }
            : undefined,
        }),
      )
    for (const pin of p.pins) point(`pin-${pin.id}`, pin, pin.label, pin.id === p.selectedPinId ? '#fbbf24' : '#5eead4', 11)
    if (p.inspected) point('inspected', p.inspected, undefined, '#ffffff', 13)
    viewer.scene.requestRender()
    return () => {
      for (const e of added) viewer.entities.remove(e)
    }
  }, [p.pins, p.selectedPinId, p.inspected])

  // Camera moves.
  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer || !p.flyTo) return
    const { lon, lat, height } = p.flyTo
    const southShift = (height * Math.tan(CesiumMath.toRadians(40))) / 111_320
    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(lon, height > 3_000_000 ? lat : lat - southShift, height),
      orientation: { heading: 0, pitch: CesiumMath.toRadians(height > 3_000_000 ? -90 : -42), roll: 0 },
      duration: 2.2,
    })
  }, [p.flyTo])

  // Terrain exaggeration (only visible with real terrain).
  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer) return
    viewer.scene.verticalExaggeration = p.exaggeration
    viewer.scene.requestRender()
  }, [p.exaggeration])

  // Flood scenario: a translucent water plane at a chosen level (needs terrain to mean anything).
  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer || !p.flood.on || !HAS_TERRAIN_TOKEN) return
    const e = viewer.entities.add({
      id: 'flood',
      rectangle: {
        coordinates: FLOOD_AOI,
        height: p.flood.level,
        material: Color.fromCssColorString('#7dd3fc').withAlpha(0.55),
      },
    })
    viewer.scene.requestRender()
    return () => {
      viewer.entities.remove(e)
    }
  }, [p.flood.on, p.flood.level])

  return <div ref={host} className="cesium-host" />
}
