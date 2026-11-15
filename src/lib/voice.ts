import type { NarrationEvent } from './narration'

/**
 * The narrator's voice. Audio is pre-generated (scripts/narrate.mjs, Cartesia text to speech) as
 * public/audio/<lang>/<deck>-<step>.mp3; only English exists today, other languages stay silent and keep the text.
 * Registered through `onNarration`, so decks never know about audio. Browsers block sound before the first click, so a
 * narration that could not start waits for the first click or key press.
 */
const KEY = 'saris:voice-muted'
const LANGS_WITH_AUDIO = new Set(['en'])

let audio: HTMLAudioElement | null = null
let pending: string | null = null
let muted = (() => { try { return localStorage.getItem(KEY) === '1' } catch { return false } })()
const listeners = new Set<() => void>()

const url = (e: NarrationEvent) => `${import.meta.env.BASE_URL}audio/${e.lang}/${e.deck}-${e.step}.mp3`

function stop() {
  pending = null
  if (audio) { audio.pause(); audio.src = ''; audio = null }
}

function start(src: string) {
  audio = new Audio(src)
  audio.play().then(() => { pending = null }, () => {
    // not allowed yet (no click so far) or the file is missing: retry once on the first gesture
    pending = src
    const retry = () => { if (pending === src && !muted) { pending = null; start(src) } }
    window.addEventListener('pointerdown', retry, { once: true })
    window.addEventListener('keydown', retry, { once: true })
  })
}

export const voice = {
  /** Handler for `onNarration`. */
  handle(e: NarrationEvent) {
    stop()
    if (muted || !LANGS_WITH_AUDIO.has(e.lang)) return
    start(url(e))
  },
  stop,
  isMuted: () => muted,
  setMuted(v: boolean) {
    muted = v
    try { localStorage.setItem(KEY, v ? '1' : '0') } catch { /* private mode */ }
    if (v) stop()
    listeners.forEach((l) => l())
  },
  subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l) } },
}
