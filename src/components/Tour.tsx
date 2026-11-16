import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../lib/i18n'

export interface TourStep {
  id: string
  /** CSS selector of the part of the page this step is about; without one the card sits in the middle. */
  target?: string
  /** English text (the key of the translation). */
  title: string
  body: string
  /** Something to do before the step is shown, so the part it talks about exists (the app decides what it means). */
  before?: string
  side?: 'left' | 'right' | 'top' | 'bottom'
  /** A pulsing ring in the middle of the map, for "click here" steps. */
  ring?: boolean
}

interface Props {
  steps: TourStep[]
  onClose: (finished: boolean) => void
  run: (action: string) => void
}

const CARD_W = 360
const GAP = 16
const PAD = 8

type Box = { x: number; y: number; w: number; h: number }

/** Where the card goes: beside the highlighted part, on the side that has room, kept inside the window. */
function place(box: Box | null, side: TourStep['side'], cardH: number, ring = false): { left: number; top: number } {
  const vw = window.innerWidth, vh = window.innerHeight
  // no highlighted part: the card sits in the middle, or higher up when the middle of the map holds the pulsing ring
  if (!box) return { left: Math.max(12, (vw - CARD_W) / 2), top: Math.max(12, ring ? vh * 0.14 : (vh - cardH) / 2) }
  const fits = {
    right: box.x + box.w + PAD + GAP + CARD_W <= vw - 8,
    left: box.x - PAD - GAP - CARD_W >= 8,
    bottom: box.y + box.h + PAD + GAP + cardH <= vh - 8,
    top: box.y - PAD - GAP - cardH >= 8,
  }
  const order = [side, 'right', 'left', 'bottom', 'top'].filter(Boolean) as (keyof typeof fits)[]
  const pick = order.find((s) => fits[s]) ?? 'bottom'
  let left = 0, top = 0
  if (pick === 'right') { left = box.x + box.w + PAD + GAP; top = box.y }
  else if (pick === 'left') { left = box.x - PAD - GAP - CARD_W; top = box.y }
  else if (pick === 'bottom') { left = box.x + box.w / 2 - CARD_W / 2; top = box.y + box.h + PAD + GAP }
  else { left = box.x + box.w / 2 - CARD_W / 2; top = box.y - PAD - GAP - cardH }
  return { left: Math.min(Math.max(12, left), vw - CARD_W - 12), top: Math.min(Math.max(12, top), vh - cardH - 12) }
}

/**
 * A guided tour: the page is dimmed except for the part a step is about, and a card says what it does. It can be skipped
 * at any time (Esc, or the Skip button); the arrow keys and Enter move through it. It never changes your work: the app
 * decides what each `before` action does and undoes it when the tour ends.
 */
export default function Tour({ steps, onClose, run }: Props) {
  const { t } = useI18n()
  const [i, setI] = useState(0)
  const [box, setBox] = useState<Box | null>(null)
  const [cardH, setCardH] = useState(210)
  const card = useRef<HTMLDivElement>(null)
  const runRef = useRef(run)
  useEffect(() => { runRef.current = run })
  const step = steps[i]
  const last = i === steps.length - 1

  // The actions a step needs (open a panel, pick a place) run when the step is reached.
  useEffect(() => { if (step.before) runRef.current(step.before) }, [step])

  // Follow the highlighted part while panels slide open and the window changes, for a short time after each step.
  useEffect(() => {
    let raf = 0, n = 0
    const measure = () => {
      const el = step.target ? document.querySelector(step.target) : null
      const r = el?.getBoundingClientRect()
      const next = r && r.width > 4 && r.height > 4 ? { x: r.left, y: r.top, w: r.width, h: r.height } : null
      setBox((b) => (b && next && Math.abs(b.x - next.x) < 1 && Math.abs(b.y - next.y) < 1 && Math.abs(b.w - next.w) < 1 && Math.abs(b.h - next.h) < 1 ? b : next))
      if (card.current) setCardH((h) => (Math.abs(h - card.current!.offsetHeight) < 2 ? h : card.current!.offsetHeight))
    }
    const tick = () => { measure(); if (n++ < 50) raf = requestAnimationFrame(tick) }
    tick()
    window.addEventListener('resize', measure)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', measure) }
  }, [step])

  const next = () => (last ? onClose(true) : setI(i + 1))
  const back = () => setI(Math.max(0, i - 1))
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(false) }
      else if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); next() }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); back() }
    }
    window.addEventListener('keydown', key, true)
    return () => window.removeEventListener('keydown', key, true)
  })
  const primary = useRef<HTMLButtonElement>(null)
  useEffect(() => { primary.current?.focus() }, [i])

  const pos = place(box, step.side, cardH, step.ring)
  return (
    <div className="tour" role="dialog" aria-modal="true" aria-label={t('Guided tour')}>
      {box ? <div className="tour-spot" style={{ left: box.x - PAD, top: box.y - PAD, width: box.w + PAD * 2, height: box.h + PAD * 2 }} /> : <div className="tour-dim" />}
      {step.ring && <div className="tour-ring" aria-hidden="true"><i /><i /><b /></div>}
      <div className="tour-card" ref={card} style={{ left: pos.left, top: pos.top, width: CARD_W }}>
        <div className="tour-step mono">{String(i + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}</div>
        <h3>{t(step.title)}</h3>
        <p>{t(step.body)}</p>
        <div className="tour-dots" aria-hidden="true">{steps.map((s, k) => <i key={s.id} className={k === i ? 'cur' : k < i ? 'done' : ''} />)}</div>
        <div className="tour-actions">
          <button className="tour-skip" onClick={() => onClose(false)}>{t('Skip tour')}</button>
          <span className="grow" />
          {i > 0 && <button className="btn ghost" onClick={back}>← {t('Back')}</button>}
          <button className="btn primary" ref={primary} onClick={next}>{last ? t('Start exploring') : t('Next')} {last ? '' : '→'}</button>
        </div>
      </div>
    </div>
  )
}
