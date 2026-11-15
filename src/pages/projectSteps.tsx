import type { Step } from '../components/Deck'
import { T } from './helpers'
import { OWN } from './projectOwn'
import { SATELLITE_STEPS } from './satelliteSteps'
import { Tiles } from './visuals'
import { ENGINE_STEPS, withStory } from './projectStory'

const own = (id: string) => OWN.find((s) => s.id === id)!
const sat = (id: string) => SATELLITE_STEPS.find((s) => s.id === id)!

/**
 * The story of the project, as one arc: the problem, the instrument that answers it (NISAR), how to read its signal,
 * what SARIS builds from it (layers, air currents, time, forecast, risks, regions, assistant, simulations), and the
 * honest wording. The last step opens the map.
 */
export const PROJECT_STEPS: Step[] = withStory([
  {
    ...own('cover'),
    narration: T(
      'Hello. This is SARIS, an observatory that watches how the land changes. I will take you through one idea at a time: a problem, the satellite that can solve it, how to read what it says, and then the map we built with it. At the end you will open that map yourself. Press Continue whenever you are ready.',
      'Olá. Este é o SARIS, um observatório que acompanha como a terra muda. Vou levar você por uma ideia de cada vez: um problema, o satélite que pode resolvê-lo, como ler o que ele diz, e depois o mapa que construímos com isso. No fim, você mesmo vai abrir esse mapa. Aperte Continuar quando estiver pronto.',
      'Hola. Este es SARIS, un observatorio que sigue cómo cambia la tierra. Te llevaré por una idea a la vez: un problema, el satélite que puede resolverlo, cómo leer lo que dice, y luego el mapa que construimos con eso. Al final abrirás ese mapa tú mismo. Pulsa Continuar cuando estés listo.'),
  },
  own('problem'),
  sat('meet'),
  ENGINE_STEPS.pixels,
  sat('dates'),
  ENGINE_STEPS.ml,
  ENGINE_STEPS.validate,
  {
    ...own('built'),
    kicker: T('From signal to place', 'Do sinal ao lugar', 'De la señal al lugar'),
    title: T('Now we put it on a map', 'Agora colocamos isso num mapa', 'Ahora lo ponemos en un mapa'),
    narration: T(
      'You now know how a radar listens and how two dates reveal change. The next question is where. So we built an observatory with four parts. A 3D map of South and Central America, with real relief, buildings and streets. Live data, read at the moment you ask, around the date you choose. A timeline that goes to 2030, where observed data and scenarios never get mixed. And an assistant you can simply talk to.',
      'Agora você sabe como um radar escuta e como duas datas revelam mudança. A próxima pergunta é onde. Então construímos um observatório com quatro partes. Um mapa 3D da América do Sul e Central, com relevo, prédios e ruas reais. Dados ao vivo, lidos na hora em que você pede, em torno da data que escolher. Uma linha do tempo que vai até 2030, onde dados observados e cenários nunca se misturam. E um assistente com quem você pode simplesmente conversar.',
      'Ahora sabes cómo escucha un radar y cómo dos fechas revelan el cambio. La siguiente pregunta es dónde. Así que construimos un observatorio con cuatro partes. Un mapa 3D de Sudamérica y Centroamérica, con relieve, edificios y calles reales. Datos en vivo, leídos en el momento en que los pides, alrededor de la fecha que elijas. Una línea de tiempo que llega a 2030, donde datos observados y escenarios nunca se mezclan. Y un asistente con el que puedes simplemente hablar.'),
    render: () => (
      <Tiles items={[
        { title: T('A 3D map', 'Um mapa 3D', 'Un mapa 3D'), text: T('Real relief, buildings and streets, only over the region of the study.', 'Relevo, prédios e ruas reais, só sobre a região do estudo.', 'Relieve, edificios y calles reales, solo sobre la región del estudio.') },
        { title: T('Live data', 'Dados ao vivo', 'Datos en vivo'), text: T('NISAR and OPERA radar, IMERG rain and the wind, read around the date you choose.', 'Radar NISAR e OPERA, chuva IMERG e o vento, lidos em torno da data que você escolhe.', 'Radar NISAR y OPERA, lluvia IMERG y el viento, leídos alrededor de la fecha que eliges.') },
        { title: T('A timeline to 2030', 'Uma linha do tempo até 2030', 'Una línea de tiempo hasta 2030'), text: T('Observed until today, scenarios after it, never mixed.', 'Observado até hoje, cenários depois, nunca misturados.', 'Observado hasta hoy, escenarios después, nunca mezclados.') },
        { title: T('An assistant', 'Um assistente', 'Un asistente'), text: T('Type what you want, in your language, and the map does it.', 'Digite o que quer, no seu idioma, e o mapa faz.', 'Escribe lo que quieres, en tu idioma, y el mapa lo hace.') },
      ]} />
    ),
  },
  own('layers'),
  own('time'),
  own('risks'),
  own('regions'),
  ENGINE_STEPS.impact,
  own('honest'),
  {
    id: 'next', solo: true,
    kicker: T('Now use it', 'Agora use', 'Ahora úsalo'),
    title: T('Open the map', 'Abra o mapa', 'Abre el mapa'),
    narration: T(
      'That is the whole story: a problem, an instrument that can see through it, and an observatory that turns the signal into places, forecasts and risks, with honest words. Now it is your turn. Press the button to open the map.',
      'Esta é a história inteira: um problema, um instrumento que enxerga através dele e um observatório que transforma o sinal em lugares, previsões e riscos, com palavras honestas. Agora é a sua vez. Aperte o botão para abrir o mapa.',
      'Esta es la historia completa: un problema, un instrumento que ve a través de él y un observatorio que convierte la señal en lugares, pronósticos y riesgos, con palabras honestas. Ahora es tu turno. Pulsa el botón para abrir el mapa.'),
  },
])
