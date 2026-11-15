import type { GibsLayer } from './catalog'
import { isoDay } from './dates'

export const GIBS = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best'

/** Tile template of an overlay: stacked over several days where one day alone only shows stripes. */
export const overlayUrl = (l: GibsLayer, ms: number) =>
  `mosaic://${l.timeAware ? l.composite ?? 1 : 1}/${l.gibsId}/${isoDay(ms)}/${l.tileMatrixSet}/${l.format}/${l.color.replace('#', '')}/${l.intensity ?? 'rain'}/{z}/{y}/{x}`

/** XYZ tile template of a GIBS layer for a date (`clear` wraps it in the no-data-clearing protocol). */
export const gibsUrl = (l: GibsLayer, ms: number, clear = false) =>
  `${clear ? 'clear://' : ''}${GIBS}/${l.gibsId}/default/${l.timeAware ? `${isoDay(ms)}/` : ''}${l.tileMatrixSet}/{z}/{y}/{x}.${l.format}`
