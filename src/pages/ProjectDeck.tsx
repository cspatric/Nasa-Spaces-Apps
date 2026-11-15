import Deck from '../components/Deck'
import { T } from './helpers'
import { PROJECT_STEPS } from './projectSteps'

export default function ProjectDeck() {
  return (
    <Deck
      deck="project" name="MISSION BRIEF" steps={PROJECT_STEPS}
      finish={{ to: '/mapa', label: T('Open the map', 'Abrir o mapa', 'Abrir el mapa') }}
      skip={{ to: '/mapa', label: T('Skip to the map', 'Ir ao mapa', 'Ir al mapa') }} />
  )
}
