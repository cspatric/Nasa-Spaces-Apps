import type { Tri } from '../components/Deck'
import { useI18n } from '../lib/i18n'

export const T = (en: string, pt: string, es: string): Tri => ({ en, pt, es })

/** Small deterministic random generator, so the drawings are the same every time. */
export function rng(seed: number) {
  let a = seed
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function useTx() {
  const { lang } = useI18n()
  return (o: Tri) => o[lang]
}
