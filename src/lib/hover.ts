import { useSyncExternalStore } from 'react'

/** Center and ground extent (degrees) of the main map's view. */
export interface ViewRect { lon: number; lat: number; w: number; h: number }
export interface Hover { lon: number | null; lat: number | null; zoom: number; tilted: boolean; view: ViewRect | null; loading: boolean }

let current: Hover = { lon: null, lat: null, zoom: 4, tilted: false, view: null, loading: false }
const subs = new Set<() => void>()

export const hoverStore = {
  patch(p: Partial<Hover>) {
    current = { ...current, ...p }
    subs.forEach((f) => f())
  },
  subscribe(f: () => void) {
    subs.add(f)
    return () => subs.delete(f)
  },
  get: () => current,
}

export const useHover = () => useSyncExternalStore(hoverStore.subscribe, hoverStore.get)

export const useViewRect = () => useSyncExternalStore(hoverStore.subscribe, () => hoverStore.get().view)
