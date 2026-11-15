/** Static catalog: NASA GIBS imagery layers, camera presets and timeline constants. */

/** 3D relief is always on: free AWS Terrarium elevation tiles drawn by MapLibre. */
export const HAS_TERRAIN = true

export type BaseId = 'satellite' | 'modis' | 'bluemarble'

import type { IntensityMode } from './tint'

export interface GibsLayer {
  id: string
  label: string
  hint: string
  gibsId: string
  format: 'jpeg' | 'png'
  tileMatrixSet: string
  maxLevel: number
  timeAware: boolean
  color: string
  opacity: number
  /** How a source pixel becomes strength (see tint.ts). Set on the NASA overlays, which are drawn in one color. */
  intensity?: IntensityMode
  /** Coarse data (km-wide pixels): up close it is shown as a smooth glow instead of blocks. */
  coarse?: boolean
  /** First day with data. */
  from?: number
  /** Days stacked into one picture: a daily layer only holds that day's swaths, which look like stripes. */
  composite?: number
  /** Daily satellite swaths leave black no-data gaps: draw black as transparent. */
  transparentBlack?: boolean
  /** Non-GIBS tile URL template ({TileMatrix}/{TileRow}/{TileCol}) and its credit line. */
  template?: string
  credit?: string
}

const gibs = (l: Omit<GibsLayer, 'tileMatrixSet' | 'maxLevel'> & { level: number }): GibsLayer => ({
  ...l,
  tileMatrixSet: `GoogleMapsCompatible_Level${l.level}`,
  maxLevel: l.level,
})

export const BASE_LAYERS: Record<BaseId, GibsLayer> = {
  satellite: gibs({
    id: 'satellite', label: 'Satellite', hint: 'Sentinel-2 cloudless mosaic, 10 m',
    gibsId: 's2cloudless-2025', format: 'jpeg', level: 14, timeAware: false, color: '#34d399', opacity: 1,
    template: 'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2025_3857/default/GoogleMapsCompatible/{TileMatrix}/{TileRow}/{TileCol}.jpg',
    credit: 'Sentinel-2 cloudless by EOX (contains modified Copernicus Sentinel data 2025)',
  }),
  bluemarble: gibs({
    id: 'bluemarble', label: 'Blue Marble', hint: 'Shaded relief, static',
    gibsId: 'BlueMarble_ShadedRelief_Bathymetry', format: 'jpeg', level: 8,
    timeAware: false, color: '#60a5fa', opacity: 1,
  }),
  modis: gibs({
    id: 'modis', label: 'Daily true color', hint: 'MODIS and VIIRS, follows the timeline',
    gibsId: 'MODIS_Terra_CorrectedReflectance_TrueColor', format: 'jpeg', level: 9,
    timeAware: true, color: '#34d399', opacity: 1,
  }),
}

const trueColor = (id: string, gibsId: string): GibsLayer =>
  gibs({ id, label: id, hint: '', gibsId, format: 'jpeg', level: 9, timeAware: true, color: '#34d399', opacity: 1, transparentBlack: true })

/** Layers drawn for each base, bottom first. The daily mosaic stacks four sensors to fill each other's gaps. */
export const BASE_STACKS: Record<BaseId, GibsLayer[]> = {
  satellite: [BASE_LAYERS.satellite],
  bluemarble: [BASE_LAYERS.bluemarble],
  modis: [
    BASE_LAYERS.bluemarble,
    trueColor('viirs-snpp', 'VIIRS_SNPP_CorrectedReflectance_TrueColor'),
    trueColor('viirs-noaa20', 'VIIRS_NOAA20_CorrectedReflectance_TrueColor'),
    trueColor('modis-aqua', 'MODIS_Aqua_CorrectedReflectance_TrueColor'),
    trueColor('modis-terra', 'MODIS_Terra_CorrectedReflectance_TrueColor'),
  ],
}

export type OverlayId = 'imerg' | 'lst' | 'smap' | 'water' | 'dist' | 'nisar'

export const OVERLAYS: GibsLayer[] = [
  gibs({ id: 'nisar', label: 'NISAR backscatter', hint: 'GCOV, L-band, 2025 onward', gibsId: 'NISAR_L2_Geocoded_Polarimetric_Covariance', format: 'png', level: 13, timeAware: true, composite: 12, intensity: 'luma', from: Date.UTC(2025, 9, 1), color: '#5eead4', opacity: 0.6 }),
  gibs({ id: 'water', label: 'Surface water', hint: 'OPERA DSWx, 30 m', gibsId: 'OPERA_L3_Dynamic_Surface_Water_Extent-HLS', format: 'png', level: 12, timeAware: true, composite: 8, intensity: 'water', from: Date.UTC(2023, 0, 1), color: '#38bdf8', opacity: 0.85 }),
  gibs({ id: 'dist', label: 'Vegetation loss alerts', hint: 'OPERA DIST-ALERT, 30 m', gibsId: 'OPERA_L3_DIST-ALERT-HLS_Color_Index', format: 'png', level: 12, timeAware: true, composite: 8, intensity: 'alert', from: Date.UTC(2023, 5, 1), color: '#f97316', opacity: 0.85 }),
  gibs({ id: 'imerg', label: 'Rain rate', hint: 'GPM IMERG, daily', gibsId: 'IMERG_Precipitation_Rate', format: 'png', level: 6, timeAware: true, intensity: 'rain', coarse: true, from: Date.UTC(2000, 5, 1), color: '#818cf8', opacity: 0.7 }),
  gibs({ id: 'lst', label: 'Land surface temperature', hint: 'VIIRS NOAA-21, daily 1 km', gibsId: 'VIIRS_NOAA21_Land_Surface_Temp_Day', format: 'png', level: 7, timeAware: true, composite: 3, intensity: 'heat', coarse: true, from: Date.UTC(2023, 0, 1), color: '#fb7185', opacity: 0.75 }),
  gibs({ id: 'smap', label: 'Soil moisture', hint: 'SMAP L4, daily', gibsId: 'SMAP_L4_Analyzed_Surface_Soil_Moisture', format: 'png', level: 6, timeAware: true, intensity: 'wet', coarse: true, from: Date.UTC(2015, 3, 1), color: '#a3e635', opacity: 0.7 }),
]

export interface CameraPreset { id: string; label: string; lon: number; lat: number; zoom: number; pitch: number; bearing: number }

export const CAMERA_PRESETS: CameraPreset[] = [
  { id: 'manaus', label: 'Manaus', lon: -60.02, lat: -3.12, zoom: 13.4, pitch: 62, bearing: 20 },
  { id: 'amazon', label: 'Amazon', lon: -62.5, lat: -4, zoom: 4.6, pitch: 48, bearing: 0 },
  { id: 'andes', label: 'Andes', lon: -71.98, lat: -13.5, zoom: 9.4, pitch: 66, bearing: 60 },
  { id: 'sp', label: 'São Paulo', lon: -46.65, lat: -23.57, zoom: 14.6, pitch: 66, bearing: 35 },
  { id: 'rs', label: 'Rio Grande do Sul', lon: -50.2, lat: -29.2, zoom: 9.8, pitch: 68, bearing: 250 },
  { id: 'region', label: 'Overview', lon: -62, lat: -14, zoom: 3.1, pitch: 0, bearing: 0 },
]

/** The map is limited to South America and the part of Central America that reaches the Amazon. */
export const REGION_BOUNDS: [[number, number], [number, number]] = [[-98, -58], [-28, 24]]
export const MIN_ZOOM = 3
/** Terrain tiles end at zoom 13; city buildings need up to 16. */
export const MAX_ZOOM = 16

/** Zoom level whose camera height is about `height` meters (default 36.87 degree field of view). */
/** Zoom of the oblique 3D city view: close enough for the OpenStreetMap buildings (from zoom 14). */
export const CITY_3D_ZOOM = 14.5

export const zoomForHeight = (height: number, lat: number) =>
  Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.log2((2.11e8 * Math.cos((lat * Math.PI) / 180)) / height)))
export const heightForZoom = (zoom: number, lat: number) => (2.11e8 * Math.cos((lat * Math.PI) / 180)) / 2 ** zoom

/** Timeline: day 0 = 2016-01-01. C-band to 2025, L-band 2026, scenarios 2027 to 2030. */
export const TIMELINE_START = Date.UTC(2016, 0, 1)
export const TIMELINE_END = Date.UTC(2030, 11, 31)
export const DAY_MS = 86_400_000
export const TIMELINE_DAYS = Math.round((TIMELINE_END - TIMELINE_START) / DAY_MS)
export const L_BAND_START = Date.UTC(2026, 0, 1)
export const SCENARIO_START = Date.UTC(2027, 0, 1)
/** Newest imagery date worth requesting (GIBS lags a day or two). */
export const LATEST_IMAGERY = Date.now() - 2 * DAY_MS

/** Initial date: a clear-sky day over Manaus, so the first view looks good. */
export const DEMO_MS = Date.UTC(2026, 9, 24)
