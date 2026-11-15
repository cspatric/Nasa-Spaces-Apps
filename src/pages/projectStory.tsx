import type { Chapter, Step } from '../components/Deck'
import { T } from './helpers'
import { ImpactList, MlStory, PixelMatrix, Scorecard } from './visuals2'

/**
 * The story spine of the project deck: a problem, the tool that can see it, the engine (the machine learning that
 * turns radar into "normal" and "unusual"), the observatory built on it, what it means beyond one forest, and the
 * honest limits. Each page also states the problem it answers and how.
 */

export const PROJECT_CHAPTERS: Chapter[] = [
  { label: T('Problem', 'Problema', 'Problema'), ids: ['cover', 'problem'] },
  { label: T('Instrument', 'Instrumento', 'Instrumento'), ids: ['meet', 'echo', 'pixels', 'dates'] },
  { label: T('Engine', 'Motor', 'Motor'), ids: ['ml', 'validate'] },
  { label: T('Observatory', 'Observatório', 'Observatorio'), ids: ['built', 'numbers', 'layers', 'wind', 'time', 'forecast', 'risks', 'regions', 'assistant', 'whatif'] },
  { label: T('Impact', 'Impacto', 'Impacto'), ids: ['impact'] },
  { label: T('Trust', 'Confiança', 'Confianza'), ids: ['claims', 'honest'] },
  { label: T('Act', 'Agir', 'Actuar'), ids: ['next'] },
]

/** The new pages of the engine chapter and the closing impact page. */
export const ENGINE_STEPS: Record<string, Step> = {
  pixels: {
    id: 'pixels',
    kicker: T('The echo, as numbers', 'O eco, em números', 'El eco, en números'),
    title: T('A radar image is a grid of numbers', 'Uma imagem de radar é uma grade de números', 'Una imagen de radar es una cuadrícula de números'),
    narration: T(
      'Now let us see what the machine actually receives. A radar image is not a photo, it is a grid of numbers: each pixel stores how much of the pulse came back. That raw value is linear and spans a huge range, so we convert it to decibels, ten times the base ten logarithm. In decibels, a dark pixel means little came back, like calm water, and a bright one means a lot, like a roof or a tree trunk. Click any pixel to see both values.',
      'Agora vamos ver o que a máquina realmente recebe. Uma imagem de radar não é uma foto, é uma grade de números: cada pixel guarda quanto do pulso voltou. Esse valor bruto é linear e cobre uma faixa enorme, então o convertemos em decibéis, dez vezes o logaritmo na base dez. Em decibéis, um pixel escuro quer dizer que voltou pouco, como água parada, e um claro quer dizer que voltou muito, como um telhado ou um tronco. Clique em qualquer pixel para ver os dois valores.',
      'Ahora veamos qué recibe realmente la máquina. Una imagen de radar no es una foto, es una cuadrícula de números: cada píxel guarda cuánto del pulso volvió. Ese valor bruto es lineal y abarca un rango enorme, así que lo convertimos en decibelios, diez veces el logaritmo en base diez. En decibelios, un píxel oscuro significa que volvió poco, como agua quieta, y uno claro que volvió mucho, como un techo o un tronco. Haz clic en cualquier píxel para ver los dos valores.'),
    render: () => <PixelMatrix />,
  },
  ml: {
    id: 'ml',
    kicker: T('The analysis · machine learning', 'A análise · aprendizado de máquina', 'El análisis · aprendizaje automático'),
    title: T('The model learns what is normal', 'O modelo aprende o que é normal', 'El modelo aprende lo que es normal'),
    narration: T(
      'This is the heart of the project. For each place, the model learns what is normal: the yearly rhythm of the radar and of the rain, month by month, over ten years. Then it asks two questions. What should this place look like in the coming months? And did a month fall outside what is normal? When the radar leaves the expected band for a long time, and the rain does not explain it, that place gets a high score. Watch the three stages, or click one.',
      'Este é o coração do projeto. Para cada lugar, o modelo aprende o que é normal: o ritmo anual do radar e da chuva, mês a mês, ao longo de dez anos. Depois faz duas perguntas. Como este lugar deve estar nos próximos meses? E algum mês saiu do que é normal? Quando o radar sai da faixa esperada por muito tempo, e a chuva não explica, aquele lugar recebe uma nota alta. Acompanhe as três etapas, ou clique em uma.',
      'Este es el corazón del proyecto. Para cada lugar, el modelo aprende lo que es normal: el ritmo anual del radar y de la lluvia, mes a mes, durante diez años. Luego hace dos preguntas. ¿Cómo debería estar este lugar en los próximos meses? ¿Y algún mes se salió de lo normal? Cuando el radar sale de la banda esperada por mucho tiempo, y la lluvia no lo explica, ese lugar recibe una nota alta. Mira las tres etapas, o haz clic en una.'),
    render: () => <MlStory />,
  },
  validate: {
    id: 'validate',
    kicker: T('The proof', 'A prova', 'La prueba'),
    title: T('A model has to earn its place', 'Um modelo precisa merecer o seu lugar', 'Un modelo tiene que ganarse su lugar'),
    narration: T(
      'A clever model can still be wrong, so it has to earn its place. We always compare it with a simple rule: the average of the same month in past years. And we test on places and years the model has never seen, sixteen rounds, each with a different draw. The model only reaches the map if it beats the rule. Then three results come out: an anomaly layer on the map, a chart with the expected range, and a scorecard with the model and the rule side by side.',
      'Um modelo esperto ainda pode errar, então ele precisa merecer o seu lugar. Nós sempre o comparamos com uma regra simples: a média do mesmo mês em anos passados. E testamos em lugares e anos que o modelo nunca viu, dezesseis rodadas, cada uma com um sorteio diferente. O modelo só chega ao mapa se vencer a regra. Aí saem três resultados: uma camada de anomalia no mapa, um gráfico com a faixa esperada e um placar com o modelo e a regra lado a lado.',
      'Un modelo astuto aún puede equivocarse, así que tiene que ganarse su lugar. Siempre lo comparamos con una regla simple: el promedio del mismo mes en años pasados. Y probamos en lugares y años que el modelo nunca vio, dieciséis rondas, cada una con un sorteo distinto. El modelo solo llega al mapa si supera la regla. Entonces salen tres resultados: una capa de anomalía en el mapa, un gráfico con el rango esperado y un marcador con el modelo y la regla lado a lado.'),
    render: () => <Scorecard />,
  },
  impact: {
    id: 'impact',
    kicker: T('Beyond one forest', 'Além de uma floresta', 'Más allá de un bosque'),
    title: T('The Amazon reaches the rest of South America', 'A Amazônia alcança o resto da América do Sul', 'El Amazonas llega al resto de Sudamérica'),
    narration: T(
      'Finally, why this matters beyond one forest. The Amazon breathes out moisture, and the winds carry it south and west, rivers of vapour in the sky. It feeds the Andes, it rains on the centre and southeast of Brazil, on São Paulo, and it reaches the south and the Plata basin. Studies link the forest to rain far downwind, so when it changes, the rain can change too. That is why our map forecasts São Paulo and Rio Grande do Sul beside the Amazon: what happens in one is read in the others.',
      'Por fim, por que isso importa além de uma floresta. A Amazônia solta umidade, e os ventos a levam para o sul e o oeste, rios de vapor no céu. Ela alimenta os Andes, faz chover no centro e no sudeste do Brasil, em São Paulo, e chega ao sul e à bacia do Prata. Estudos ligam a floresta à chuva muito além, então quando ela muda, a chuva também pode mudar. Por isso o nosso mapa prevê São Paulo e o Rio Grande do Sul ao lado da Amazônia: o que acontece em uma é lido nas outras.',
      'Por último, por qué esto importa más allá de un bosque. El Amazonas exhala humedad, y los vientos la llevan al sur y al oeste, ríos de vapor en el cielo. Alimenta los Andes, llueve en el centro y el sudeste de Brasil, en São Paulo, y llega al sur y a la cuenca del Plata. Los estudios vinculan el bosque con la lluvia muy a sotavento, así que cuando cambia, la lluvia también puede cambiar. Por eso nuestro mapa pronostica São Paulo y Rio Grande do Sul junto al Amazonas: lo que pasa en uno se lee en los otros.'),
    render: () => <ImpactList />,
  },
}

/** The problem each page answers, and how, in two short lines. Keyed by step id. */
export const PA: Record<string, { p: Step['problem']; a: Step['answer'] }> = {
  problem: { p: T('Clouds hide the Amazon from ordinary satellites', 'As nuvens escondem a Amazônia dos satélites comuns', 'Las nubes esconden el Amazonas de los satélites comunes'), a: T('Radar sends its own pulse, so it sees through clouds and at night', 'O radar envia o próprio pulso: enxerga através das nuvens e de noite', 'El radar envía su propio pulso: ve a través de las nubes y de noche') },
  meet: { p: T('We need a sensor that works every day, in any weather', 'Precisamos de um sensor que funcione todo dia, com qualquer tempo', 'Necesitamos un sensor que funcione cada día, con cualquier clima'), a: T('NISAR: L-band radar that feels trunks and branches', 'NISAR: radar banda L que sente troncos e galhos', 'NISAR: radar banda L que siente troncos y ramas') },
  echo: { p: T('A bright or dark pixel means nothing by itself', 'Um pixel claro ou escuro não diz nada sozinho', 'Un píxel claro u oscuro no dice nada por sí solo'), a: T('Learn what each surface sends back', 'Aprender o que cada superfície devolve', 'Aprender lo que devuelve cada superficie') },
  pixels: { p: T('Raw radar values are hard to compare', 'Os valores brutos do radar são difíceis de comparar', 'Los valores brutos del radar son difíciles de comparar'), a: T('Convert to decibels: every pixel on one scale', 'Converter em decibéis: todo pixel na mesma escala', 'Convertir a decibelios: cada píxel en la misma escala') },
  dates: { p: T('Change is invisible in a single image', 'A mudança é invisível numa imagem só', 'El cambio es invisible en una sola imagen'), a: T('Compare two dates and set a threshold', 'Comparar duas datas e definir um limiar', 'Comparar dos fechas y fijar un umbral') },
  ml: { p: T('No one can read ten years of every pixel', 'Ninguém consegue ler dez anos de cada pixel', 'Nadie puede leer diez años de cada píxel'), a: T('The model learns normal and flags what leaves it', 'O modelo aprende o normal e sinaliza o que sai dele', 'El modelo aprende lo normal y señala lo que sale de él') },
  validate: { p: T('A clever model can still be wrong', 'Um modelo esperto ainda pode errar', 'Un modelo astuto aún puede equivocarse'), a: T('It must beat a simple rule on data it never saw', 'Precisa vencer uma regra simples em dados que nunca viu', 'Debe superar una regla simple con datos que nunca vio') },
  built: { p: T('Data is scattered across archives', 'Os dados estão espalhados por vários arquivos', 'Los datos están dispersos en varios archivos'), a: T('One 3D map that reads it live', 'Um mapa 3D que lê tudo ao vivo', 'Un mapa 3D que lo lee en vivo') },
  numbers: { p: T('A tool nobody can check is a tool nobody trusts', 'Uma ferramenta que ninguém confere ninguém confia', 'Una herramienta que nadie puede verificar nadie confía'), a: T('Open numbers: layers, years, places, regions', 'Números abertos: camadas, anos, lugares, regiões', 'Números abiertos: capas, años, lugares, regiones') },
  layers: { p: T('Many datasets and colors are easy to misread', 'Muitos dados e cores são fáceis de confundir', 'Muchos datos y colores son fáciles de confundir'), a: T('One layer, one color, at every zoom', 'Uma camada, uma cor, em qualquer zoom', 'Una capa, un color, en cualquier zoom') },
  wind: { p: T('Where does the rain come from?', 'De onde vem a chuva?', '¿De dónde viene la lluvia?'), a: T('Live air currents over the basin', 'Correntes de ar ao vivo sobre a bacia', 'Corrientes de aire en vivo sobre la cuenca') },
  time: { p: T('Real data and guesses get mixed up', 'Dado real e palpite se misturam', 'Dato real y suposición se mezclan'), a: T('Observed until today, striped scenarios after', 'Observado até hoje, cenários listrados depois', 'Observado hasta hoy, escenarios rayados después') },
  forecast: { p: T('We learn about damage only after it happens', 'Só ficamos sabendo do dano depois que acontece', 'Solo nos enteramos del daño cuando ya ocurrió'), a: T('Forecast to 2030 with an honest error band', 'Previsão até 2030 com faixa de erro honesta', 'Pronóstico a 2030 con banda de error honesta') },
  risks: { p: T('Where should we look first?', 'Onde devemos olhar primeiro?', '¿Dónde debemos mirar primero?'), a: T('Four risk signals for each place', 'Quatro sinais de risco para cada lugar', 'Cuatro señales de riesgo para cada lugar') },
  regions: { p: T('Analysis takes minutes, decisions need seconds', 'A análise leva minutos, a decisão precisa de segundos', 'El análisis toma minutos, la decisión necesita segundos'), a: T('Regional forecasts prepared ahead of time', 'Previsões regionais preparadas com antecedência', 'Pronósticos regionales preparados con antelación') },
  assistant: { p: T('Maps are hard to operate under pressure', 'Mapas são difíceis de operar sob pressão', 'Los mapas son difíciles de operar bajo presión'), a: T('Just ask, in your own language', 'É só perguntar, no seu idioma', 'Solo pregunta, en tu idioma') },
  whatif: { p: T('How bad could it get?', 'Quão ruim pode ficar?', '¿Qué tan grave podría ser?'), a: T('Simulate an event and watch its zones grow', 'Simule um evento e veja as zonas crescerem', 'Simula un evento y mira crecer sus zonas') },
  impact: { p: T('A change in one forest is felt far away', 'A mudança numa floresta é sentida longe', 'El cambio en un bosque se siente lejos'), a: T('Read the Amazon and the regions it feeds together', 'Ler a Amazônia e as regiões que ela alimenta juntas', 'Leer el Amazonas y las regiones que alimenta juntos') },
  claims: { p: T('Over-claiming destroys trust', 'Exagerar destrói a confiança', 'Exagerar destruye la confianza'), a: T('Say only what the data supports', 'Dizer só o que os dados sustentam', 'Decir solo lo que respaldan los datos') },
  honest: { p: T('A model that is sure of everything is lying', 'Um modelo seguro de tudo está mentindo', 'Un modelo seguro de todo está mintiendo'), a: T('Say what we know, what we guess, and what we do not know', 'Dizer o que sabemos, o que supomos e o que não sabemos', 'Decir lo que sabemos, lo que suponemos y lo que no sabemos') },
}

/** Narrations rewritten so the whole deck reads as one argument: here is a problem, here is how we solve it. */
export const STORY_NARRATION: Record<string, Step['narration']> = {
  cover: T(
    'Every year, forests, rivers and cities change faster than anyone can watch. When something goes wrong, a clearing, a flood, a fire, we often learn too late: clouds hide the ground, the data is scattered, and nobody can tell what is real from what is a guess. SARIS is our answer. In a few minutes I will show you the problem, the satellite that cracks it, the machine learning at the core, and the observatory we built on top.',
    'Todo ano, florestas, rios e cidades mudam mais rápido do que alguém consegue acompanhar. Quando algo dá errado, um desmatamento, uma enchente, um incêndio, muitas vezes ficamos sabendo tarde demais: as nuvens escondem o chão, os dados estão espalhados e ninguém distingue o que é real do que é palpite. O SARIS é a nossa resposta. Em poucos minutos vou mostrar o problema, o satélite que o resolve, o aprendizado de máquina no centro e o observatório que construímos em cima.',
    'Cada año, bosques, ríos y ciudades cambian más rápido de lo que nadie puede vigilar. Cuando algo sale mal, una tala, una inundación, un incendio, muchas veces nos enteramos tarde: las nubes esconden el suelo, los datos están dispersos y nadie distingue lo real de una suposición. SARIS es nuestra respuesta. En unos minutos te mostraré el problema, el satélite que lo resuelve, el aprendizaje automático del centro y el observatorio que construimos encima.'),
  problem: T(
    'Imagine you need to know whether a patch of forest was cleared last week. A normal satellite takes a photo, but over the Amazon the clouds are there most of the year, so the photo comes back white, exactly when you most need to know. Radar solves the first half of the problem. It sends its own pulse and listens to the echo, so clouds do not matter, and it works at night too.',
    'Imagine que você precisa saber se um pedaço de floresta foi derrubado na semana passada. Um satélite comum tira uma foto, mas sobre a Amazônia as nuvens estão lá quase o ano todo, e a foto volta branca, justo quando você mais precisa saber. O radar resolve a primeira metade do problema. Ele envia o próprio pulso e escuta o eco, então as nuvens não importam, e ele funciona de noite também.',
    'Imagina que necesitas saber si un trozo de selva fue talado la semana pasada. Un satélite normal toma una foto, pero sobre el Amazonas las nubes están casi todo el año, y la foto vuelve blanca, justo cuando más necesitas saberlo. El radar resuelve la primera mitad del problema. Envía su propio pulso y escucha el eco, así que las nubes no importan, y funciona también de noche.'),
  built: T(
    'Seeing is only half of it, people have to act on what they see. So here is the observatory, in four parts. A 3D map of South and Central America, with real relief, buildings and streets. Live data, read at the moment you ask, around the date you choose. A timeline that goes to 2030, where observed data and scenarios never get mixed. And an assistant you can simply talk to.',
    'Enxergar é só metade, as pessoas precisam agir sobre o que veem. Então aqui está o observatório, em quatro partes. Um mapa 3D da América do Sul e Central, com relevo, prédios e ruas reais. Dados ao vivo, lidos na hora em que você pede, em torno da data que escolher. Uma linha do tempo que vai até 2030, onde dados observados e cenários nunca se misturam. E um assistente com quem você pode simplesmente conversar.',
    'Ver es solo la mitad, la gente tiene que actuar sobre lo que ve. Así que aquí está el observatorio, en cuatro partes. Un mapa 3D de Sudamérica y Centroamérica, con relieve, edificios y calles reales. Datos en vivo, leídos en el momento en que los pides, alrededor de la fecha que elijas. Una línea de tiempo que llega a 2030, donde datos observados y escenarios nunca se mezclan. Y un asistente con el que puedes simplemente hablar.'),
  next: T(
    'That is the problem and our answer: see through the clouds, learn what is normal, flag what is not, look ahead with an honest band, and read the Amazon together with the regions it feeds. Now it is your turn. Press the button to open the map, pick a place, and ask it what is changing.',
    'Esse é o problema e a nossa resposta: enxergar através das nuvens, aprender o que é normal, sinalizar o que não é, olhar à frente com uma faixa honesta e ler a Amazônia junto com as regiões que ela alimenta. Agora é a sua vez. Aperte o botão para abrir o mapa, escolha um lugar e pergunte o que está mudando.',
    'Ese es el problema y nuestra respuesta: ver a través de las nubes, aprender lo que es normal, señalar lo que no lo es, mirar adelante con una banda honesta y leer el Amazonas junto con las regiones que alimenta. Ahora es tu turno. Pulsa el botón para abrir el mapa, elige un lugar y pregunta qué está cambiando.'),
}

const SAT_PA: Record<string, { p: Step['problem']; a: Step['answer'] }> = {
  rain: { p: T('Rain alone can fake a change', 'A chuva sozinha pode fingir uma mudança', 'La lluvia sola puede fingir un cambio'), a: T('Compare the signal with the rain, and its lag', 'Comparar o sinal com a chuva e a sua defasagem', 'Comparar la señal con la lluvia y su desfase') },
  model: { p: T('A model nobody tested proves nothing', 'Um modelo que ninguém testou não prova nada', 'Un modelo que nadie probó no prueba nada'), a: T('It only counts if it beats the simple rule', 'Só vale se vencer a regra simples', 'Solo cuenta si supera la regla simple') },
}
export const SATELLITE_CHAPTERS: Chapter[] = [
  { label: T('Instrument', 'Instrumento', 'Instrumento'), ids: ['cover', 'meet', 'history', 'echo', 'numbers'] },
  { label: T('Method', 'Método', 'Método'), ids: ['dates', 'claims', 'rain', 'model'] },
  { label: T('Trust', 'Confiança', 'Confianza'), ids: ['honest'] },
  { label: T('Act', 'Agir', 'Actuar'), ids: ['next'] },
]
/** The satellite deck keeps its own narrations; it only gets the problem and solution lines. */
export function withProblems(steps: Step[]): Step[] {
  return steps.map((s) => { const x = SAT_PA[s.id] ?? (s.id === 'numbers' ? undefined : PA[s.id]); return x ? { ...s, problem: x.p, answer: x.a } : s })
}

/** Adds the problem and solution lines and the rewritten narrations. */
export function withStory(steps: Step[]): Step[] {
  return steps.map((s) => ({ ...s, narration: STORY_NARRATION[s.id] ?? s.narration, problem: PA[s.id]?.p, answer: PA[s.id]?.a }))
}
