/** Static catalog: NASA GIBS imagery layers, camera presets and timeline constants. */

export const HAS_TERRAIN_TOKEN = Boolean(import.meta.env.VITE_CESIUM_TOKEN)

export type BaseId = 'bluemarble' | 'modis'

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
}

const gibs = (l: Omit<GibsLayer, 'tileMatrixSet' | 'maxLevel'> & { level: number }): GibsLayer => ({
  ...l,
  tileMatrixSet: `GoogleMapsCompatible_Level${l.level}`,
  maxLevel: l.level,
})

export const BASE_LAYERS: Record<BaseId, GibsLayer> = {
  bluemarble: gibs({
    id: 'bluemarble', label: 'Blue Marble', hint: 'Shaded relief, static',
    gibsId: 'BlueMarble_ShadedRelief_Bathymetry', format: 'jpeg', level: 8,
    timeAware: false, color: '#60a5fa', opacity: 1,
  }),
  modis: gibs({
    id: 'modis', label: 'True color', hint: 'MODIS Terra, daily 250 m',
    gibsId: 'MODIS_Terra_CorrectedReflectance_TrueColor', format: 'jpeg', level: 9,
    timeAware: true, color: '#34d399', opacity: 1,
  }),
}

export type OverlayId = 'imerg' | 'lst' | 'smap' | 'water' | 'dist' | 'nisar'

export const OVERLAYS: GibsLayer[] = [
  gibs({ id: 'nisar', label: 'NISAR backscatter', hint: 'GCOV, L-band, 2025 onward', gibsId: 'NISAR_L2_Geocoded_Polarimetric_Covariance', format: 'png', level: 13, timeAware: true, color: '#5eead4', opacity: 0.9 }),
  gibs({ id: 'water', label: 'Surface water', hint: 'OPERA DSWx, 30 m', gibsId: 'OPERA_L3_Dynamic_Surface_Water_Extent-HLS', format: 'png', level: 12, timeAware: true, color: '#38bdf8', opacity: 0.85 }),
  gibs({ id: 'dist', label: 'Vegetation loss alerts', hint: 'OPERA DIST-ALERT, 30 m', gibsId: 'OPERA_L3_DIST-ALERT-HLS_Color_Index', format: 'png', level: 12, timeAware: true, color: '#f97316', opacity: 0.85 }),
  gibs({ id: 'imerg', label: 'Rain rate', hint: 'GPM IMERG, daily', gibsId: 'IMERG_Precipitation_Rate', format: 'png', level: 6, timeAware: true, color: '#818cf8', opacity: 0.7 }),
  gibs({ id: 'lst', label: 'Land surface temperature', hint: 'VIIRS NOAA-21, daily 1 km', gibsId: 'VIIRS_NOAA21_Land_Surface_Temp_Day', format: 'png', level: 7, timeAware: true, color: '#fb7185', opacity: 0.75 }),
  gibs({ id: 'smap', label: 'Soil moisture', hint: 'SMAP L4, daily', gibsId: 'SMAP_L4_Analyzed_Surface_Soil_Moisture', format: 'png', level: 6, timeAware: true, color: '#a3e635', opacity: 0.7 }),
]

export interface CameraPreset { id: string; label: string; lon: number; lat: number; height: number }

export const CAMERA_PRESETS: CameraPreset[] = [
  { id: 'manaus', label: 'Manaus', lon: -60.02, lat: -3.12, height: 90_000 },
  { id: 'amazon', label: 'Amazon basin', lon: -62, lat: -5, height: 2_600_000 },
  { id: 'south', label: 'Southern Brazil', lon: -51.23, lat: -30.03, height: 160_000 },
  { id: 'globe', label: 'Globe', lon: -45, lat: -5, height: 17_000_000 },
]

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
