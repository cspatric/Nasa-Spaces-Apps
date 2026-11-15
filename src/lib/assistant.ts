import type { OverlayId } from './catalog'
import { CITIES } from './cities'
import type { DisasterKind, DisasterParams } from './disasters'
import type { Lang } from './i18n'
import type { RegionInfo } from './regions'

/**
 * The assistant bar understands commands in English, Portuguese and Spanish and turns them into actions on the map. It
 * runs in the page (no network). Anything it does not recognise can be sent to the backend's /assistant, which answers
 * open questions when an AI key is configured there.
 */
export type Action =
  | { type: 'fly'; lon: number; lat: number; zoom: number }
  | { type: 'layer'; id: OverlayId; on: boolean }
  | { type: 'allLayers'; on: boolean }
  | { type: 'region'; id: string }
  | { type: 'forecast' }
  | { type: 'disaster'; kind: DisasterKind; params: Partial<DisasterParams> }
  | { type: 'wind'; on: boolean }
  | { type: 'year'; year: number }
  | { type: 'clear' }

export interface Reply { text: string; actions: Action[]; matched: boolean }
export interface Ctx { lang: Lang; regions: RegionInfo[]; hasPoint: boolean }

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const has = (s: string, re: RegExp) => re.test(s)
const say = (lang: Lang, en: string, pt: string, es: string) => (lang === 'pt' ? pt : lang === 'es' ? es : en)

const OFF = /\b(off|hide|remove|turn off|disable|desliga\w*|apaga\w*|esconde\w*|oculta\w*|tira\w*|desativ\w*|quita\w*|apagar|ocultar|desactiv\w*)\b/
const LAYERS: { id: OverlayId; re: RegExp; en: string; pt: string; es: string }[] = [
  { id: 'imerg', re: /\b(rain|chuva|lluvia|precipit\w*)\b/, en: 'rain', pt: 'chuva', es: 'lluvia' },
  { id: 'lst', re: /\b(temperature|temperatura|calor|heat)\b/, en: 'land surface temperature', pt: 'temperatura da superfície', es: 'temperatura de la superficie' },
  { id: 'smap', re: /\b(soil|moisture|umidade|humedad|solo|suelo)\b/, en: 'soil moisture', pt: 'umidade do solo', es: 'humedad del suelo' },
  { id: 'water', re: /\b(surface water|agua superficial|agua|water|agua)\b/, en: 'surface water', pt: 'água superficial', es: 'agua superficial' },
  { id: 'dist', re: /\b(vegetation|vegetacao|vegetacion|desmat\w*|deforest\w*|alertas?|alerts?)\b/, en: 'vegetation loss alerts', pt: 'alertas de perda de vegetação', es: 'alertas de pérdida de vegetación' },
  { id: 'nisar', re: /\b(radar|nisar|backscatter|retroespalh\w*|retrodisper\w*)\b/, en: 'NISAR backscatter', pt: 'retroespalhamento NISAR', es: 'retrodispersión NISAR' },
]
const REGION_WORDS: { id: string; re: RegExp }[] = [
  { id: 'amazon', re: /\b(amazon\w*)\b/ },
  { id: 'sao-paulo', re: /\b(sao paulo|sp)\b/ },
  { id: 'rio-grande-do-sul', re: /\b(rio grande do sul|rs|gaucho\w*)\b/ },
]
const PLACES: { re: RegExp; lon: number; lat: number; zoom: number }[] = [
  { re: /\bandes\b/, lon: -71.98, lat: -13.5, zoom: 9.4 },
  { re: /\b(overview|visao geral|vista general|south america|america do sul|sudamerica)\b/, lon: -62, lat: -14, zoom: 3.4 },
]

export const SUGGESTIONS: Record<Lang, string[]> = {
  en: ['Fly to Manaus', 'Show rain and temperature', 'Open the Amazon forecast', 'Turn on the air currents', 'Simulate a magnitude 7 earthquake here'],
  pt: ['Ir para Manaus', 'Mostrar chuva e temperatura', 'Abrir a previsão da Amazônia', 'Ligar as correntes de ar', 'Simular um terremoto de magnitude 7 aqui'],
  es: ['Ir a Manaos', 'Mostrar lluvia y temperatura', 'Abrir el pronóstico del Amazonas', 'Encender las corrientes de aire', 'Simular un terremoto de magnitud 7 aquí'],
}

function number(s: string, re: RegExp): number | null {
  const m = s.match(re)
  return m ? Number(m[1].replace(',', '.')) : null
}

export function interpret(input: string, ctx: Ctx): Reply {
  const q = norm(input).trim()
  const { lang } = ctx
  if (!q) return { text: '', actions: [], matched: false }

  if (has(q, /\b(help|ajuda|ayuda|what can you|o que voce|que puedes|como funciona)\b/)) {
    return { matched: true, actions: [], text: say(lang,
      'I can fly to a city, switch NASA layers on and off, turn on the air currents, open a ready-made region (Amazon, São Paulo, Rio Grande do Sul), run the forecast of the selected point, simulate an earthquake, flood, wildfire or storm, and move the timeline to a year. Try: "show rain over the Amazon".',
      'Posso ir até uma cidade, ligar e desligar camadas da NASA, ligar as correntes de ar, abrir uma região pronta (Amazônia, São Paulo, Rio Grande do Sul), gerar a previsão do ponto selecionado, simular terremoto, enchente, incêndio ou tempestade, e levar a linha do tempo a um ano. Tente: "mostrar chuva sobre a Amazônia".',
      'Puedo ir a una ciudad, encender y apagar capas de la NASA, encender las corrientes de aire, abrir una región lista (Amazonas, São Paulo, Rio Grande do Sul), generar el pronóstico del punto seleccionado, simular terremoto, inundación, incendio o tormenta, y llevar la línea de tiempo a un año. Prueba: "mostrar lluvia sobre el Amazonas".') }
  }

  const actions: Action[] = []
  const notes: string[] = []
  const off = has(q, OFF)

  // air currents
  if (has(q, /\b(wind|vento|viento|corrente\w*|corriente\w*|air current\w*)\b/)) {
    actions.push({ type: 'wind', on: !off })
    notes.push(say(lang, off ? 'Air currents off' : 'Air currents on', off ? 'Correntes de ar desligadas' : 'Correntes de ar ligadas', off ? 'Corrientes de aire apagadas' : 'Corrientes de aire encendidas'))
  }

  // natural disaster simulations
  const risky = has(q, /\b(risk|risco|riesgo)\b/)
  if (has(q, /\b(earthquake|terremoto|sismo|temblor)\b/)) {
    const mag = number(q, /(?:magnitude|magnitud|mag|m)\s*(\d(?:[.,]\d)?)/) ?? number(q, /\b(\d(?:[.,]\d)?)\b/)
    const params: Partial<DisasterParams> = mag && mag >= 5 && mag <= 9 ? { magnitude: mag } : {}
    actions.push({ type: 'disaster', kind: 'earthquake', params })
    notes.push(say(lang, `Simulating an earthquake${params.magnitude ? ` of magnitude ${params.magnitude}` : ''}`, `Simulando um terremoto${params.magnitude ? ` de magnitude ${params.magnitude}` : ''}`, `Simulando un terremoto${params.magnitude ? ` de magnitud ${params.magnitude}` : ''}`))
  } else if (!risky && has(q, /\b(simul\w*|what if|e se|y si|imagine|cenario|escenario)\b/) && has(q, /\b(flood\w*|enchente\w*|inunda\w*|cheia)\b/)) {
    const rise = number(q, /(\d+(?:[.,]\d+)?)\s*(?:m|metros|meters|metres)\b/)
    actions.push({ type: 'disaster', kind: 'flood', params: rise ? { rise } : {} })
    notes.push(say(lang, 'Simulating a flood', 'Simulando uma enchente', 'Simulando una inundación'))
  } else if (!risky && has(q, /\b(fire|wildfire|incendio\w*|queimada\w*|fogo)\b/) && has(q, /\b(simul\w*|what if|e se|y si|imagine|cenario|escenario)\b/)) {
    const hours = number(q, /(\d+)\s*(?:h|horas|hours|hrs)\b/)
    actions.push({ type: 'disaster', kind: 'wildfire', params: hours ? { hours } : {} })
    notes.push(say(lang, 'Simulating a wildfire', 'Simulando um incêndio florestal', 'Simulando un incendio forestal'))
  } else if (!risky && has(q, /\b(storm|tempestade|tormenta|vendaval)\b/) && has(q, /\b(simul\w*|what if|e se|y si|imagine|cenario|escenario)\b/)) {
    const gust = number(q, /(\d+)\s*(?:km\/h|kmh|km)\b/)
    actions.push({ type: 'disaster', kind: 'storm', params: gust ? { gust } : {} })
    notes.push(say(lang, 'Simulating a storm', 'Simulando uma tempestade', 'Simulando una tormenta'))
  }

  // forecast and risk of a region or the selected point
  if (!actions.some((a) => a.type === 'disaster') && has(q, /\b(risk|risco|riesgo|forecast|previs\w*|pronostic\w*|prediccion|predict\w*)\b/)) {
    const reg = REGION_WORDS.find((r) => r.re.test(q))
    if (reg) {
      const info = ctx.regions.find((r) => r.id === reg.id)
      if (info?.ready) {
        actions.push({ type: 'region', id: reg.id })
        notes.push(say(lang, `Opening the ${info.name} forecast, ready-made`, `Abrindo a previsão de ${info.name}, já pronta`, `Abriendo el pronóstico de ${info.name}, ya listo`))
      } else notes.push(say(lang, 'That region is not prepared yet', 'Essa região ainda não está preparada', 'Esa región aún no está preparada'))
    } else if (ctx.hasPoint) {
      actions.push({ type: 'forecast' })
      notes.push(say(lang, 'Running the forecast for the selected place', 'Gerando a previsão do lugar selecionado', 'Generando el pronóstico del lugar seleccionado'))
    } else notes.push(say(lang, 'Select a point or an area on the map first, or name a region (Amazon, São Paulo, Rio Grande do Sul)', 'Selecione um ponto ou uma área no mapa primeiro, ou cite uma região (Amazônia, São Paulo, Rio Grande do Sul)', 'Selecciona primero un punto o un área en el mapa, o nombra una región (Amazonas, São Paulo, Rio Grande do Sul)'))
  }

  // layers
  if (has(q, /\b(all layers|todas as camadas|todas las capas|clear layers|limpar camadas|limpiar capas)\b/)) {
    actions.push({ type: 'allLayers', on: !off && !has(q, /\b(clear|limpar|limpiar)\b/) })
    notes.push(say(lang, 'Layers cleared', 'Camadas limpas', 'Capas limpiadas'))
  } else if (!actions.some((a) => a.type === 'disaster' || a.type === 'wind' || a.type === 'region')) {
    const got = LAYERS.filter((l) => l.re.test(q))
    for (const l of got) actions.push({ type: 'layer', id: l.id, on: !off })
    if (got.length) notes.push(say(lang, `${off ? 'Hiding' : 'Showing'} ${got.map((l) => l.en).join(' and ')}`, `${off ? 'Escondendo' : 'Mostrando'} ${got.map((l) => l.pt).join(' e ')}`, `${off ? 'Ocultando' : 'Mostrando'} ${got.map((l) => l.es).join(' y ')}`))
  }

  // timeline
  const year = number(q, /\b(20(?:1\d|2\d|30))\b/)
  if (year !== null && !has(q, /\bmagnitud\w*\b/)) {
    actions.push({ type: 'year', year })
    notes.push(say(lang, `Moving the timeline to ${year}`, `Levando a linha do tempo a ${year}`, `Llevando la línea de tiempo a ${year}`))
  }

  // places
  if (!actions.some((a) => a.type === 'region')) {
    const place = PLACES.find((p) => p.re.test(q))
    const city = [...CITIES].sort((a, b) => b.name.length - a.name.length).find((c) => q.includes(norm(c.name)))
    if (place) { actions.push({ type: 'fly', lon: place.lon, lat: place.lat, zoom: place.zoom }); notes.push(say(lang, 'Flying there', 'Indo até lá', 'Yendo allí')) }
    else if (city) { actions.push({ type: 'fly', lon: city.lon, lat: city.lat, zoom: city.rank === 1 ? 12.8 : 13.2 }); notes.push(say(lang, `Flying to ${city.name}`, `Indo para ${city.name}`, `Yendo a ${city.name}`)) }
    else if (!actions.length) {
      const reg = REGION_WORDS.find((r) => r.re.test(q))
      const info = reg && ctx.regions.find((r) => r.id === reg.id)
      if (info) { actions.push({ type: 'fly', lon: info.center[0], lat: info.center[1], zoom: info.zoom }); notes.push(say(lang, `Flying to ${info.name}`, `Indo para ${info.name}`, `Yendo a ${info.name}`)) }
    }
  }

  if (has(q, /\b(clear|limpar|limpiar|reset|cancel\w*)\b/) && !actions.length) {
    actions.push({ type: 'clear' })
    notes.push(say(lang, 'Cleared the simulation and the selection', 'Simulação e seleção limpas', 'Simulación y selección limpiadas'))
  }

  if (!actions.length && !notes.length) return { text: '', actions: [], matched: false }
  return { matched: true, actions, text: notes.join('. ') + '.' }
}
