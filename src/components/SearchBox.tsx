import { useEffect, useMemo, useRef, useState } from 'react'
import { CITY_3D_ZOOM, zoomForHeight } from '../lib/catalog'
import { CITIES } from '../lib/cities'
import { useI18n } from '../lib/i18n'

export interface Place {
  name: string
  detail: string
  lon: number
  lat: number
  zoom: number
  bearing?: number
  online?: boolean
}

interface Props {
  onSelect: (p: Place) => void
  /** Choosing a place is not allowed now (data is being processed). */
  locked?: boolean
}

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

function localMatches(q: string): Place[] {
  const n = norm(q)
  if (!n) return []
  return CITIES.filter((c) => norm(c.name).includes(n))
    .sort((a, b) => Number(!norm(a.name).startsWith(n)) - Number(!norm(b.name).startsWith(n)) || a.rank - b.rank)
    .slice(0, 6)
    .map((c) => ({ name: c.name, detail: '', lon: c.lon, lat: c.lat, zoom: CITY_3D_ZOOM, bearing: c.bearing }))
}

interface NominatimItem { display_name: string; lat: string; lon: string; boundingbox?: string[]; name?: string }

async function remoteMatches(q: string, signal: AbortSignal): Promise<Place[]> {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&accept-language=en&q=${encodeURIComponent(q)}`
  const r = await fetch(url, { signal })
  if (!r.ok) return []
  const items = (await r.json()) as NominatimItem[]
  return items.map((it) => {
    const lat = Number(it.lat)
    const lon = Number(it.lon)
    let zoom = 11
    if (it.boundingbox?.length === 4) {
      const [s, n, w, e] = it.boundingbox.map(Number)
      const span = Math.max((n - s) * 111, (e - w) * 111 * Math.cos((lat * Math.PI) / 180))
      zoom = zoomForHeight(Math.min(4_000_000, Math.max(12_000, span * 1600)), lat)
    }
    const parts = it.display_name.split(',').map((s) => s.trim())
    return { name: it.name || parts[0], detail: parts.slice(1, 3).join(', '), lon, lat, zoom, online: true }
  })
}

export default function SearchBox({ onSelect, locked = false }: Props) {
  const { t } = useI18n()
  const [q, setQ] = useState('')
  const [remote, setRemote] = useState<Place[]>([])
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const box = useRef<HTMLDivElement>(null)

  const local = useMemo(() => localMatches(q), [q])
  const items = useMemo(() => {
    const seen = new Set(local.map((p) => norm(p.name)))
    return [...local, ...remote.filter((p) => !seen.has(norm(p.name)))]
  }, [local, remote])

  // Online lookup (OpenStreetMap Nominatim) after a pause in typing; only the typed text leaves the page.
  useEffect(() => {
    if (q.trim().length < 3) return
    const ctl = new AbortController()
    const t = setTimeout(async () => {
      setBusy(true)
      try {
        setRemote(await remoteMatches(q.trim(), ctl.signal))
      } catch {
        /* aborted or offline: local results still work */
      } finally {
        setBusy(false)
      }
    }, 550)
    return () => {
      clearTimeout(t)
      ctl.abort()
    }
  }, [q])

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const pick = (p: Place) => {
    onSelect(p)
    setQ(p.name)
    setOpen(false)
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(items.length - 1, a + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)) }
    else if (e.key === 'Enter' && items[active]) pick(items[active])
    else if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div className="search glass" ref={box} data-tour="search">
      <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
        <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="m13 13 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      <input
        value={q}
        placeholder={t('Search a city or place')}
        aria-label={t('Search a city or place')}
        disabled={locked}
        title={locked ? t('Locked while data is being processed') : undefined}
        onChange={(e) => { setQ(e.target.value); setRemote([]); setOpen(true); setActive(0) }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKey}
      />
      {busy && <span className="spin" aria-label={t('Searching')} />}
      {open && !locked && q.trim() && (
        <ul className="results" role="listbox">
          {items.length === 0 && <li className="none">{busy ? t('Searching…') : t('No results')}</li>}
          {items.map((p, i) => (
            <li key={`${p.name}-${p.lon}-${p.lat}`} role="option" aria-selected={i === active} className={i === active ? 'active' : ''}
              onMouseEnter={() => setActive(i)} onMouseDown={(e) => { e.preventDefault(); pick(p) }}>
              <strong>{p.name}</strong>
              {p.detail && <small>{p.detail}</small>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
