import { CAMERA_PRESETS, type CameraPreset } from '../lib/catalog'
import Logo from './Logo'
import { useEffect, useRef, useState } from 'react'
import { CITIES, type City } from '../lib/cities'
import { LANGS, useI18n } from '../lib/i18n'
import Link from './Link'
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
  onAssistant: () => void
  /** Data is being processed: places cannot be searched and picked. */
  locked: boolean
  /** The AI button pulses until it is used once. */
  aiPulse: boolean
  /** Opens the guided tour. */
  onTour: () => void
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

export default function TopBar({ onFly, onCity, onPlace, leftOpen, rightOpen, onLeft, onRight, onAssistant, locked, aiPulse, onTour }: Props) {
  const { t, lang, setLang } = useI18n()
  const [muted, setMuted] = useState(sound.isMuted())
  return (
    <header className="topbar">
      <Link className="brand glass" to="/" title="SARIS">
        <Logo size={32} />
        <div className="brand-name">SARIS</div>
      </Link>
      <button className={`toggle glass ${leftOpen ? 'on' : ''}`} onClick={onLeft} aria-pressed={leftOpen}>{t('Layers')}</button>
      <SearchBox onSelect={onPlace} locked={locked} />
      <nav className="presets glass" aria-label={t('Camera presets')} data-tour="presets">
        {CAMERA_PRESETS.map((p) => (
          <button key={p.id} onClick={() => onFly(p)}>
            {t(p.label)}
          </button>
        ))}
        <CityMenu onCity={onCity} />
      </nav>
      <button className={`toggle glass ${rightOpen ? 'on' : ''}`} onClick={onRight} aria-pressed={rightOpen}>{t('Inspector')}</button>
      <Link className="toggle glass data-link" data-tour="data-link" to="/technical" aria-label={t('Data and sources')} title={`${t('Data and sources')}: ${t('Where the data comes from, with links, and how it is processed')}`}>
        <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <ellipse cx="10" cy="5" rx="6" ry="2.6" /><path d="M4 5v5c0 1.4 2.7 2.6 6 2.6s6-1.2 6-2.6V5M4 10v5c0 1.4 2.7 2.6 6 2.6s6-1.2 6-2.6v-5" />
        </svg>
      </Link>
      <button className={`toggle glass ai-btn ${aiPulse ? 'pulse' : ''}`} data-tour="ai" onClick={onAssistant} title={`${t('Assistant')} (Ctrl+K)`} aria-label={t('Assistant')}><span aria-hidden="true">✦</span> AI</button>
      <button className="toggle glass help-btn" onClick={onTour} aria-label={t('Guided tour')} title={t('Guided tour: what each part does')}>?</button>
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
