import type { Step } from '../components/Deck'
import { T } from './helpers'
import { OWN } from './projectOwn'
import { SATELLITE_STEPS } from './satelliteSteps'
import { AskMock, Flow, Tiles } from './visuals'
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
  sat('echo'),
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
  own('numbers'),
  own('layers'),
  {
    id: 'wind',
    kicker: T('Air currents', 'Correntes de ar', 'Corrientes de aire'),
    title: T('The air moves too', 'O ar também se move', 'El aire también se mueve'),
    fig: T('Wind at 850 hPa over the basin', 'Vento a 850 hPa sobre a bacia', 'Viento a 850 hPa sobre la cuenca'),
    narration: T(
      'The Amazon makes a good part of its own weather, and the air that moves over it matters. On the map you can switch on the air currents: thousands of small particles drawn along the real wind, about one and a half kilometres up, read live from Open-Meteo. The trade winds carry moisture from the Atlantic into the basin, the so-called flying rivers. When you watch the currents flow, you are watching where the rain-carrying air comes from, and why a dry spell can turn into a fire risk.',
      'A Amazônia produz boa parte do próprio clima, e o ar que se move sobre ela importa. No mapa você pode ligar as correntes de ar: milhares de pequenas partículas desenhadas ao longo do vento real, a cerca de um quilômetro e meio de altura, lido ao vivo do Open-Meteo. Os ventos alísios levam umidade do Atlântico para dentro da bacia, os chamados rios voadores. Quando você vê as correntes fluírem, está vendo de onde vem o ar que carrega a chuva, e por que uma seca pode virar risco de queimada.',
      'El Amazonas produce buena parte de su propio clima, y el aire que se mueve sobre él importa. En el mapa puedes encender las corrientes de aire: miles de pequeñas partículas dibujadas a lo largo del viento real, a unos mil quinientos metros de altura, leído en vivo de Open-Meteo. Los vientos alisios llevan humedad del Atlántico a la cuenca, los llamados ríos voladores. Cuando ves fluir las corrientes, ves de dónde viene el aire que carga la lluvia, y por qué una sequía puede convertirse en riesgo de incendio.'),
    render: () => <Flow />,
  },
  own('time'),
  own('forecast'),
  own('risks'),
  own('regions'),
  {
    id: 'assistant',
    kicker: T('Assistant', 'Assistente', 'Asistente'),
    title: T('Just ask', 'É só perguntar', 'Solo pregunta'),
    fig: T('The AI button on the map', 'O botão de IA no mapa', 'El botón de IA en el mapa'),
    narration: T(
      'You do not have to hunt through menus. On the map there is an AI button, or you can press Control K. A bar opens in the middle of the screen, with the map blurred behind it. Type what you want, in English, Portuguese or Spanish: fly to Manaus, show rain and temperature, open the Amazon forecast, simulate a magnitude seven earthquake here. If you connect an AI key on the backend, it also answers open questions about the project.',
      'Você não precisa caçar menus. No mapa há um botão de IA, ou você pode apertar Control K. Uma barra abre no meio da tela, com o mapa desfocado atrás. Digite o que quer, em inglês, português ou espanhol: ir para Manaus, mostrar chuva e temperatura, abrir a previsão da Amazônia, simular um terremoto de magnitude sete aqui. Se você conectar uma chave de IA no backend, ele também responde perguntas abertas sobre o projeto.',
      'No tienes que buscar entre menús. En el mapa hay un botón de IA, o puedes pulsar Control K. Se abre una barra en medio de la pantalla, con el mapa desenfocado detrás. Escribe lo que quieras, en inglés, portugués o español: ir a Manaos, mostrar lluvia y temperatura, abrir el pronóstico del Amazonas, simular un terremoto de magnitud siete aquí. Si conectas una clave de IA en el backend, también responde preguntas abiertas sobre el proyecto.'),
    render: () => (
      <AskMock lines={[
        T('Fly to Manaus', 'Ir para Manaus', 'Ir a Manaos'),
        T('Show rain and temperature', 'Mostrar chuva e temperatura', 'Mostrar lluvia y temperatura'),
        T('Open the Amazon forecast', 'Abrir a previsão da Amazônia', 'Abrir el pronóstico del Amazonas'),
        T('Simulate a magnitude 7 earthquake here', 'Simular um terremoto de magnitude 7 aqui', 'Simular un terremoto de magnitud 7 aquí'),
        T('Turn on the air currents', 'Ligar as correntes de ar', 'Encender las corrientes de aire'),
      ]} />
    ),
  },
  own('whatif'),
  ENGINE_STEPS.impact,
  sat('claims'),
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
