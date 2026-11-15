import { API_URL } from './api'

/** What a failed stream says besides its message (the backend's `fatal` event). */
export interface FatalInfo {
  code?: string
  level?: 'info' | 'warning' | 'error'
  vars?: Record<string, string | number>
}

export interface SseCallbacks {
  /** The stream finished normally; `data` is the payload of its `done` event (a summary, when the backend sends one). */
  done: (data: any) => void // eslint-disable-line @typescript-eslint/no-explicit-any
  /** The server reported a failure (or kept being busy), with a message in plain words and, from the backend, a code. */
  fatal: (message: string, info?: FatalInfo) => void
  /** The backend does not answer at all. */
  unreachable: () => void
  /** The server is up but busy: the request is being retried. */
  busy?: () => void
}

const MAX_RETRIES = 8

/**
 * Opens a Server-Sent Events stream and tells a busy server apart from a missing one. `EventSource` reports both
 * as the same error, so on an error the backend's `/health` is asked: if it answers, the server was only busy (HTTP
 * 503) and the request is retried with a growing pause; if it does not, the backend is unreachable.
 * Returns a function that closes everything.
 */
export function openSse(url: string, handlers: Record<string, (data: any) => void>, cb: SseCallbacks): () => void { // eslint-disable-line @typescript-eslint/no-explicit-any
  let es: EventSource | null = null
  let closed = false
  let finished = false
  let tries = 0
  let timer = 0

  const start = () => {
    const src = new EventSource(url)
    es = src
    for (const [name, fn] of Object.entries(handlers)) src.addEventListener(name, (e) => fn(JSON.parse((e as MessageEvent).data)))
    src.addEventListener('done', (e) => {
      finished = true
      src.close()
      cb.done(JSON.parse((e as MessageEvent).data))
    })
    src.addEventListener('fatal', (e) => {
      finished = true
      src.close()
      const d = JSON.parse((e as MessageEvent).data)
      cb.fatal(d.message, { code: d.code, level: d.level, vars: d.vars })
    })
    src.onerror = async () => {
      src.close() // the browser would reconnect and restart the job by itself: this decides instead
      if (finished || closed) return
      let up = false
      try {
        up = (await fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(3000) })).ok
      } catch { /* not reachable */ }
      if (closed) return
      if (!up) return cb.unreachable()
      if (++tries > MAX_RETRIES) return cb.fatal('The server is busy. Try again in a moment.')
      cb.busy?.()
      timer = window.setTimeout(() => { if (!closed) start() }, Math.min(8000, 1200 * tries))
    }
  }
  start()
  return () => {
    closed = true
    clearTimeout(timer)
    es?.close()
  }
}
