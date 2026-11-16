import Deck from '../components/Deck'
import { T } from './helpers'
import { SATELLITE_CHAPTERS, satelliteDeckSteps } from './projectStory'

export default function SatelliteDeck() {
  return (
    <Deck
      deck="satellite" name="NISAR · DANCING WITH THE SARS" steps={satelliteDeckSteps()} chapters={SATELLITE_CHAPTERS}
      finish={{ to: '/map', label: T('Open the map', 'Abrir o mapa', 'Abrir el mapa') }}
      skip={{ to: '/map', label: T('Skip to the map', 'Ir ao mapa', 'Ir al mapa') }}
      back={{ to: '/', label: T('The project', 'O projeto', 'El proyecto') }} />
  )
}
