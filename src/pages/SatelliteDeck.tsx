import Deck from '../components/Deck'
import { T } from './helpers'
import { SATELLITE_STEPS } from './satelliteSteps'

export default function SatelliteDeck() {
  return (
    <Deck
      deck="satellite" name="NISAR · DANCING WITH THE SARS" steps={SATELLITE_STEPS}
      finish={{ to: '/mapa', label: T('Open the map', 'Abrir o mapa', 'Abrir el mapa') }}
      skip={{ to: '/mapa', label: T('Skip to the map', 'Ir ao mapa', 'Ir al mapa') }}
      back={{ to: '/', label: T('The project', 'O projeto', 'El proyecto') }} />
  )
}
