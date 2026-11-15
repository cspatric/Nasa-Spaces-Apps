import { useCallback, useEffect, useState } from 'react'
import { API_URL } from './api'
import type { ForecastResult } from './forecast'

export interface RegionInfo {
  id: string
  name: string
  center: [number, number]
  zoom: number
  bounds: [number, number, number, number]
  samples: number
  ready: boolean
  builtAt: string | null
  overall: { score: number; level: 'low' | 'moderate' | 'high'; main: string | null; place?: string | null } | null
}

/** The ready-made regional forecasts the backend has built, and a loader for one of them. */
export function useRegions(): { list: RegionInfo[]; load: (id: string) => Promise<ForecastResult | null> } {
  const [list, setList] = useState<RegionInfo[]>([])
  useEffect(() => {
    let alive = true
    const get = async (retry: boolean) => {
      try {
        const r = await fetch(`${API_URL}/regions`)
        if (r.ok && alive) setList(await r.json())
      } catch {
        if (retry && alive) setTimeout(() => void get(false), 4000)
      }
    }
    void get(true)
    return () => { alive = false }
  }, [])
  const load = useCallback(async (id: string) => {
    try {
      const r = await fetch(`${API_URL}/regions/${id}`)
      return r.ok ? ((await r.json()) as ForecastResult) : null
    } catch {
      return null
    }
  }, [])
  return { list, load }
}
