import { lazy, Suspense, useEffect } from 'react'
import { usePath } from './router'
import Story from './pages/Story'

const App = lazy(() => import('./App.tsx'))

/** Pages: `/` presents the project, `/satelite` is the satellite story, `/mapa` is the observatory. */
export default function Root() {
  const path = usePath().replace(/\/+$/, '') || '/'
  const isMap = path === '/mapa'
  useEffect(() => {
    document.body.classList.toggle('is-app', isMap) // the map page fills the window; the story pages scroll
    if (path === '/satelite') window.location.replace('/satelite.html') // the satellite story is a page of its own
  }, [isMap, path])
  if (isMap) {
    return (
      <Suspense fallback={<div className="loading">Loading…</div>}>
        <App />
      </Suspense>
    )
  }
  if (path === '/satelite') return null
  return <Story />
}
