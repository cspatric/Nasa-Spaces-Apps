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
let muted = (() => { try { return localStorage.getItem(KEY) === '1' } catch { return false } })()
const listeners = new Set<() => void>()

// Every narration that starts gets a number. Anything that finishes later (a play() that is refused, a retry waiting for a
// click) first checks it still holds the latest number; otherwise it is about a page we already left and does nothing.
// Without this, pressing Continue stopped the old audio, the interrupted play() reported a failure after the fact, and that
// failure armed a "play on the next click" that brought the previous page's voice back.
let current = 0
let retry: (() => void) | null = null

const url = (e: NarrationEvent) => `${import.meta.env.BASE_URL}audio/${e.lang}/${e.deck}-${e.step}.mp3`

function clearRetry() {
  if (!retry) return
  window.removeEventListener('pointerdown', retry)
  window.removeEventListener('keydown', retry)
  retry = null
}

function stop() {
  current++
  clearRetry()
  if (audio) {
    const a = audio
    audio = null
    a.pause()
    a.removeAttribute('src')
    a.load() // releases the file; nothing from it can play or fire any more
  }
}

function start(src: string) {
  const mine = ++current
  const a = new Audio(src)
  audio = a
  a.play().catch((err: unknown) => {
    if (mine !== current || audio !== a || muted) return // a newer page, or muted, took over
    // The browser only blocks sound before the first click: wait for it, once. Other failures (a missing file) give up.
    if ((err as DOMException)?.name !== 'NotAllowedError') return
    retry = () => {
      clearRetry()
      // a moment later: if this very click or key press also changes the page, the new page's voice replaces this one first
      setTimeout(() => { if (mine === current && !muted) { audio = null; start(src) } }, 80)
    }
    window.addEventListener('pointerdown', retry, { once: true })
    window.addEventListener('keydown', retry, { once: true })
  })
}

export const voice = {
  /** Handler for `onNarration`. */
  handle(e: NarrationEvent) {
    stop() // the page changed: the previous voice ends right here
    if (muted || !LANGS_WITH_AUDIO.has(e.lang)) return
    start(url(e))
  },
  stop,
  /** How far the current recording has played (0 to 1), or null when nothing is playing. */
  progress(): number | null {
    return audio && !audio.paused && Number.isFinite(audio.duration) && audio.duration > 0 ? audio.currentTime / audio.duration : null
  },
  isMuted: () => muted,
  setMuted(v: boolean) {
    muted = v
    try { localStorage.setItem(KEY, v ? '1' : '0') } catch { /* private mode */ }
    if (v) stop()
    listeners.forEach((l) => l())
  },
  subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l) } },
}
