import { CAMERA_PRESETS, type CameraPreset } from '../lib/catalog'
import { useEffect, useRef, useState } from 'react'
import { CITIES, type City } from '../lib/cities'
import { LANGS, useI18n } from '../lib/i18n'
import { sound } from '../lib/sound'
import SearchBox, { type Place } from './SearchBox'

interface Props {
  onFly: (p: CameraPreset) => void
  onCity: (c: City) => void
  onPlace: (p: Place) => void
  leftOpen: boolean
  rightOpen: boolean
  onLeft: () => void
  onRight: () => void
}

export function BrandMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="0" fill="rgba(255,255,255,.06)" />
      <g fill="none" stroke="#5eead4" strokeLinecap="round" strokeWidth="2.2">
        <path d="M16 5.5a10.5 10.5 0 0 1 10.5 10.5" />
        <path d="M16 10a6 6 0 0 1 6 6" opacity=".75" />
        <path d="M16 14a2 2 0 0 1 2 2" opacity=".5" />
      </g>
      <circle cx="9.5" cy="22.5" r="2.4" fill="#5eead4" />
    </svg>
  )
}

const TOUR = CITIES.filter((c) => c.cap)

function CityMenu({ onCity }: { onCity: (c: City) => void }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])
  return (
    <div className="citymenu" ref={box}>
      <button aria-expanded={open} onClick={() => setOpen((v) => !v)}>{t('Capitals')}</button>
      {open && (
        <ul className="results citylist" role="menu">
          {TOUR.map((c) => (
            <li key={c.name} role="menuitem" onClick={() => { onCity(c); setOpen(false) }}>{c.name}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function TopBar({ onFly, onCity, onPlace, leftOpen, rightOpen, onLeft, onRight }: Props) {
  const { t, lang, setLang } = useI18n()
  const [muted, setMuted] = useState(sound.isMuted())
  return (
    <header className="topbar">
      <div className="brand glass">
        <BrandMark />
        <div className="brand-name">SARIS</div>
      </div>
      <button className={`toggle glass ${leftOpen ? 'on' : ''}`} onClick={onLeft} aria-pressed={leftOpen}>{t('Layers')}</button>
      <SearchBox onSelect={onPlace} />
      <nav className="presets glass" aria-label={t('Camera presets')}>
        {CAMERA_PRESETS.map((p) => (
          <button key={p.id} onClick={() => onFly(p)}>
            {t(p.label)}
          </button>
        ))}
        <CityMenu onCity={onCity} />
      </nav>
      <button className={`toggle glass ${rightOpen ? 'on' : ''}`} onClick={onRight} aria-pressed={rightOpen}>{t('Inspector')}</button>
      <button className="toggle glass sound" aria-pressed={!muted} aria-label={t(muted ? 'Sound off' : 'Sound on')} title={t(muted ? 'Sound off' : 'Sound on')}
        onClick={() => { sound.setMuted(!muted); setMuted(!muted) }}>
        <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
          <path d="M3 8h3l4-3.5v11L6 12H3z" fill="currentColor" />
          {muted ? <path d="m13 7.5 4 5m0-5-4 5" stroke="currentColor" strokeWidth="1.6" fill="none" /> : <path d="M13 7a4 4 0 0 1 0 6m2-8a7 7 0 0 1 0 10" stroke="currentColor" strokeWidth="1.5" fill="none" />}
        </svg>
      </button>
      <div className="lang glass" role="group" aria-label={t('Language')}>
        {LANGS.map((l) => (
          <button key={l.id} className={lang === l.id ? 'on' : ''} title={l.name} aria-pressed={lang === l.id} onClick={() => setLang(l.id)}>{l.label}</button>
        ))}
      </div>
    </header>
  )
}
