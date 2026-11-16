import type { TourStep } from '../components/Tour'

/**
 * The guided tour: six short steps, in the order a person uses the page. Texts are English keys (translated in i18n.ts).
 * `before` actions are run by the app (see runTour in App.tsx) so that what a step talks about is on screen.
 */
export const TOUR_STEPS: TourStep[] = [
  { id: 'click', before: 'panels', ring: true, title: 'Click a point on the map', body: 'Start here: click anywhere, or search a city above. The panel on the right is about that place.' },
  { id: 'analysis', before: 'demo', target: '[data-tour="analysis"]', side: 'left', title: 'Analyze a period', body: 'Pick the dates and press Analyze. Radar and rain fill in, with notes on how far to trust them.' },
  { id: 'tabs', target: '[data-tour="tabs"]', side: 'left', title: 'Forecast and regions', body: 'Forecast projects the place to 2030. Regions has forecasts prepared ahead.' },
  { id: 'layers', target: '[data-tour="layers"]', side: 'right', title: 'Layers', body: 'NASA layers, 3D buildings, air currents and disaster simulations.' },
  { id: 'timeline', target: '[data-tour="timeline"]', side: 'top', title: 'Timeline', body: 'Drag the triangle to change the date. The striped part is simulation, not real imagery.' },
  { id: 'ai', target: '[data-tour="ai"]', side: 'bottom', title: 'Ask the AI', body: 'Type what you want, in your language: "fly to Manaus", "show rain". Reopen this tour with the ? button.' },
]
