import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import type { Area, CameraCommand, FlyRequest, LonLat, OverlayState, Pin } from './lib/types'
import Hud from './components/Hud'
import InspectorPanel, { type Tab } from './components/InspectorPanel'
import LayerPanel from './components/LayerPanel'
import Timeline from './components/Timeline'
import TopBar from './components/TopBar'
import type { Place } from './components/SearchBox'
import { CITY_3D_ZOOM, DEMO_MS, LATEST_IMAGERY, OVERLAYS, TIMELINE_DAYS, type BaseId, type CameraPreset, type OverlayId } from './lib/catalog'
import type { City } from './lib/cities'
import { imageryMs, indexFromMs, msFromIndex, overlayStatus } from './lib/dates'
import { useLiveSeries } from './lib/live'
import { hoverStore } from './lib/hover'
import { DEFAULT_PARAMS, type Disaster, type DisasterKind, type DisasterParams, type ZoneStats } from './lib/disasters'
import { useForecast, type ForecastResult } from './lib/forecast'
import { marksFor } from './lib/forecastMarks'
import { useRegions, type RegionInfo } from './lib/regions'
import { useI18n } from './lib/i18n'
import { sound } from './lib/sound'
import { useRain } from './lib/rain'

// The map is the heaviest part: load it after the interface paints.
const MapView = lazy(() => import('./components/MapView'))
const MiniMap = lazy(() => import('./components/MiniMap'))

const initialOverlays = Object.fromEntries(
  OVERLAYS.map((o) => [o.id, { on: false, opacity: o.opacity }]),
) as OverlayState

export default function App() {
  const { t } = useI18n()
  const [baseId, setBaseId] = useState<BaseId>('satellite')
  const [overlays, setOverlays] = useState<OverlayState>(initialOverlays)
  const [index, setIndex] = useState(indexFromMs(Math.min(DEMO_MS, LATEST_IMAGERY)))
  const [committed, setCommitted] = useState(index)
  const [playing, setPlaying] = useState(false)
  const [inspected, setInspected] = useState<LonLat | null>(null)
  const [pins, setPins] = useState<Pin[]>([])
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null)
  const [flyTo, setFlyTo] = useState<FlyRequest | null>(null)
  const [command, setCommand] = useState<CameraCommand | null>(null)
  const [leftOpen, setLeftOpen] = useState(true)
  const [rightOpen, setRightOpen] = useState(true)
  const [cities, setCities] = useState(true)
  const [buildings, setBuildings] = useState(true)
  const [exaggeration, setExaggeration] = useState(2.6)
  const tick = useRef(0)
  const [dKind, setDKind] = useState<DisasterKind>('earthquake')
  const [dParams, setDParams] = useState<DisasterParams>(DEFAULT_PARAMS)
  const [disaster, setDisaster] = useState<Disaster | null>(null)
  const [dStats, setDStats] = useState<ZoneStats[] | null>(null)
  const [tab, setTab] = useState<Tab>('data')
  const [selectMode, setSelectMode] = useState(false)
  const [area, setArea] = useState<Area | null>(null)
  const [region, setRegion] = useState<{ info: RegionInfo; data: ForecastResult } | null>(null)
  const [fcYear, setFcYear] = useState(2028)
  const { list: regionList, load: loadRegion } = useRegions()

  // Interface sounds: a tick on buttons, a two-note blip on switches
  useEffect(() => {
    const down = (e: PointerEvent) => {
      if ((e.target as Element | null)?.closest?.('button, [role=menuitem], [role=option]')) sound.click()
    }
    const change = (e: Event) => {
      const el = e.target as HTMLInputElement
      if (el.type === 'checkbox') sound.toggle(el.checked)
    }
    document.addEventListener('pointerdown', down)
    document.addEventListener('change', change)
    return () => {
      document.removeEventListener('pointerdown', down)
      document.removeEventListener('change', change)
    }
  }, [])

  // Imagery follows the slider after a short pause, so dragging does not reload tiles on every step.
  useEffect(() => {
    const t = setTimeout(() => setCommitted(index), 450)
    return () => clearTimeout(t)
  }, [index])

  useEffect(() => {
    if (!playing) return
    const t = setInterval(() => {
      if (hoverStore.get().loading) return // wait until the imagery of the current date is on screen
      setIndex((i) => {
        if (i + 12 >= TIMELINE_DAYS) {
          setPlaying(false)
          return TIMELINE_DAYS
        }
        return i + 12
      })
    }, 1600)
    return () => clearInterval(t)
  }, [playing])

  const fly = (p: { lon: number; lat: number; zoom: number; pitch?: number; bearing?: number }) => {
    sound.whoosh()
    setFlyTo({ tick: ++tick.current, lon: p.lon, lat: p.lat, zoom: p.zoom, pitch: p.pitch ?? 60, bearing: p.bearing ?? 20 })
  }

  // Series are read from the backend only for the days around the timeline date, when a point is picked.
  const dateMs = msFromIndex(committed)
  const areaKm = useMemo(() => {
    if (!area) return null
    const lat = (area.north + area.south) / 2
    const w = (area.east - area.west) * 111.32 * Math.cos((lat * Math.PI) / 180)
    const h = (area.north - area.south) * 110.57
    return { w, h, windowM: Math.min(5000, Math.max(500, (Math.min(w, h) * 1000) / 2)) }
  }, [area])
  const windowM = areaKm?.windowM ?? 500
  const live = useLiveSeries(inspected, dateMs, LATEST_IMAGERY, windowM)
  const rain = useRain(inspected, dateMs, LATEST_IMAGERY)
  const { state: forecast, run: runForecast } = useForecast(inspected, windowM)

  const imgMs = useMemo(() => imageryMs(committed), [committed])
  // Layers with no real data for the date (not flown yet, or a scenario): not drawn, and marked in the legend
  const blockedKey = OVERLAYS.filter((o) => overlayStatus(o, dateMs) !== 'ok').map((o) => o.id).join(',')
  const blocked = useMemo(() => (blockedKey ? blockedKey.split(',') : []), [blockedKey])
  const clamped = msFromIndex(index) > LATEST_IMAGERY

  // The forecast on the map: a label per point (or per sample place of a region), for the chosen year
  const timelineYear = new Date(dateMs).getUTCFullYear()
  const [seenYear, setSeenYear] = useState(timelineYear)
  if (seenYear !== timelineYear) { // the timeline entering 2027 to 2030 picks that year on the map (adjusted while rendering, not in an effect)
    setSeenYear(timelineYear)
    if (timelineYear >= 2027) setFcYear(Math.min(2030, timelineYear))
  }
  const shownResult = region ? region.data : forecast.result
  const marks = useMemo(() => marksFor(shownResult, region ? null : inspected, fcYear), [shownResult, region, inspected, fcYear])
  const mapArea = area ?? (region ? { west: region.info.bounds[0], south: region.info.bounds[1], east: region.info.bounds[2], north: region.info.bounds[3] } : null)

  const onArea = (a: Area) => {
    const lat = (a.north + a.south) / 2
    const w = (a.east - a.west) * 111.32 * Math.cos((lat * Math.PI) / 180)
    const h = (a.north - a.south) * 110.57
    setSelectMode(false)
    setRegion(null)
    setSelectedPinId(null)
    sound.ping()
    if (Math.max(w, h) < 0.4) { // a click, not a drag
      setArea(null)
      setInspected({ lon: (a.east + a.west) / 2, lat })
      return
    }
    setArea(a)
    setInspected({ lon: (a.east + a.west) / 2, lat })
  }

  const openRegion = async (id: string | null) => {
    if (id === null) { setRegion(null); return }
    const info = regionList.find((r) => r.id === id)
    const data = info ? await loadRegion(id) : null
    if (!info || !data) return
    setRegion({ info, data })
    setArea(null)
    setInspected(null)
    setTab('forecast')
    fly({ lon: info.center[0], lat: info.center[1], zoom: info.zoom, pitch: 25, bearing: 0 })
  }

  const savePin = () => {
    if (!inspected) return
    const id = String(Date.now())
    setPins((ps) => [...ps, { ...inspected, id, label: t('Pin {n}', { n: ps.length + 1 }) }])
    setSelectedPinId(id)
  }

  return (
    <div className="app">
      <Suspense fallback={<div className="loading">Loading globe…</div>}>
      <MapView
        baseId={baseId}
        overlays={overlays}
        imageryMs={imgMs}
        inspected={inspected}
        pins={pins}
        selectedPinId={selectedPinId}
        flyTo={flyTo}
        command={command}
        buildings={buildings}
        cities={cities}
        blocked={blocked}
        disaster={disaster}
        onDisasterStats={setDStats}
        inspectLevel={forecast.result?.risk?.available ? forecast.result.risk.overall.level : null}
        exaggeration={exaggeration}
        selectMode={selectMode}
        area={mapArea}
        onArea={onArea}
        marks={marks}
        onPick={(p) => {
          sound.ping()
          setInspected(p)
          setArea(null)
          setRegion(null)
          setSelectedPinId(null)
        }}
      />
      </Suspense>
      <TopBar
        onFly={(p: CameraPreset) => fly(p)}
        onCity={(c: City) => fly({ lon: c.lon, lat: c.lat, zoom: CITY_3D_ZOOM, bearing: c.bearing })}
        onPlace={(p: Place) => {
          setInspected({ lon: p.lon, lat: p.lat })
          setSelectedPinId(null)
          fly(p)
        }}
        leftOpen={leftOpen}
        rightOpen={rightOpen}
        onLeft={() => setLeftOpen((v) => !v)}
        onRight={() => setRightOpen((v) => !v)}
      />
      <LayerPanel
        open={leftOpen}
        baseId={baseId}
        onBase={setBaseId}
        overlays={overlays}
        onOverlay={(id: OverlayId, patch) => setOverlays((o) => ({ ...o, [id]: { ...o[id], ...patch } }))}
        cities={cities}
        onCities={setCities}
        buildings={buildings}
        onBuildings={setBuildings}
        exaggeration={exaggeration}
        onExaggeration={setExaggeration}
        disaster={{
          kind: dKind, params: dParams, running: disaster !== null, stats: dStats,
          droughtScore: forecast.result?.risk?.risks.find((r) => r.id === 'drought_fire')?.score ?? null,
          hasPoint: inspected !== null,
          onKind: setDKind, onParams: setDParams,
          onRun: () => {
            const center = inspected ?? hoverStore.get().view ?? { lon: -60.02, lat: -3.12 }
            setDStats(null)
            setDisaster({ tick: ++tick.current, kind: dKind, center: { lon: center.lon, lat: center.lat }, params: dParams })
            sound.alert()
            if (dKind === 'earthquake') sound.quake(dParams.magnitude)
            else if (dKind === 'flood') sound.flood()
            else if (dKind === 'wildfire') sound.fire()
            else sound.storm()
          },
          onClear: () => { setDisaster(null); setDStats(null) },
        }}
      />
      <InspectorPanel
        open={rightOpen}
        tab={tab}
        onTab={setTab}
        region={region}
        regions={regionList}
        onRegion={(id) => void openRegion(id)}
        fcYear={fcYear}
        onFcYear={setFcYear}
        area={area}
        areaKm={areaKm}
        selectMode={selectMode}
        onSelectMode={setSelectMode}
        live={live}
        rain={rain}
        forecast={forecast}
        onForecast={runForecast}
        nowMs={msFromIndex(index)}
        inspected={inspected}
        pins={pins}
        selectedPinId={selectedPinId}
        onSavePin={savePin}
        onSelectPin={(id) => {
          setSelectedPinId(id)
          const pin = pins.find((x) => x.id === id)
          if (pin) fly({ lon: pin.lon, lat: pin.lat, zoom: 12.4 })
        }}
        onRemovePin={(id) => setPins((ps) => ps.filter((x) => x.id !== id))}
        onClear={() => { setInspected(null); setArea(null) }}
      />
      <Suspense fallback={null}>
        <MiniMap
          overlays={overlays}
          blocked={blocked}
          imageryMs={imgMs}
          inspected={inspected}
          onGo={(p) => fly({ lon: p.lon, lat: p.lat, zoom: Math.max(hoverStore.get().zoom, 7.5), pitch: 60 })}
        />
      </Suspense>
      <Hud
        active={OVERLAYS.filter((o) => overlays[o.id as OverlayId].on)}
        blocked={blocked}
        scenario={overlayStatus({}, dateMs) === 'scenario'}
        onZoomIn={() => setCommand({ tick: ++tick.current, type: 'zoomIn' })}
        onZoomOut={() => setCommand({ tick: ++tick.current, type: 'zoomOut' })}
        onNorth={() => setCommand({ tick: ++tick.current, type: 'north' })}
        onTilt={() => setCommand({ tick: ++tick.current, type: 'tilt' })}
      />
      <Timeline
        index={index}
        onIndex={(i) => {
          setPlaying(false)
          setIndex(i)
        }}
        playing={playing}
        onPlay={() => {
          if (!playing && index >= TIMELINE_DAYS) setIndex(0)
          setPlaying((v) => !v)
        }}
        clamped={clamped}
      />
      <div className="credits">
        {t('Sentinel-2 cloudless © EOX · NASA GIBS, GPM IMERG · ASF NISAR and OPERA · AWS Terrain Tiles · © OpenStreetMap contributors · MapLibre')}
      </div>
    </div>
  )
}
