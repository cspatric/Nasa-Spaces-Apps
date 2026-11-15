import { lazy, Suspense, useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type PointerEvent, type ReactNode } from 'react'
import { LANGS, useI18n, type Lang } from '../lib/i18n'
import { emitNarration, onNarration } from '../lib/narration'
import { voice } from '../lib/voice'
import { IMMERSIVE } from '../lib/spaceScene'
import { sound } from '../lib/sound'
import { navigate } from '../router'
import Link from './Link'
import './deck.css'

/** A text in the three languages. */
export type Tri = Record<Lang, string>

export interface Step {
  id: string
  kicker: Tri
  title: Tri
  /** What the narrator says, as if someone were explaining the problem. Also what a voice layer will read. */
  narration: Tri
  /** A figure caption shown on the instrument screen (kept for the record; the page no longer prints it). */
  fig?: Tri
  /** The problem this page is about, and how the project answers it: two short lines shown under the title. */
  problem?: Tri
  answer?: Tri
  /** Replaces the heading (the cover uses it). */
  heading?: ReactNode
  /** Centered, no instrument screen. */
  solo?: boolean
  /** What is drawn on the instrument screen. */
  render?: () => ReactNode
}

/** A chapter of the story: a label and the pages in it. */
export interface Chapter { label: Tri; ids: string[] }

interface Props {
  name: string
  chapters?: Chapter[]
  deck: string
  steps: Step[]
  finish: { to: string; label: Tri }
  skip: { to: string; label: Tri }
  back?: { to: string; label: Tri }
}

function Clock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return <span>UTC {now.toISOString().slice(11, 19)}</span>
}

/** A field of stars, drawn once (and again on resize). A few twinkle through CSS-free canvas redraws are not needed: it stays still, the camera moves it. */
function Stars() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const draw = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2), w = c.clientWidth, h = c.clientHeight
      c.width = w * dpr; c.height = h * dpr
      const g = c.getContext('2d')!
      g.scale(dpr, dpr)
      let a = 20260
      const rnd = () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296 }
      const n = Math.round((w * h) / 4200)
      for (let k = 0; k < n; k++) {
        const x = rnd() * w, y = rnd() * h, big = rnd()
        const r = big > 0.985 ? 1.5 : big > 0.9 ? 1 : 0.6
        const tint = rnd() > 0.8 ? '170,200,255' : rnd() > 0.7 ? '255,226,190' : '235,242,255'
        g.fillStyle = `rgba(${tint},${0.35 + rnd() * 0.6})`
        g.beginPath(); g.arc(x, y, r, 0, 6.283); g.fill()
        if (r > 1.2) { const gr = g.createRadialGradient(x, y, 0, x, y, 7); gr.addColorStop(0, `rgba(${tint},.35)`); gr.addColorStop(1, `rgba(${tint},0)`); g.fillStyle = gr; g.fillRect(x - 7, y - 7, 14, 14) }
      }
    }
    draw()
    addEventListener('resize', draw)
    return () => removeEventListener('resize', draw)
  }, [])
  return <canvas ref={ref} className="stars" aria-hidden="true" />
}

/** Splits a narration into sentences (the caption shows one at a time, like subtitles). */
const sentences = (t: string) => (t.match(/[^.!?]+[.!?]+["')\]]*\s*|[^.!?]+$/g) ?? [t]).map((x) => x.trim()).filter(Boolean)

/**
 * The narrator as subtitles: one sentence at a time, following the recording when there is one (otherwise a reading
 * clock of about 14 characters a second), so it never covers the figure. A click opens the whole text.
 */
function Caption({ text, label }: { text: string; label: string }) {
  const parts = useMemo(() => sentences(text), [text])
  const [i, setI] = useState(0)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const t0 = performance.now()
    const id = setInterval(() => {
      const p = voice.progress() ?? Math.min(1, ((performance.now() - t0) / 1000 * 14.5) / text.length)
      let acc = 0, k = 0
      for (; k < parts.length - 1; k++) { acc += parts[k].length / text.length; if (acc > p) break }
      setI((v) => Math.max(v, k))
    }, 120)
    return () => clearInterval(id)
  }, [text, parts])
  const longest = parts.reduce((m, x) => (x.length > m.length ? x : m), '')
  return (
    <div className={`cap ${open ? 'open' : ''}`} role="group" aria-label={label} data-narration={text}>
      <span className="sr">{text}</span>
      {open && <div className="cap-full">{text}</div>}
      <button className="cap-row" onClick={() => setOpen((v) => !v)} aria-expanded={open} title={open ? '−' : '≡'}>
        <span className="eq live" aria-hidden="true"><i /><i /><i /><i /><i /></span>
        <span className="cap-tw" aria-hidden="true"><span className="ghost">{longest}</span><span className="now" key={i}>{parts[i]}</span></span>
        <span className="cap-n mono" aria-hidden="true">{i + 1}/{parts.length}</span>
      </button>
      <div className="cap-bar" aria-hidden="true">{parts.map((_, k) => <i key={k} className={k < i ? 'done' : k === i ? 'cur' : ''} style={{ flexGrow: parts[k].length }} />)}</div>
    </div>
  )
}

const SpaceBackdrop = lazy(() => import('./space/SpaceBackdrop'))

export default function Deck({ name, chapters, deck, steps, finish, skip, back }: Props) {
  const { lang, setLang } = useI18n()
  const [i, setI] = useState(0)
  const step = steps[i]
  const last = i === steps.length - 1
  const tx = (o: Tri) => o[lang]
  const immersive = IMMERSIVE.has(step.id) || !!step.solo

  const next = () => {
    sound.click()
    if (last) navigate(finish.to)
    else setI(i + 1)
  }
  const prev = () => {
    sound.click()
    if (i > 0) setI(i - 1)
    else if (back) navigate(back.to)
  }

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || (e.key === ' ' && el.tagName !== 'BUTTON')) { e.preventDefault(); next() }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); prev() }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  })

  const muted = useSyncExternalStore(voice.subscribe, voice.isMuted)
  useEffect(() => {
    const off = onNarration(voice.handle)
    return () => { off(); voice.stop() }
  }, [])
  useEffect(() => {
    emitNarration({ deck, step: step.id, index: i, lang, text: step.narration[lang] })
  }, [deck, step, i, lang, muted]) // `muted` too: turning the voice back on speaks the current page again

  const root = useRef<HTMLDivElement>(null)
  // The parallax follows the pointer at most once per frame, in steps of 0.05, so a still hand costs nothing and a moving one little.
  const pending = useRef<{ x: number; y: number } | null>(null)
  const frameId = useRef(0)
  const lastLook = useRef({ x: 9, y: 9 })
  const look = (e: PointerEvent<HTMLDivElement>) => {
    pending.current = { x: e.clientX, y: e.clientY }
    if (frameId.current) return
    frameId.current = requestAnimationFrame(() => {
      frameId.current = 0
      const el = root.current, p = pending.current
      if (!el || !p) return
      const x = Math.round(((p.x / innerWidth - 0.5) * 2) * 20) / 20, y = Math.round(((p.y / innerHeight - 0.5) * 2) * 20) / 20
      if (x === lastLook.current.x && y === lastLook.current.y) return
      lastLook.current = { x, y }
      el.style.setProperty('--mx', String(x))
      el.style.setProperty('--my', String(y))
    })
  }
  useEffect(() => () => cancelAnimationFrame(frameId.current), [])
  // every page frames the "camera" differently; the background glides there instead of jumping
  const frame = { '--fx': `${Math.sin(i * 2.1) * 7}vmin`, '--fy': `${Math.cos(i * 1.7) * 4}vmin`, '--fr': `${Math.sin(i * 1.3) * 9}deg`, '--fz': 1 + (i % 4) * 0.045 } as CSSProperties
  return (
    <div className="deck" ref={root} style={frame} onPointerMove={look}>
      <div className="bg" aria-hidden="true"><Stars /></div>
      <Suspense fallback={null}><SpaceBackdrop focus={step.id} immersive={immersive} lang={lang} /></Suspense>
      <div className="scrim" aria-hidden="true" />

      <header className="dk-hud mono">
        <div className="id"><b>SARIS</b><span>{name}</span></div>
        {chapters && (
          <nav className="dk-chap" aria-label="Story">
            {chapters.map((c, k) => {
              const cur = c.ids.includes(step.id), at = steps.findIndex((x) => x.id === c.ids[0])
              return <button key={k} className={cur ? 'cur' : chapters.findIndex((d) => d.ids.includes(step.id)) > k ? 'done' : ''} onClick={() => { sound.click(); if (at >= 0) setI(at) }}><i>{String(k + 1).padStart(2, '0')}</i>{tx(c.label)}</button>
            })}
          </nav>
        )}
        <div className="rt">
          <Clock />
          <button className={`dk-voice ${muted ? '' : 'on'}`} onClick={() => voice.setMuted(!muted)} aria-pressed={!muted}
            title={lang === 'en' ? (muted ? 'Turn the narrator on' : 'Mute the narrator') : 'Voice: English only'}>
            {muted ? '♪ off' : '♪ voice'}
          </button>
          <div className="dk-lang" role="group" aria-label="Language">
            {LANGS.map((l) => <button key={l.id} className={lang === l.id ? 'on' : ''} title={l.name} onClick={() => setLang(l.id)}>{l.label}</button>)}
          </div>
          <Link to={skip.to} className="skip">{tx(skip.label)} →</Link>
        </div>
      </header>

      <main className={`slide ${step.solo ? 'solo' : ''} ${immersive ? 'immersive' : ''}`} key={`${step.id}-${lang === 'en' ? 'a' : 'b'}`}>
        <div className="copy">
          <div className="kick mono">{step.solo ? tx(step.kicker) : `${String(i).padStart(2, '0')} · ${tx(step.kicker).replace(/^\d\d · /, '')}`}</div>
          {step.heading ?? <h2>{tx(step.title)}</h2>}
          {step.problem && step.answer && (
            <div className="pa">
              <span className="p"><b>{lang === 'pt' ? 'Problema' : lang === 'es' ? 'Problema' : 'Problem'}</b>{tx(step.problem)}</span>
              <span className="arrow" aria-hidden="true">→</span>
              <span className="a"><b>{lang === 'pt' ? 'Solução' : lang === 'es' ? 'Solución' : 'Solution'}</b>{tx(step.answer)}</span>
            </div>
          )}
        </div>
        {!step.solo && step.render && (
          <div className="stage">
            <div className="cam">{step.render()}</div>
          </div>
        )}
      </main>

      <Caption key={`${step.id}-${lang}`} text={tx(step.narration)} label={lang === 'pt' ? 'Narração' : lang === 'es' ? 'Narración' : 'Narration'} />

      <footer className="foot">
        <button className="dk-btn" onClick={prev} disabled={i === 0 && !back}>← {lang === 'pt' ? 'Voltar' : lang === 'es' ? 'Atrás' : 'Back'}</button>
        <div className="ticks" role="tablist" aria-label="Steps">
          {steps.map((s, k) => <button key={s.id} role="tab" aria-selected={k === i} aria-label={`${k + 1}`} className={k < i ? 'done' : k === i ? 'cur' : ''} onClick={() => { sound.click(); setI(k) }} />)}
        </div>
        <span className="dk-count mono">{String(i + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}</span>
        <button className="dk-btn go" onClick={next}>{last ? tx(finish.label) : lang === 'pt' ? 'Continuar' : lang === 'es' ? 'Continuar' : 'Continue'} →</button>
      </footer>
    </div>
  )
}
