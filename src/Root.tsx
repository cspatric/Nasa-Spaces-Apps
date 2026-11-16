import { lazy, Suspense, useEffect } from 'react'
import { replace, usePath } from './router'
import ProjectDeck from './pages/ProjectDeck'
import SatelliteDeck from './pages/SatelliteDeck'
import TechnicalPage from './pages/TechnicalPage'

const App = lazy(() => import('./App.tsx'))

/** Pages: `/` presents the project, `/satellite` is the satellite story, `/map` is the observatory, `/technical` is data and methods. */

/** Addresses used before the routes were renamed: links that were already shared keep working. */
const OLD: Record<string, string> = { '/mapa': '/map', '/satelite': '/satellite', '/tecnico': '/technical' }

export default function Root() {
  const path = usePath().replace(/\/+$/, '') || '/'
  const isMap = path === '/map'
  const isTech = path === '/technical' // a reading page: it scrolls, unlike the map and the decks
  const isDeck = !isMap && !isTech
  useEffect(() => { if (OLD[path]) replace(OLD[path]) }, [path])
  useEffect(() => {
    document.body.classList.toggle('is-app', isMap) // the map and the decks fill the window and never scroll the page
    document.body.classList.toggle('is-deck', isDeck)
  }, [isMap, isDeck])
  if (isMap) {
    return (
      <Suspense fallback={<div className="loading">Loading…</div>}>
        <App />
      </Suspense>
    )
  }
  if (isTech) return <TechnicalPage />
  if (path === '/satellite') return <SatelliteDeck />
  return <ProjectDeck />
}
