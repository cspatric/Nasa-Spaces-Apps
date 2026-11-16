import Deck from '../components/Deck'
import { T } from './helpers'
import { PROJECT_STEPS } from './projectSteps'
import { PROJECT_CHAPTERS } from './projectStory'

export default function ProjectDeck() {
  return (
    <Deck
      deck="project" name="MISSION BRIEF" steps={PROJECT_STEPS} chapters={PROJECT_CHAPTERS}
      finish={{ to: '/map', label: T('Open the map', 'Abrir o mapa', 'Abrir el mapa') }}
      skip={{ to: '/map', label: T('Skip to the map', 'Ir ao mapa', 'Ir al mapa') }} />
  )
}
