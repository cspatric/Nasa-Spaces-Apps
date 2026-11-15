import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type PointerEvent, type ReactNode } from 'react'
import { LANGS, useI18n, type Lang } from '../lib/i18n'
import { emitNarration, onNarration } from '../lib/narration'
import { voice } from '../lib/voice'
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
  /** A figure caption shown on the instrument screen. */
  fig?: Tri
  /** Replaces the heading (the cover uses it). */
  heading?: ReactNode
  /** Centered, no instrument screen. */
  solo?: boolean
  /** What is drawn on the instrument screen. */
  render?: () => ReactNode
}

interface Props {
  name: string
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

/** The narrator's words appear as if they were being spoken; a click shows all of it. */
function Narration({ text, label }: { text: string; label: string }) {
  const still = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
  const [n, setN] = useState(still ? text.length : 0)
  useEffect(() => {
    if (still) return
    const id = setInterval(() => setN((v) => { if (v >= text.length) { clearInterval(id); return v } return v + 2 }), 22)
    return () => clearInterval(id)
  }, [text, still])
  const done = n >= text.length
  return (
    <div className="narr" onClick={() => setN(text.length)} role="status" aria-live="polite" data-narration={text}>
      <div className="label mono"><span>{label}</span><span className={`eq ${done ? '' : 'live'}`} aria-hidden="true"><i /><i /><i /><i /><i /></span></div>
      <div className="tw">
        <p className="ghost" aria-hidden="true">{text}</p>
        <p className="typed">{done ? text : text.slice(0, n)}{!done && <span className="cursor" />}</p>
      </div>
    </div>
  )
}

export default function Deck({ name, deck, steps, finish, skip, back }: Props) {
  const { lang, setLang } = useI18n()
  const [i, setI] = useState(0)
  const step = steps[i]
  const last = i === steps.length - 1
  const tx = (o: Tri) => o[lang]

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
  const look = (e: PointerEvent<HTMLDivElement>) => {
    const el = root.current
    if (!el) return
    el.style.setProperty('--mx', String((e.clientX / innerWidth - 0.5) * 2))
    el.style.setProperty('--my', String((e.clientY / innerHeight - 0.5) * 2))
  }
  // every page frames the "camera" differently; the background glides there instead of jumping
  const frame = { '--fx': `${Math.sin(i * 2.1) * 7}vmin`, '--fy': `${Math.cos(i * 1.7) * 4}vmin`, '--fr': `${Math.sin(i * 1.3) * 9}deg`, '--fz': 1 + (i % 4) * 0.045 } as CSSProperties
  return (
    <div className="deck" ref={root} style={frame} onPointerMove={look}>
      <div className="bg" aria-hidden="true"><div className="limb" /><div className="arc a1" /><div className="arc a2" /></div>

      <header className="dk-hud mono">
        <div className="id"><b>SARIS</b><span>{name}</span></div>
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

      <main className={`slide ${step.solo ? 'solo' : ''}`} key={`${step.id}-${lang === 'en' ? 'a' : 'b'}`}>
        <div className="copy">
          <div className="kick mono">{step.solo ? tx(step.kicker) : `${String(i).padStart(2, '0')} · ${tx(step.kicker).replace(/^\d\d · /, '')}`}</div>
          {step.heading ?? <h2>{tx(step.title)}</h2>}
          <Narration key={`${step.id}-${lang}`} text={tx(step.narration)} label={lang === 'pt' ? 'Narração' : lang === 'es' ? 'Narración' : 'Narration'} />
        </div>
        {!step.solo && step.render && (
          <div className="stage">
            {step.fig && <div className="fig mono"><b>FIG. {String(i + 1).padStart(2, '0')}</b><span>{tx(step.fig)}</span></div>}
            <div className="cam">{step.render()}</div>
          </div>
        )}
      </main>

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
