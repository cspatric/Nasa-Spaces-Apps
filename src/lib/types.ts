import type { OverlayId } from './catalog'

export interface LonLat { lon: number; lat: number }
export interface Pin extends LonLat { id: string; label: string }
export interface FlyRequest { tick: number; lon: number; lat: number; zoom: number; pitch: number; bearing: number }
export interface CameraCommand { tick: number; type: 'zoomIn' | 'zoomOut' | 'north' | 'tilt' }
export type OverlayState = Record<OverlayId, { on: boolean; opacity: number }>

/** The bounds of a ready-made region, in degrees, drawn as an outline on the map. */
export interface Outline {
  west: number
  south: number
  east: number
  north: number
}
