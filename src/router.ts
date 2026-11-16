import { useSyncExternalStore } from 'react'

/** A tiny router: the site has three pages, so the History API is enough. */
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((f) => f())
if (typeof window !== 'undefined') window.addEventListener('popstate', notify)

const subscribe = (f: () => void) => {
  listeners.add(f)
  return () => listeners.delete(f)
}

export function navigate(to: string) {
  if (to === location.pathname) return
  history.pushState({}, '', to)
  window.scrollTo(0, 0)
  notify()
}

/** Changes the address without adding a history entry (used to send old links to their new place). */
export function replace(to: string) {
  if (to === location.pathname) return
  history.replaceState({}, '', to)
  notify()
}

export const usePath = () => useSyncExternalStore(subscribe, () => location.pathname, () => '/')
