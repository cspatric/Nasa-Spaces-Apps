/**
 * Narration seam for the presentation decks. Every step has a narration text; when a step appears the deck emits it
 * here. A voice layer (text to speech, recorded audio...) registers one handler and speaks `text` in `lang`, and can
 * stop its audio when `step` changes. Nothing speaks until a handler is registered.
 */
export interface NarrationEvent {
  deck: string
  step: string
  index: number
  lang: string
  text: string
}

let handler: ((e: NarrationEvent) => void) | null = null

/** Register the voice layer (returns a function that unregisters it). */
export function onNarration(fn: (e: NarrationEvent) => void): () => void {
  handler = fn
  return () => { if (handler === fn) handler = null }
}

export const emitNarration = (e: NarrationEvent) => handler?.(e)
