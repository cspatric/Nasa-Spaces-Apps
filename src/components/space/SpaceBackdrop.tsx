import { useEffect, useRef } from 'react'
import { createSpace, type SpaceApi } from '../../lib/spaceScene'

/** The deck's moving backdrop: a 3D solar-system view the camera flies through, one waypoint per page. */
export default function SpaceBackdrop({ focus, immersive, lang }: { focus: string; immersive: boolean; lang: string }) {
  const host = useRef<HTMLDivElement>(null)
  const api = useRef<SpaceApi | null>(null)
  useEffect(() => {
    let made: SpaceApi | null = null
    try { made = createSpace(host.current!) } catch { return } // no WebGL: the CSS stars stay
    api.current = made
    return () => { made?.dispose(); api.current = null }
  }, [])
  useEffect(() => { api.current?.fly(focus, immersive) }, [focus, immersive])
  useEffect(() => { api.current?.setLang(lang) }, [lang])
  return <div ref={host} className="space" aria-hidden="true" />
}
