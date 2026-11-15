import { lazy, Suspense, useEffect } from 'react'
import { usePath } from './router'
import ProjectDeck from './pages/ProjectDeck'
import SatelliteDeck from './pages/SatelliteDeck'
import TechnicalPage from './pages/TechnicalPage'

const App = lazy(() => import('./App.tsx'))

/** Pages: `/` presents the project, `/satelite` is the satellite story, `/mapa` is the observatory. */
export default function Root() {
  const path = usePath().replace(/\/+$/, '') || '/'
  const isMap = path === '/mapa'
  const isTech = path === '/tecnico' // a reading page: it scrolls, unlike the map and the decks
  const isDeck = !isMap && !isTech
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
  if (path === '/satelite') return <SatelliteDeck />
  return <ProjectDeck />
}
