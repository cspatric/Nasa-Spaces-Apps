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
    'A radar can tell you that something changed, but not why. So we guess the cause and check the guess. When a forest is cut or burned, it loses its canopy and the cross-polarized signal drops. When water sits under the trees, the signal bounces twice and the co-polarized one gets brighter. Pick a cause and see which polarization shows it.',
    'O radar consegue dizer que algo mudou, mas não por quê. Então a gente levanta uma hipótese sobre a causa e depois confere. Quando uma floresta é cortada ou queimada, ela perde a copa e o sinal em polarização cruzada cai. Quando há água embaixo das árvores, o sinal rebate duas vezes e o co-polarizado fica mais forte. Escolha uma causa e veja qual polarização a mostra.',
    'El radar puede decirte que algo cambió, pero no por qué. Así que planteamos una hipótesis sobre la causa y después la comprobamos. Cuando un bosque se tala o se quema, pierde la copa y la señal en polarización cruzada baja. Cuando hay agua bajo los árboles, la señal rebota dos veces y la copolarizada se vuelve más fuerte. Elige una causa y mira qué polarización la muestra.'),
  future: T(
    'NISAR is only getting started. The same radar can follow the ground moving by a few centimetres, glaciers and sea ice, wetlands, crops, soil moisture and the carbon stored in forests. Next we would like to add a layer for ground motion, to cover earthquakes and sinking land, and to use passes from both directions.',
    'O NISAR está só começando. O mesmo radar consegue acompanhar o chão se movendo alguns centímetros, geleiras e gelo marinho, áreas alagadas, lavouras, a umidade do solo e o carbono guardado nas florestas. Em seguida queremos incluir uma camada de movimento do solo, para terremotos e terrenos que afundam, e usar passagens nos dois sentidos.',
    'NISAR apenas está empezando. El mismo radar puede seguir el suelo moviéndose unos centímetros, los glaciares y el hielo marino, los humedales, los cultivos, la humedad del suelo y el carbono guardado en los bosques. Luego queremos añadir una capa de movimiento del suelo, para terremotos y terrenos que se hunden, y usar pasadas en los dos sentidos.'),
  cover: T(
    'Forests, rivers and cities change faster than anyone can keep up with, and clouds keep the ground out of sight. So when something goes wrong, we usually find out late. SARIS is our try at fixing that. It starts from a radar that sees through clouds, adds a model that learns what normal looks like for each place, and puts the result on a map you can explore.',
    'Florestas, rios e cidades mudam mais rápido do que a gente consegue acompanhar, e as nuvens escondem o chão. Por isso, quando algo dá errado, quase sempre descobrimos tarde. O SARIS é a nossa tentativa de mudar isso. Ele parte de um radar que enxerga através das nuvens, junta um modelo que aprende como é o normal de cada lugar e coloca o resultado num mapa que você pode explorar.',
    'Los bosques, los ríos y las ciudades cambian más rápido de lo que podemos seguir, y las nubes tapan el suelo. Por eso, cuando algo sale mal, casi siempre nos enteramos tarde. SARIS es nuestro intento de cambiar eso. Parte de un radar que ve a través de las nubes, suma un modelo que aprende cómo es lo normal en cada lugar y pone el resultado en un mapa que puedes explorar.'),
  problem: T(
    'Say you want to know if a piece of forest was cut down last week. A normal satellite takes a photo, but over the Amazon the clouds are almost always there, so the picture comes back white. A radar sends out its own signal and listens to what bounces back, so clouds and night make no difference to it.',
    'Imagine que você quer saber se um pedaço de floresta foi derrubado na semana passada. Um satélite comum tira uma foto, mas sobre a Amazônia as nuvens quase nunca saem, e a imagem volta branca. O radar manda o próprio sinal e escuta o que volta, então nuvem e noite não fazem diferença para ele.',
    'Imagina que quieres saber si derribaron un pedazo de selva la semana pasada. Un satélite común saca una foto, pero sobre el Amazonas las nubes casi nunca se van, y la imagen vuelve blanca. El radar manda su propia señal y escucha lo que rebota, así que las nubes y la noche no le importan.'),
  meet: T(
    'This is NISAR, a satellite from NASA and the Indian space agency, with a radar dish twelve metres wide. Its long L-band waves go deep into a forest and feel the trunks and branches, not only the leaves. We also use Sentinel-1, which works with a shorter wavelength, to get ten years of history, so we can compare two kinds of radar.',
    'Este é o NISAR, um satélite da NASA e da agência espacial indiana, com uma antena de radar de doze metros. As ondas longas da banda L entram fundo na floresta e sentem os troncos e os galhos, não só as folhas. Também usamos o Sentinel-1, que trabalha com um comprimento de onda menor, para ter dez anos de histórico, e assim comparamos dois tipos de radar.',
    'Este es NISAR, un satélite de la NASA y de la agencia espacial india, con una antena de radar de doce metros. Sus ondas largas de banda L entran hondo en la selva y sienten los troncos y las ramas, no solo las hojas. También usamos Sentinel-1, que trabaja con una longitud de onda menor, para tener diez años de historia, y así comparamos dos tipos de radar.'),
  pixels: T(
    'A radar image is really a grid of numbers, and each number says how much of the signal came back. Those values are hard to compare, so we turn them into decibels. A dark pixel means very little returned, like calm water. A bright one means a lot returned, like a roof or a tree trunk. Click a pixel and you will see both values.',
    'Uma imagem de radar é, na verdade, uma grade de números, e cada número diz quanto do sinal voltou. Esses valores são difíceis de comparar, então a gente os converte em decibéis. Um pixel escuro quer dizer que voltou muito pouco, como em água parada. Um pixel claro quer dizer que voltou bastante, como num telhado ou num tronco. Clique em um pixel e veja os dois valores.',
    'Una imagen de radar es en realidad una cuadrícula de números, y cada número dice cuánto de la señal volvió. Esos valores son difíciles de comparar, así que los convertimos en decibelios. Un píxel oscuro significa que volvió muy poco, como en agua quieta. Uno claro significa que volvió mucho, como en un techo o en un tronco. Haz clic en un píxel y verás los dos valores.'),
  dates: T(
    'A single image hides change, so we put two dates side by side and decide how big a difference should count. Set the limit too low and noise lights up everywhere. Set it too high and the real change vanishes. That choice is part of the science, and we have to explain it.',
    'Uma imagem sozinha esconde a mudança, então colocamos duas datas lado a lado e decidimos qual tamanho de diferença conta. Se o limite for baixo demais, o ruído acende em toda parte. Se for alto demais, a mudança de verdade some. Essa escolha faz parte da ciência, e precisamos explicá-la.',
    'Una sola imagen esconde el cambio, así que ponemos dos fechas lado a lado y decidimos qué tamaño de diferencia cuenta. Si el límite es muy bajo, el ruido se enciende por todas partes. Si es muy alto, el cambio real desaparece. Esa elección es parte de la ciencia, y tenemos que explicarla.'),
  ml: T(
    'This is the part the project is built around. For each place, the model studies ten years of radar and rain and learns the yearly rhythm of that spot. Then it predicts the months ahead. If the radar stays outside the expected range for a long time and the rain does not explain it, the place gets flagged.',
    'Esta é a parte em volta da qual o projeto foi montado. Para cada lugar, o modelo estuda dez anos de radar e de chuva e aprende o ritmo anual daquele ponto. Depois ele prevê os meses seguintes. Se o radar fica fora da faixa esperada por muito tempo e a chuva não explica, o lugar é sinalizado.',
    'Esta es la parte alrededor de la cual se armó el proyecto. Para cada lugar, el modelo estudia diez años de radar y de lluvia y aprende el ritmo anual de ese punto. Luego predice los meses que vienen. Si el radar se queda fuera del rango esperado por mucho tiempo y la lluvia no lo explica, el lugar queda marcado.'),
  validate: T(
    'Before we trust a model, we test it. First it learns from places we already know. Then we ask it about places and years it has never seen, and we compare it with a simple guess. A simple guess is right about half the time. With radar alone the model is right about three times in four. With radar and the color of the ground, it is right about eighty-five times in a hundred. It reaches the map only if it beats the simple guess, and the scorecard always shows both side by side.',
    'Antes de confiar num modelo, a gente testa. Primeiro ele aprende com lugares que já conhecemos. Depois perguntamos sobre lugares e anos que ele nunca viu, e comparamos com um palpite simples. O palpite simples acerta mais ou menos metade das vezes. Só com o radar, o modelo acerta quase três em quatro. Com o radar e a cor do solo, acerta uns oitenta e cinco em cem. Ele só chega ao mapa se vencer o palpite simples, e o placar sempre mostra os dois lado a lado.',
    'Antes de confiar en un modelo, lo ponemos a prueba. Primero aprende de lugares que ya conocemos. Luego le preguntamos por lugares y años que nunca vio, y lo comparamos con una suposición simple. La suposición simple acierta más o menos la mitad de las veces. Solo con el radar, el modelo acierta casi tres de cada cuatro. Con el radar y el color del suelo, acierta unas ochenta y cinco de cada cien. Solo llega al mapa si supera la suposición simple, y el marcador siempre muestra ambos lado a lado.'),
  built: T(
    'Here is where it all comes together. You get a 3D map with the NASA layers, each one always in the same color. Radar and rain are read live. A timeline runs up to 2030, and real data and projections are never mixed on it. And if you would rather talk than click, there is an assistant for that.',
    'É aqui que tudo se junta. Você tem um mapa 3D com as camadas da NASA, cada uma sempre na mesma cor. Radar e chuva são lidos ao vivo. Uma linha do tempo vai até 2030, e dado real e projeção nunca se misturam nela. E se você preferir conversar a clicar, tem um assistente para isso.',
    'Aquí es donde todo se junta. Tienes un mapa 3D con las capas de la NASA, cada una siempre del mismo color. El radar y la lluvia se leen en vivo. Una línea de tiempo llega hasta 2030, y en ella nunca se mezclan los datos reales con las proyecciones. Y si prefieres hablar a hacer clic, hay un asistente para eso.'),
  layers: T(
    'Every NASA dataset is a layer, and each keeps one color at any zoom: violet is always rain. You never have to guess what you are looking at.',
    'Cada conjunto de dados da NASA é uma camada, e cada uma mantém uma só cor em qualquer zoom: violeta é sempre chuva. Você nunca precisa adivinhar o que está vendo.',
    'Cada conjunto de datos de la NASA es una capa, y cada una mantiene un solo color en cualquier zoom: violeta es siempre lluvia. Nunca tienes que adivinar lo que ves.'),
  time: T(
    'Until today you see real data; after it, everything is a scenario, drawn with stripes and never shown as a real image.',
    'Até hoje você vê dados reais; depois, tudo é cenário, desenhado com listras e nunca apresentado como imagem real.',
    'Hasta hoy ves datos reales; después, todo es escenario, dibujado con rayas y nunca mostrado como imagen real.'),
  risks: T(
    'From that same history the model reads four kinds of risk: loss of vegetation, flooding, drought and fire, and unusual change. These are hints about where to look first. They never say that something is going to happen.',
    'Desse mesmo histórico o modelo lê quatro tipos de risco: perda de vegetação, enchente, seca e queimada, e mudança incomum. São pistas sobre onde olhar primeiro. Elas nunca dizem que algo vai acontecer.',
    'De ese mismo historial el modelo lee cuatro tipos de riesgo: pérdida de vegetación, inundación, sequía e incendio, y cambio inusual. Son pistas sobre dónde mirar primero. Nunca dicen que algo va a pasar.'),
  regions: T(
    'Waiting for a forecast takes a few minutes, so we prepared three regions in advance: the Amazon, São Paulo and Rio Grande do Sul. For each risk the map shows the sample place in the worst shape, so a hot spot does not get lost in an average.',
    'Esperar uma previsão leva alguns minutos, então deixamos três regiões prontas: a Amazônia, São Paulo e o Rio Grande do Sul. Para cada risco, o mapa mostra o lugar de amostra em pior situação, assim um ponto crítico não se perde na média.',
    'Esperar un pronóstico toma unos minutos, así que dejamos tres regiones listas: el Amazonas, São Paulo y Rio Grande do Sul. Para cada riesgo, el mapa muestra el lugar de muestra en peor situación, así un punto crítico no se pierde en el promedio.'),
  impact: T(
    'The Amazon sends moisture into the air, and the winds carry it south and west, over the Andes, São Paulo, Rio Grande do Sul and the Plata basin. Studies tie the forest to rain far downwind, so a change in one place can be felt in another. That is why the map watches São Paulo and Rio Grande do Sul right next to the Amazon.',
    'A Amazônia manda umidade para o ar, e os ventos a levam para o sul e para o oeste, passando pelos Andes, por São Paulo, pelo Rio Grande do Sul e pela bacia do Prata. Estudos ligam a floresta à chuva muito longe dali, então uma mudança num lugar pode ser sentida em outro. Por isso o mapa acompanha São Paulo e o Rio Grande do Sul bem ao lado da Amazônia.',
    'El Amazonas manda humedad al aire, y los vientos la llevan al sur y al oeste, pasando por los Andes, São Paulo, Rio Grande do Sul y la cuenca del Plata. Los estudios relacionan el bosque con la lluvia muy lejos de allí, así que un cambio en un lugar puede sentirse en otro. Por eso el mapa sigue a São Paulo y a Rio Grande do Sul junto al Amazonas.'),
  honest: T(
    'One last thing about the words we use. We say that the radar response changed, that a forecast comes with a range, and that a scenario is a guess. We avoid saying that a satellite caught deforestation, or that some place will flood. We would rather say less and be right.',
    'Uma última coisa sobre as palavras que usamos. Dizemos que a resposta do radar mudou, que uma previsão vem com uma faixa e que um cenário é um palpite. Evitamos dizer que um satélite pegou desmatamento ou que certo lugar vai alagar. Preferimos dizer menos e acertar.',
    'Una última cosa sobre las palabras que usamos. Decimos que la respuesta del radar cambió, que un pronóstico viene con un rango y que un escenario es una suposición. Evitamos decir que un satélite detectó deforestación o que cierto lugar se va a inundar. Preferimos decir menos y acertar.'),
  next: T(
    'That was the problem and how we try to solve it. Now it is your turn. Open the map, pick a place and ask it what is changing.',
    'Esse foi o problema e o jeito como tentamos resolvê-lo. Agora é a sua vez. Abra o mapa, escolha um lugar e pergunte o que está mudando.',
    'Ese fue el problema y la forma en que intentamos resolverlo. Ahora te toca a ti. Abre el mapa, elige un lugar y pregunta qué está cambiando.'),
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
  problem: { p: T('Clouds hide the Amazon from ordinary satellites.', 'As nuvens escondem a Amazônia dos satélites comuns.', 'Las nubes esconden el Amazonas de los satélites comunes.'), a: T('Radar sends its own signal and sees through them.', 'O radar manda o próprio sinal e enxerga através delas.', 'El radar manda su propia señal y ve a través de ellas.') },
  meet: { p: T('We need a sensor that works every day, rain or shine.', 'Precisamos de um sensor que funcione todo dia, faça chuva ou faça sol.', 'Necesitamos un sensor que funcione todos los días, llueva o truene.'), a: T('NISAR does that, and its long waves reach trunks and branches.', 'O NISAR faz isso, e suas ondas longas chegam aos troncos e galhos.', 'NISAR lo hace, y sus ondas largas llegan a troncos y ramas.') },
  echo: { p: T('A bright or dark pixel means nothing on its own.', 'Um pixel claro ou escuro não diz nada sozinho.', 'Un píxel claro u oscuro no dice nada por sí solo.'), a: T('We learn what each surface sends back.', 'Aprendemos o que cada superfície devolve.', 'Aprendemos lo que devuelve cada superficie.') },
  pixels: { p: T('Raw radar values are hard to compare.', 'Os valores brutos do radar são difíceis de comparar.', 'Los valores brutos del radar son difíciles de comparar.'), a: T('In decibels, every pixel sits on the same scale.', 'Em decibéis, todo pixel fica na mesma escala.', 'En decibelios, cada píxel queda en la misma escala.') },
  drivers: { p: T('Radar shows that something changed, but not why.', 'O radar mostra que algo mudou, mas não por quê.', 'El radar muestra que algo cambió, pero no por qué.'), a: T('We match each pattern to a physical cause and then check it.', 'Ligamos cada padrão a uma causa física e depois conferimos.', 'Relacionamos cada patrón con una causa física y luego lo comprobamos.') },
  dates: { p: T('One image hides change.', 'Uma imagem sozinha esconde a mudança.', 'Una imagen sola esconde el cambio.'), a: T('Two dates and a threshold make it show.', 'Duas datas e um limiar fazem ela aparecer.', 'Dos fechas y un umbral hacen que aparezca.') },
  ml: { p: T('Nobody can read ten years of every pixel.', 'Ninguém consegue ler dez anos de cada pixel.', 'Nadie puede leer diez años de cada píxel.'), a: T('The model learns what is normal and flags what is not.', 'O modelo aprende o que é normal e sinaliza o que foge disso.', 'El modelo aprende lo que es normal y señala lo que se sale.') },
  validate: { p: T('A model can look smart and still be wrong.', 'Um modelo pode parecer esperto e mesmo assim errar.', 'Un modelo puede parecer astuto y aun así equivocarse.'), a: T('We only trust it if it beats a simple guess on places it has never seen.', 'Só confiamos nele se vencer um palpite simples em lugares que nunca viu.', 'Solo confiamos en él si supera una suposición simple en lugares que nunca vio.') },
  built: { p: T('The data lives in many different archives.', 'Os dados vivem em vários arquivos diferentes.', 'Los datos viven en varios archivos distintos.'), a: T('One 3D map reads it live.', 'Um mapa 3D lê tudo ao vivo.', 'Un mapa 3D lo lee todo en vivo.') },
  risks: { p: T('Where should we look first?', 'Para onde devemos olhar primeiro?', '¿Dónde debemos mirar primero?'), a: T('Four risk hints for each place.', 'Quatro pistas de risco para cada lugar.', 'Cuatro pistas de riesgo para cada lugar.') },
  regions: { p: T('An analysis takes minutes, and a decision cannot wait that long.', 'Uma análise leva minutos, e uma decisão não espera tanto.', 'Un análisis toma minutos, y una decisión no puede esperar tanto.'), a: T('Regional forecasts are ready before you ask.', 'As previsões regionais já estão prontas antes de você pedir.', 'Los pronósticos regionales ya están listos antes de que preguntes.') },
  impact: { p: T('A change in one forest is felt far away.', 'A mudança numa floresta é sentida longe.', 'El cambio en un bosque se siente lejos.'), a: T('So we read the Amazon together with the regions it feeds.', 'Por isso lemos a Amazônia junto com as regiões que ela alimenta.', 'Por eso leemos el Amazonas junto con las regiones que alimenta.') },
  future: { p: T('Surface change is more than forests and rain.', 'A mudança da superfície vai além de floresta e chuva.', 'El cambio de la superficie va más allá del bosque y la lluvia.'), a: T('The same instrument follows ground, ice, water and crops.', 'O mesmo instrumento acompanha solo, gelo, água e lavouras.', 'El mismo instrumento sigue el suelo, el hielo, el agua y los cultivos.') },
  claims: { p: T('Saying too much destroys trust.', 'Dizer mais do que se sabe destrói a confiança.', 'Decir más de lo que se sabe destruye la confianza.'), a: T('We say only what the data supports.', 'Dizemos só o que os dados sustentam.', 'Decimos solo lo que respaldan los datos.') },
  honest: { p: T('A model that is sure of everything is lying.', 'Um modelo seguro de tudo está mentindo.', 'Un modelo seguro de todo está mintiendo.'), a: T('We say what we know, what we guess and what we don\'t.', 'Dizemos o que sabemos, o que supomos e o que não sabemos.', 'Decimos lo que sabemos, lo que suponemos y lo que no sabemos.') },
}

const SAT_PA: Record<string, { p: Step['problem']; a: Step['answer'] }> = {
  rain: { p: T('Rain alone can fake a change.', 'A chuva sozinha pode fingir uma mudança.', 'La lluvia sola puede fingir un cambio.'), a: T('So we compare the signal with the rain, and its delay.', 'Por isso comparamos o sinal com a chuva e com o atraso dela.', 'Por eso comparamos la señal con la lluvia y su retraso.') },
  model: { p: T('A model nobody tested proves nothing.', 'Um modelo que ninguém testou não prova nada.', 'Un modelo que nadie probó no prueba nada.'), a: T('It only counts if it beats a simple rule.', 'Só vale se vencer uma regra simples.', 'Solo cuenta si supera una regla simple.') },
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
