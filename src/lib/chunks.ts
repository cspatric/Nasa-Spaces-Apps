/**
 * Time chunking for the live series: only the days around the timeline date are read, in fixed
 * chunks, so a point opens in seconds. Moving the date asks for the chunks it newly needs; chunks
 * already read are kept, and the backend caches every scene it has processed.
 */
export const DAY = 86_400_000
export const CHUNK_DAYS = 30

export const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10)
export const chunkOf = (ms: number) => Math.floor(ms / (CHUNK_DAYS * DAY))
/** Inclusive first and last day of a chunk (ISO dates). */
export const chunkRange = (c: number) => ({ start: isoDay(c * CHUNK_DAYS * DAY), end: isoDay((c + 1) * CHUNK_DAYS * DAY - DAY) })

/** Chunks covering [dateMs - beforeDays, dateMs + afterDays] clipped to [minMs, maxMs], closest to the date first. */
export function neededChunks(dateMs: number, beforeDays: number, afterDays: number, minMs: number, maxMs: number): number[] {
  const lo = chunkOf(Math.max(minMs, dateMs - beforeDays * DAY))
  const hi = chunkOf(Math.min(maxMs, dateMs + afterDays * DAY))
  const here = chunkOf(Math.min(maxMs, Math.max(minMs, dateMs)))
  const out: number[] = []
  for (let c = lo; c <= hi; c++) out.push(c)
  return out.sort((a, b) => Math.abs(a - here) - Math.abs(b - here))
}

/**
 * Runs `open` for each chunk one after the other. `open` must call `next` when its chunk is finished
 * and return a function that aborts it. Returns a function that cancels everything.
 */
export function runQueue(chunks: number[], open: (chunk: number, next: () => void) => () => void, onIdle: () => void): () => void {
  const queue = [...chunks]
  let stopped = false
  let abort = () => {}
  const step = () => {
    if (stopped) return
    const c = queue.shift()
    if (c === undefined) return onIdle()
    abort = open(c, step)
  }
  step()
  return () => {
    stopped = true
    abort()
  }
}
