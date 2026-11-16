import type { Chapter, Step } from '../components/Deck'
import { T } from './helpers'
import { SATELLITE_STEPS } from './satelliteSteps'
import { DriversPicker, FutureList, ImpactList, MlStory, PixelMatrix, Scorecard } from './visuals2'

/**
 * The story spine of the project deck: a problem, the tool that can see it, the engine (the machine learning that
 * turns radar into "normal" and "unusual"), the observatory built on it, what it means beyond one forest, and the
 * honest limits. Each page also states the problem it answers and how.
 */

export const PROJECT_CHAPTERS: Chapter[] = [
  { label: T('Problem', 'Problema', 'Problema'), ids: ['cover', 'problem'] },
  { label: T('Instrument', 'Instrumento', 'Instrumento'), ids: ['meet', 'pixels', 'drivers', 'dates'] },
  { label: T('Engine', 'Motor', 'Motor'), ids: ['ml', 'validate'] },
  { label: T('Observatory', 'Observatório', 'Observatorio'), ids: ['built', 'risks', 'regions'] },
  { label: T('Impact', 'Impacto', 'Impacto'), ids: ['impact', 'future'] },
  { label: T('Trust', 'Confiança', 'Confianza'), ids: ['honest'] },
  { label: T('Act', 'Agir', 'Actuar'), ids: ['next'] },
]

/** One short narration per page (a few sentences: what the page says, no more). The voice reads the same text. */
const N: Record<string, Step['narration']> = {
  drivers: T(
    'Radar says that something changed, not why, so we hypothesise the physical driver. A felled or burnt forest loses its canopy, and the cross-polarized echo drops. Water under trees makes the echo bounce twice, and the co-polarized one brightens. Pick a driver to see which polarization shows it.',
    'O radar diz que algo mudou, não por quê, então levantamos hipóteses sobre a causa física. Uma floresta derrubada ou queimada perde a copa, e o eco em polarização cruzada cai. Água sob as árvores faz o eco rebater duas vezes, e o co-polarizado fica mais brilhante. Escolha uma causa para ver qual polarização a mostra.',
    'El radar dice que algo cambió, no por qué, así que planteamos hipótesis sobre la causa física. Un bosque talado o quemado pierde su copa, y el eco en polarización cruzada cae. El agua bajo los árboles hace rebotar el eco dos veces, y el copolarizado se vuelve más brillante. Elige una causa para ver qué polarización la muestra.'),
  future: T(
    'NISAR is only the start. The same radar measures ground motion to centimetres, glacier and sea-ice flow, wetlands, crops, soil moisture and forest biomass. Next we want an interferometry layer for earthquakes and subsidence, and ascending plus descending passes.',
    'O NISAR é só o começo. O mesmo radar mede movimento do solo em centímetros, o fluxo de geleiras e gelo marinho, áreas úmidas, lavouras, umidade do solo e biomassa florestal. Em seguida queremos uma camada de interferometria para terremotos e subsidência, e passagens ascendentes e descendentes.',
    'NISAR es solo el comienzo. El mismo radar mide el movimiento del suelo en centímetros, el flujo de glaciares y hielo marino, humedales, cultivos, humedad del suelo y biomasa forestal. Luego queremos una capa de interferometría para terremotos y subsidencia, y pasadas ascendentes y descendentes.'),
  cover: T(
    'Forests, rivers and cities change faster than anyone can watch, and clouds hide the ground. When something goes wrong we learn too late. SARIS is our answer: radar that sees through clouds, a model that learns what is normal, and a map to act on it.',
    'Florestas, rios e cidades mudam mais rápido do que alguém consegue acompanhar, e as nuvens escondem o chão. Quando algo dá errado, ficamos sabendo tarde. O SARIS é a nossa resposta: um radar que enxerga através das nuvens, um modelo que aprende o que é normal e um mapa para agir.',
    'Bosques, ríos y ciudades cambian más rápido de lo que nadie puede vigilar, y las nubes esconden el suelo. Cuando algo sale mal, nos enteramos tarde. SARIS es nuestra respuesta: un radar que ve a través de las nubes, un modelo que aprende lo que es normal y un mapa para actuar.'),
  problem: T(
    'Did a patch of forest fall last week? An ordinary satellite takes a photo, but over the Amazon the clouds make it come back white. Radar sends its own pulse and listens to the echo, so clouds and night do not matter.',
    'Um pedaço de floresta caiu na semana passada? Um satélite comum tira uma foto, mas sobre a Amazônia as nuvens a deixam branca. O radar envia o próprio pulso e escuta o eco, então nuvens e noite não importam.',
    '¿Cayó un trozo de selva la semana pasada? Un satélite común toma una foto, pero sobre el Amazonas las nubes la dejan blanca. El radar envía su propio pulso y escucha el eco, así que nubes y noche no importan.'),
  meet: T(
    'This is NISAR, built by NASA and ISRO, with a 12-metre radar dish. Its long L-band wavelength feels trunks and branches, not only leaves. We pair it with C-band Sentinel-1 for the ten-year history, so we compare two frequencies.',
    'Este é o NISAR, feito pela NASA e pela ISRO, com uma antena de radar de 12 metros. Sua onda longa, a banda L, sente troncos e galhos, não só folhas. Juntamos o Sentinel-1, banda C, para o histórico de dez anos, e assim comparamos duas frequências.',
    'Este es NISAR, construido por la NASA y la ISRO, con una antena de radar de 12 metros. Su onda larga, la banda L, siente troncos y ramas, no solo hojas. Lo combinamos con Sentinel-1, banda C, para el historial de diez años, así que comparamos dos frecuencias.'),
  pixels: T(
    'A radar image is a grid of numbers: each pixel is how much of the pulse came back. We convert it to decibels, ten times the logarithm, so dark means a weak echo, like calm water, and bright means a strong one. Click a pixel to see both values.',
    'Uma imagem de radar é uma grade de números: cada pixel é quanto do pulso voltou. Convertemos em decibéis, dez vezes o logaritmo, então escuro é eco fraco, como água parada, e claro é eco forte. Clique em um pixel para ver os dois valores.',
    'Una imagen de radar es una cuadrícula de números: cada píxel es cuánto del pulso volvió. Lo convertimos en decibelios, diez veces el logaritmo, así que oscuro es eco débil, como agua quieta, y claro es eco fuerte. Haz clic en un píxel para ver los dos valores.'),
  dates: T(
    'Change is invisible in one image, so we compare two dates and set a threshold. Too low and noise lights up; too high and the real change disappears. Choosing it is a scientific decision.',
    'A mudança é invisível numa imagem só, então comparamos duas datas e definimos um limiar. Baixo demais, o ruído acende; alto demais, a mudança real some. Escolhê-lo é uma decisão científica.',
    'El cambio es invisible en una sola imagen, así que comparamos dos fechas y fijamos un umbral. Muy bajo, el ruido se enciende; muy alto, el cambio real desaparece. Elegirlo es una decisión científica.'),
  ml: T(
    'This is the core. For each place the model learns what is normal: the yearly rhythm of radar and rain over ten years. It expects the coming months, and flags months that stay outside the band when rain does not explain them.',
    'Este é o núcleo. Para cada lugar o modelo aprende o que é normal: o ritmo anual de radar e chuva ao longo de dez anos. Ele espera os próximos meses e sinaliza os meses que ficam fora da faixa quando a chuva não explica.',
    'Este es el núcleo. Para cada lugar el modelo aprende lo que es normal: el ritmo anual de radar y lluvia durante diez años. Espera los próximos meses y señala los meses que quedan fuera de la banda cuando la lluvia no lo explica.'),
  validate: T(
    'Before we trust a model, we test it. First it learns from places we already know. Then we ask it about places and years it has never seen, and we compare it with a simple guess. A simple guess is right about half the time. With radar alone the model is right about three times in four. With radar and the color of the ground, it is right about eighty-five times in a hundred. It reaches the map only if it beats the simple guess, and the scorecard always shows both side by side.',
    'Antes de confiar num modelo, a gente testa. Primeiro ele aprende com lugares que já conhecemos. Depois perguntamos sobre lugares e anos que ele nunca viu, e comparamos com um palpite simples. O palpite simples acerta mais ou menos metade das vezes. Só com o radar, o modelo acerta quase três em quatro. Com o radar e a cor do solo, acerta uns oitenta e cinco em cem. Ele só chega ao mapa se vencer o palpite simples, e o placar sempre mostra os dois lado a lado.',
    'Antes de confiar en un modelo, lo ponemos a prueba. Primero aprende de lugares que ya conocemos. Luego le preguntamos por lugares y años que nunca vio, y lo comparamos con una suposición simple. La suposición simple acierta más o menos la mitad de las veces. Solo con el radar, el modelo acierta casi tres de cada cuatro. Con el radar y el color del suelo, acierta unas ochenta y cinco de cada cien. Solo llega al mapa si supera la suposición simple, y el marcador siempre muestra ambos lado a lado.'),
  built: T(
    'Here is the observatory: a 3D map with NASA layers that each keep one color, live radar and rain, a timeline where real data and scenarios never mix, and an assistant you can simply talk to.',
    'Aqui está o observatório: um mapa 3D com camadas da NASA que mantêm uma cor cada, radar e chuva ao vivo, uma linha do tempo em que dado real e cenário nunca se misturam, e um assistente com quem você pode simplesmente conversar.',
    'Aquí está el observatorio: un mapa 3D con capas de la NASA que mantienen un color cada una, radar y lluvia en vivo, una línea de tiempo donde dato real y escenario nunca se mezclan, y un asistente con el que puedes simplemente hablar.'),
  layers: T(
    'Every NASA dataset is a layer, and each keeps one color at any zoom: violet is always rain. You never have to guess what you are looking at.',
    'Cada conjunto de dados da NASA é uma camada, e cada uma mantém uma só cor em qualquer zoom: violeta é sempre chuva. Você nunca precisa adivinhar o que está vendo.',
    'Cada conjunto de datos de la NASA es una capa, y cada una mantiene un solo color en cualquier zoom: violeta es siempre lluvia. Nunca tienes que adivinar lo que ves.'),
  time: T(
    'Until today you see real data; after it, everything is a scenario, drawn with stripes and never shown as a real image.',
    'Até hoje você vê dados reais; depois, tudo é cenário, desenhado com listras e nunca apresentado como imagem real.',
    'Hasta hoy ves datos reales; después, todo es escenario, dibujado con rayas y nunca mostrado como imagen real.'),
  risks: T(
    'From the same history the model reads four risks: vegetation loss, flood, drought and fire, and unusual change. They are screening signals: where to look first, not what will happen.',
    'Do mesmo histórico o modelo lê quatro riscos: perda de vegetação, enchente, seca e queimada, e mudança incomum. São sinais de triagem: onde olhar primeiro, não o que vai acontecer.',
    'Del mismo historial el modelo lee cuatro riesgos: pérdida de vegetación, inundación, sequía e incendio, y cambio inusual. Son señales de cribado: dónde mirar primero, no lo que va a pasar.'),
  regions: T(
    'To save the wait, three regions are prepared ahead: the Amazon, São Paulo and Rio Grande do Sul. The map shows the riskiest sample place, so a hot spot is never averaged away.',
    'Para poupar a espera, três regiões vêm preparadas: a Amazônia, São Paulo e o Rio Grande do Sul. O mapa mostra o lugar de amostra mais arriscado, então um ponto crítico nunca some na média.',
    'Para ahorrar la espera, tres regiones vienen preparadas: el Amazonas, São Paulo y Rio Grande do Sul. El mapa muestra el lugar de muestra más arriesgado, así que un punto crítico nunca se pierde en el promedio.'),
  impact: T(
    'The Amazon exhales moisture, and winds carry it south and west to the Andes, São Paulo, Rio Grande do Sul and the Plata basin. Studies link the forest to rain far downwind, so what changes in one place is read in the others.',
    'A Amazônia solta umidade, e os ventos a levam para o sul e o oeste, até os Andes, São Paulo, o Rio Grande do Sul e a bacia do Prata. Estudos ligam a floresta à chuva muito além, então o que muda em um lugar é lido nos outros.',
    'El Amazonas exhala humedad, y los vientos la llevan al sur y al oeste, hasta los Andes, São Paulo, Rio Grande do Sul y la cuenca del Plata. Los estudios vinculan el bosque con la lluvia muy a sotavento, así que lo que cambia en un lugar se lee en los otros.'),
  honest: T(
    'A promise about wording. We say the radar response changed, a forecast has a band, a scenario is uncertain. We never say a satellite detected deforestation, or a place will flood.',
    'Uma promessa sobre as palavras. Dizemos que a resposta do radar mudou, que a previsão tem faixa, que o cenário é incerto. Nunca dizemos que um satélite detectou desmatamento, nem que um lugar vai alagar.',
    'Una promesa sobre las palabras. Decimos que la respuesta del radar cambió, que el pronóstico tiene banda, que el escenario es incierto. Nunca decimos que un satélite detectó deforestación, ni que un lugar se va a inundar.'),
  next: T(
    'That is the problem and our answer. Now it is your turn: open the map, pick a place, and ask it what is changing.',
    'Esse é o problema e a nossa resposta. Agora é a sua vez: abra o mapa, escolha um lugar e pergunte o que está mudando.',
    'Ese es el problema y nuestra respuesta. Ahora es tu turno: abre el mapa, elige un lugar y pregunta qué está cambiando.'),
}

/** The new pages of the engine chapter and the closing impact page. */
export const ENGINE_STEPS: Record<string, Step> = {
  drivers: {
    id: 'drivers',
    kicker: T('What changes, and why', 'O que muda, e por quê', 'Qué cambia, y por qué'),
    title: T('Each driver leaves its own signature', 'Cada causa deixa a sua assinatura', 'Cada causa deja su firma'),
    narration: N.drivers,
    render: () => <DriversPicker />,
  },
  future: {
    id: 'future',
    kicker: T('What comes next', 'O que vem a seguir', 'Lo que viene'),
    title: T('NISAR can do much more', 'O NISAR pode muito mais', 'NISAR puede mucho más'),
    narration: N.future,
    render: () => <FutureList />,
  },
  pixels: {
    id: 'pixels',
    kicker: T('The echo, as numbers', 'O eco, em números', 'El eco, en números'),
    title: T('A radar image is a grid of numbers', 'Uma imagem de radar é uma grade de números', 'Una imagen de radar es una cuadrícula de números'),
    narration: N.pixels,
    render: () => <PixelMatrix />,
  },
  ml: {
    id: 'ml',
    kicker: T('The analysis · machine learning', 'A análise · aprendizado de máquina', 'El análisis · aprendizaje automático'),
    title: T('The model learns what is normal', 'O modelo aprende o que é normal', 'El modelo aprende lo que es normal'),
    narration: N.ml,
    render: () => <MlStory />,
  },
  validate: {
    id: 'validate',
    kicker: T('The proof', 'A prova', 'La prueba'),
    title: T('A model has to earn its place', 'Um modelo precisa merecer o seu lugar', 'Un modelo tiene que ganarse su lugar'),
    narration: N.validate,
    render: () => <Scorecard />,
  },
  impact: {
    id: 'impact',
    kicker: T('Beyond one forest', 'Além de uma floresta', 'Más allá de un bosque'),
    title: T('The Amazon reaches the rest of South America', 'A Amazônia alcança o resto da América do Sul', 'El Amazonas llega al resto de Sudamérica'),
    narration: N.impact,
    render: () => <ImpactList />,
  },
}

/** The problem each page answers, and how, in two short lines. Keyed by step id. */
export const PA: Record<string, { p: Step['problem']; a: Step['answer'] }> = {
  drivers: { p: T('Radar shows a change but not its cause', 'O radar mostra a mudança, não a causa', 'El radar muestra el cambio, no la causa'), a: T('Match each pattern and polarization to a physical driver', 'Casar cada padrão e polarização com uma causa física', 'Asociar cada patrón y polarización con una causa física') },
  future: { p: T('Surface change is more than forests and rain', 'A mudança da superfície é mais que floresta e chuva', 'El cambio de la superficie es más que bosque y lluvia'), a: T('The same instrument tracks ground, ice, water and crops', 'O mesmo instrumento acompanha solo, gelo, água e lavouras', 'El mismo instrumento sigue suelo, hielo, agua y cultivos') },
  problem: { p: T('Clouds hide the Amazon from ordinary satellites', 'As nuvens escondem a Amazônia dos satélites comuns', 'Las nubes esconden el Amazonas de los satélites comunes'), a: T('Radar sends its own pulse, so it sees through clouds and at night', 'O radar envia o próprio pulso: enxerga através das nuvens e de noite', 'El radar envía su propio pulso: ve a través de las nubes y de noche') },
  meet: { p: T('We need a sensor that works every day, in any weather', 'Precisamos de um sensor que funcione todo dia, com qualquer tempo', 'Necesitamos un sensor que funcione cada día, con cualquier clima'), a: T('NISAR: L-band radar that feels trunks and branches', 'NISAR: radar banda L que sente troncos e galhos', 'NISAR: radar banda L que siente troncos y ramas') },
  echo: { p: T('A bright or dark pixel means nothing by itself', 'Um pixel claro ou escuro não diz nada sozinho', 'Un píxel claro u oscuro no dice nada por sí solo'), a: T('Learn what each surface sends back', 'Aprender o que cada superfície devolve', 'Aprender lo que devuelve cada superficie') },
  pixels: { p: T('Raw radar values are hard to compare', 'Os valores brutos do radar são difíceis de comparar', 'Los valores brutos del radar son difíciles de comparar'), a: T('Convert to decibels: every pixel on one scale', 'Converter em decibéis: todo pixel na mesma escala', 'Convertir a decibelios: cada píxel en la misma escala') },
  dates: { p: T('Change is invisible in a single image', 'A mudança é invisível numa imagem só', 'El cambio es invisible en una sola imagen'), a: T('Compare two dates and set a threshold', 'Comparar duas datas e definir um limiar', 'Comparar dos fechas y fijar un umbral') },
  ml: { p: T('No one can read ten years of every pixel', 'Ninguém consegue ler dez anos de cada pixel', 'Nadie puede leer diez años de cada píxel'), a: T('The model learns normal and flags what leaves it', 'O modelo aprende o normal e sinaliza o que sai dele', 'El modelo aprende lo normal y señala lo que sale de él') },
  validate: { p: T('A model can look smart and still be wrong', 'Um modelo pode parecer esperto e mesmo assim errar', 'Un modelo puede parecer astuto y aun así equivocarse'), a: T('We trust it only if it beats a simple guess, on places it never saw', 'Só confiamos se ele vencer um palpite simples, em lugares que nunca viu', 'Solo confiamos si supera una suposición simple, en lugares que nunca vio') },
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

const SAT_PA: Record<string, { p: Step['problem']; a: Step['answer'] }> = {
  honest: { p: T('We find out about change only after the damage', 'Só sabemos da mudança depois do dano', 'Solo nos enteramos del cambio tras el daño'), a: T('See it early, through the clouds, with honest limits', 'Enxergar cedo, através das nuvens, com limites honestos', 'Verlo a tiempo, a través de las nubes, con límites honestos') },
  rain: { p: T('Rain alone can fake a change', 'A chuva sozinha pode fingir uma mudança', 'La lluvia sola puede fingir un cambio'), a: T('Compare the signal with the rain, and its lag', 'Comparar o sinal com a chuva e a sua defasagem', 'Comparar la señal con la lluvia y su desfase') },
  model: { p: T('A model nobody tested proves nothing', 'Um modelo que ninguém testou não prova nada', 'Un modelo que nadie probó no prueba nada'), a: T('It only counts if it beats the simple rule', 'Só vale se vencer a regra simples', 'Solo cuenta si supera la regla simple') },
}
export const SATELLITE_CHAPTERS: Chapter[] = [
  { label: T('Instrument', 'Instrumento', 'Instrumento'), ids: ['cover', 'meet', 'history', 'echo', 'drivers', 'numbers'] },
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
  return steps.map((s) => ({ ...s, narration: N[s.id] ?? s.narration, problem: PA[s.id]?.p, answer: PA[s.id]?.a }))
}

/** The satellite deck: its own pages, plus the drivers page after the echo (which polarization shows what). */
export function satelliteDeckSteps(): Step[] {
  const i = SATELLITE_STEPS.findIndex((x) => x.id === 'echo')
  return withProblems([...SATELLITE_STEPS.slice(0, i + 1), ENGINE_STEPS.drivers, ...SATELLITE_STEPS.slice(i + 1)])
}
