import type { Step } from '../components/Deck'
import { T } from './helpers'
import Logo from '../components/Logo'
import { OVERLAYS } from '../lib/catalog'
import { translate } from '../lib/i18n'
import { CloudRadar, Metrics, Picker, ScoreBars, SegmentBar, Tiles } from './visuals'
import { Prose } from './visuals2'

const tri = (key: string) => T(translate('en', key), translate('pt', key), translate('es', key))

const LAYER_OPTIONS = OVERLAYS.map((o) => ({ id: o.id, color: o.color, label: tri(o.label), text: T(`${translate('en', o.label)} · ${translate('en', o.hint)}`, `${translate('pt', o.label)} · ${translate('pt', o.hint)}`, `${translate('es', o.label)} · ${translate('es', o.hint)}`) }))

export const OWN: Step[] = [
  {
    id: 'cover', solo: true,
    kicker: T('NASA Space Apps 2026 · Dancing with the SARs', 'NASA Space Apps 2026 · Dancing with the SARs', 'NASA Space Apps 2026 · Dancing with the SARs'),
    title: T('SARIS', 'SARIS', 'SARIS'),
    heading: <h1><Logo size={96} /><span className="w">Surface change observatory</span>SAR<em>IS</em></h1>,
    narration: T(
      'Hello. This is SARIS, an observatory that watches how the land changes. I will walk you through it one step at a time: the problem we are solving, the data we use, and how honest we are about what we know. Press Continue whenever you are ready.',
      'Olá. Este é o SARIS, um observatório que acompanha como a terra muda. Vou levar você por ele um passo de cada vez: o problema que resolvemos, os dados que usamos e o quanto somos honestos sobre o que sabemos. Aperte Continuar quando estiver pronto.',
      'Hola. Este es SARIS, un observatorio que sigue cómo cambia la tierra. Te llevaré paso a paso: el problema que resolvemos, los datos que usamos y cuán honestos somos sobre lo que sabemos. Pulsa Continuar cuando estés listo.'),
  },
  {
    id: 'problem',
    kicker: T('01 · The problem', '01 · O problema', '01 · El problema'),
    title: T('The Amazon hides under clouds', 'A Amazônia se esconde sob as nuvens', 'El Amazonas se esconde bajo las nubes'),
    fig: T('Optical light against a radar pulse', 'Luz óptica contra um pulso de radar', 'Luz óptica contra un pulso de radar'),
    narration: T(
      'Imagine you want to know whether a patch of forest was cleared last week. A normal satellite takes a photo, but over the Amazon the clouds are there most of the year, so the photo comes back white. Radar is different. It sends its own pulse and listens to the echo, so clouds do not matter, and it works at night too.',
      'Imagine que você quer saber se um pedaço de floresta foi derrubado na semana passada. Um satélite comum tira uma foto, mas sobre a Amazônia as nuvens estão lá quase o ano todo, e a foto volta branca. O radar é diferente. Ele envia o próprio pulso e escuta o eco, então as nuvens não importam, e ele funciona de noite também.',
      'Imagina que quieres saber si un trozo de selva fue talado la semana pasada. Un satélite normal toma una foto, pero sobre el Amazonas las nubes están casi todo el año, y la foto vuelve blanca. El radar es distinto. Envía su propio pulso y escucha el eco, así que las nubes no importan, y funciona también de noche.'),
    render: () => <CloudRadar />,
  },
  {
    id: 'built',
    kicker: T('02 · What we built', '02 · O que construímos', '02 · Lo que construimos'),
    title: T('One observatory, three parts', 'Um observatório, três partes', 'Un observatorio, tres partes'),
    fig: T('Parts of SARIS', 'Partes do SARIS', 'Partes de SARIS'),
    narration: T(
      'So we built an observatory in three parts. First, a 3D map of South and Central America, with real relief, buildings and streets. Second, live data: the radar and the rain are read at the moment you ask, around the date you choose. And third, a timeline that goes to 2030, where what was observed and what is only a scenario never get mixed.',
      'Então construímos um observatório em três partes. Primeiro, um mapa 3D da América do Sul e Central, com relevo, prédios e ruas reais. Segundo, dados ao vivo: o radar e a chuva são lidos na hora em que você pede, em torno da data que escolher. E terceiro, uma linha do tempo que vai até 2030, onde o que foi observado e o que é só cenário nunca se misturam.',
      'Así que construimos un observatorio en tres partes. Primero, un mapa 3D de Sudamérica y Centroamérica, con relieve, edificios y calles reales. Segundo, datos en vivo: el radar y la lluvia se leen en el momento en que los pides, alrededor de la fecha que elijas. Y tercero, una línea de tiempo que llega a 2030, donde lo observado y lo que es solo escenario nunca se mezclan.'),
    render: () => (
      <Tiles items={[
        { title: T('A 3D observatory', 'Um observatório 3D', 'Un observatorio 3D'), text: T('Real relief, buildings and streets, only over the region of the study.', 'Relevo, prédios e ruas reais, só sobre a região do estudo.', 'Relieve, edificios y calles reales, solo sobre la región del estudio.') },
        { title: T('Live data', 'Dados ao vivo', 'Datos en vivo'), text: T('NISAR and OPERA radar and IMERG rain, read around the date you choose.', 'Radar NISAR e OPERA e chuva IMERG, lidos em torno da data que você escolhe.', 'Radar NISAR y OPERA y lluvia IMERG, leídos alrededor de la fecha que eliges.') },
        { title: T('A timeline to 2030', 'Uma linha do tempo até 2030', 'Una línea de tiempo hasta 2030'), text: T('Observed until today, scenarios after it, never mixed.', 'Observado até hoje, cenários depois, nunca misturados.', 'Observado hasta hoy, escenarios después, nunca mezclados.') },
      ]} />
    ),
  },
  {
    id: 'numbers',
    kicker: T('03 · The data', '03 · Os dados', '03 · Los datos'),
    title: T('What is behind the map', 'O que está por trás do mapa', 'Lo que hay detrás del mapa'),
    fig: T('SARIS in numbers', 'SARIS em números', 'SARIS en números'),
    narration: T(
      'Here is what sits behind the map. Six NASA layers. Ten years of radar history, since 2016. Fifty-one places whose land cover we know, used to teach the model. And three regions whose forecasts are already prepared, so nothing has to load when you open them.',
      'Isto é o que está por trás do mapa. Seis camadas da NASA. Dez anos de histórico de radar, desde 2016. Cinquenta e um lugares cuja cobertura do solo conhecemos, usados para ensinar o modelo. E três regiões com previsão já preparada, então nada precisa carregar quando você abre.',
      'Esto es lo que hay detrás del mapa. Seis capas de la NASA. Diez años de historial de radar, desde 2016. Cincuenta y un lugares cuya cobertura del suelo conocemos, usados para enseñar al modelo. Y tres regiones con el pronóstico ya preparado, así que nada tiene que cargar cuando las abres.'),
    render: () => (
      <Metrics items={[
        { n: OVERLAYS.length, label: T('NASA layers on the map', 'camadas NASA no mapa', 'capas NASA en el mapa') },
        { n: 10, label: T('years of radar history', 'anos de histórico de radar', 'años de historial de radar') },
        { n: 51, label: T('places the model learned from', 'lugares que o modelo usou para aprender', 'lugares con los que aprendió el modelo') },
        { n: 3, label: T('regions forecast ahead of time', 'regiões com previsão pronta', 'regiones con pronóstico listo') },
      ]} />
    ),
  },
  {
    id: 'layers',
    kicker: T('04 · NASA layers', '04 · Camadas NASA', '04 · Capas NASA'),
    title: T('One color for each layer', 'Uma cor para cada camada', 'Un color para cada capa'),
    fig: T('Pick a layer', 'Escolha uma camada', 'Elige una capa'),
    narration: T(
      'On the map, every NASA dataset is a layer. Pick one here to see what it shows. There is one rule I care about: each layer keeps a single color at any zoom. So when you see violet, it is rain, always. You never have to guess what you are looking at.',
      'No mapa, cada conjunto de dados da NASA é uma camada. Escolha uma aqui para ver o que ela mostra. Há uma regra que me importa: cada camada mantém uma única cor em qualquer zoom. Então quando você vê violeta, é chuva, sempre. Você nunca precisa adivinhar o que está olhando.',
      'En el mapa, cada conjunto de datos de la NASA es una capa. Elige una aquí para ver qué muestra. Hay una regla que me importa: cada capa mantiene un solo color en cualquier zoom. Así, cuando ves violeta, es lluvia, siempre. Nunca tienes que adivinar qué estás mirando.'),
    render: () => <Picker options={LAYER_OPTIONS} hint={T('Pick a layer to learn what it shows.', 'Escolha uma camada para saber o que ela mostra.', 'Elige una capa para saber qué muestra.')} />,
  },
  {
    id: 'time',
    kicker: T('05 · Time', '05 · O tempo', '05 · El tiempo'),
    title: T('Observed, then scenario', 'Observado, depois cenário', 'Observado, luego escenario'),
    fig: T('The timeline, 2016 to 2030', 'A linha do tempo, 2016 a 2030', 'La línea de tiempo, 2016 a 2030'),
    narration: T(
      'Time runs along the bottom of the map. Until today, you see real data: first the older C-band radar, then NISAR, the new L-band one, since this year. After that, everything is a scenario. It is drawn differently, with stripes, and it is never presented as a real image.',
      'O tempo corre na parte de baixo do mapa. Até hoje, você vê dados reais: primeiro o radar de banda C, mais antigo, e depois o NISAR, o novo de banda L, deste ano em diante. Depois disso, tudo é cenário. É desenhado de outro jeito, com listras, e nunca é apresentado como imagem real.',
      'El tiempo corre en la parte inferior del mapa. Hasta hoy ves datos reales: primero el radar de banda C, más antiguo, y luego NISAR, el nuevo de banda L, desde este año. Después, todo es escenario. Se dibuja distinto, con rayas, y nunca se presenta como una imagen real.'),
    render: () => (
      <SegmentBar parts={[
        { w: 10, label: T('C-band · OPERA', 'Banda C · OPERA', 'Banda C · OPERA'), color: '#6f9bff' },
        { w: 1.4, label: T('L', 'L', 'L'), color: '#3be0c5' },
        { w: 4, label: T('Scenarios', 'Cenários', 'Escenarios'), color: '#e7b04a', hatch: true },
      ]} />
    ),
  },
  {
    id: 'forecast',
    kicker: T('06 · Forecast', '06 · Previsão', '06 · Pronóstico'),
    title: T('A model has to earn its place', 'Um modelo precisa merecer o seu lugar', 'Un modelo tiene que ganarse su lugar'),
    fig: T('Recognising a place, on places never seen', 'Reconhecer um lugar, em lugares nunca vistos', 'Reconocer un lugar, en lugares nunca vistos'),
    narration: T(
      'From the history of one place, a model forecasts radar and rain up to 2030, with a band that says how unsure it is. But a model has to earn its place. We always compare it with a simple rule, and we test on places and dates it has never seen. Here is how well it recognises what a place is: the simple rule gets 54 percent, radar alone gets 73, and radar plus the color of the ground gets 85. It does not reach 90, and we say so.',
      'Com o histórico de um lugar, um modelo prevê radar e chuva até 2030, com uma faixa que diz o quanto ele está incerto. Mas um modelo precisa merecer o seu lugar. Nós sempre o comparamos com uma regra simples, e testamos em lugares e datas que ele nunca viu. Veja o quanto ele acerta ao reconhecer o que um lugar é: a regra simples acerta 54 por cento, só o radar acerta 73, e o radar com a cor do solo acerta 85. Não chega a 90, e dizemos isso.',
      'Con el historial de un lugar, un modelo pronostica radar y lluvia hasta 2030, con una banda que dice cuán inseguro está. Pero un modelo tiene que ganarse su lugar. Siempre lo comparamos con una regla simple, y probamos en lugares y fechas que nunca vio. Así reconoce qué es un lugar: la regla simple acierta el 54 por ciento, solo el radar el 73, y el radar con el color del suelo el 85. No llega a 90, y lo decimos.'),
    render: () => (
      <ScoreBars items={[
        { label: T('Simple rule', 'Regra simples', 'Regla simple'), v: 54, c: '#6f9bff' },
        { label: T('Radar only', 'Só radar', 'Solo radar'), v: 73, c: '#e7b04a' },
        { label: T('Radar + ground color', 'Radar + cor do solo', 'Radar + color del suelo'), v: 85, c: '#3be0c5' },
      ]} />
    ),
  },
  {
    id: 'risks',
    kicker: T('07 · Risks', '07 · Riscos', '07 · Riesgos'),
    title: T('Where to look first', 'Onde olhar primeiro', 'Dónde mirar primero'),
    fig: T('Four screening signals', 'Quatro sinais de triagem', 'Cuatro señales de cribado'),
    narration: T(
      'The model also reads four risks. Pick one to see which signal it uses. Remember: these are screening signals. They tell you where to look first. They do not say that something will happen.',
      'O modelo também lê quatro riscos. Escolha um para ver qual sinal ele usa. Lembre: são sinais de triagem. Eles dizem onde olhar primeiro. Não dizem que algo vai acontecer.',
      'El modelo también lee cuatro riesgos. Elige uno para ver qué señal usa. Recuerda: son señales de cribado. Dicen dónde mirar primero. No dicen que algo va a ocurrir.'),
    render: () => (
      <Picker
        hint={T('Pick a risk to see which signal it reads.', 'Escolha um risco para ver qual sinal ele lê.', 'Elige un riesgo para ver qué señal lee.')}
        options={[
          { id: 'veg', label: tri('Vegetation loss'), text: T('When the cross-polarized radar drops and stays down after the yearly cycle is removed, that looks like cleared or damaged vegetation.', 'Quando o radar em polarização cruzada cai e continua baixo depois de tirar o ciclo anual, isso parece vegetação derrubada ou danificada.', 'Cuando el radar en polarización cruzada baja y se mantiene bajo después de quitar el ciclo anual, eso parece vegetación talada o dañada.') },
          { id: 'flood', label: tri('Flood'), text: T('The model looks for radar that once looked flooded, compares the rain of the last months with what is usual for that place, and checks the wet season it forecasts.', 'O modelo procura radar que já pareceu alagado, compara a chuva dos últimos meses com o que é normal para aquele lugar e confere a estação chuvosa que ele prevê.', 'El modelo busca radar que alguna vez pareció inundado, compara la lluvia de los últimos meses con lo habitual en ese lugar y revisa la estación lluviosa que pronostica.') },
          { id: 'fire', label: tri('Drought and fire'), text: T('It tracks how dry the last three months were compared with normal, and what the rain forecast says about the next six.', 'Ele acompanha o quanto os últimos três meses foram secos em relação ao normal e o que a previsão de chuva diz sobre os próximos seis.', 'Sigue cuán secos fueron los últimos tres meses respecto a lo normal y lo que dice el pronóstico de lluvia sobre los próximos seis.') },
          { id: 'odd', label: tri('Unusual change'), text: T('An algorithm called Isolation Forest picks out months that do not look like the rest of the place\'s history.', 'Um algoritmo chamado Isolation Forest separa os meses que não se parecem com o resto do histórico do lugar.', 'Un algoritmo llamado Isolation Forest separa los meses que no se parecen al resto del historial del lugar.') },
        ]} />
    ),
  },
  {
    id: 'regions',
    kicker: T('08 · Ready-made regions', '08 · Regiões prontas', '08 · Regiones listas'),
    title: T('Forecasts already waiting', 'Previsões já esperando', 'Pronósticos ya esperando'),
    fig: T('Prepared ahead of time', 'Preparadas com antecedência', 'Preparados con antelación'),
    narration: T(
      'To save you the wait, three regions are prepared ahead of time: the Amazon, São Paulo and Rio Grande do Sul. Each one is made from a handful of sample places. All three came out at a moderate level today, and for each risk the map shows the riskiest sample, so a hot spot is never averaged away.',
      'Para poupar a sua espera, três regiões já vêm preparadas: a Amazônia, São Paulo e o Rio Grande do Sul. Cada uma é feita de alguns lugares amostrados. As três saíram em nível moderado hoje, e para cada risco o mapa mostra a amostra mais arriscada, então um ponto crítico nunca se perde na média.',
      'Para ahorrarte la espera, tres regiones vienen preparadas: el Amazonas, São Paulo y Rio Grande do Sul. Cada una se hace con unos pocos lugares muestreados. Las tres salieron en nivel moderado hoy, y para cada riesgo el mapa muestra la muestra más riesgosa, así que un punto crítico nunca se pierde en el promedio.'),
    render: () => (
      <Prose paras={[
        T('All three came out at a moderate level on the last run. In the Amazon the main concern is drought and fire around Tapajós. In São Paulo and in Rio Grande do Sul it is unusual change, in the city of São Paulo and around Caxias do Sul.', 'As três saíram em nível moderado na última rodada. Na Amazônia a maior preocupação é seca e queimada na região do Tapajós. Em São Paulo e no Rio Grande do Sul é mudança incomum, na cidade de São Paulo e em torno de Caxias do Sul.', 'Las tres salieron en nivel moderado en la última corrida. En el Amazonas la mayor preocupación es sequía e incendio en la zona del Tapajós. En São Paulo y en Rio Grande do Sul es cambio inusual, en la ciudad de São Paulo y alrededor de Caxias do Sul.'),
      ]} />
    ),
  },
  {
    id: 'whatif',
    kicker: T('09 · What if?', '09 · E se?', '09 · ¿Y si…?'),
    title: T('See the size of a disaster', 'Veja o tamanho de um desastre', 'Mira el tamaño de un desastre'),
    fig: T('Four simulations', 'Quatro simulações', 'Cuatro simulaciones'),
    narration: T(
      'You can also ask what if. Place an event on the map and watch its damage zones grow, with the area and the buildings inside each zone. Pick one to see how it is modelled. Keep in mind that these are simulations, never forecasts.',
      'Você também pode perguntar e se. Coloque um evento no mapa e veja as zonas de dano crescerem, com a área e os prédios dentro de cada zona. Escolha um para ver como é modelado. Lembre que são simulações, nunca previsões.',
      'También puedes preguntar y si. Coloca un evento en el mapa y mira crecer sus zonas de daño, con el área y los edificios dentro de cada zona. Elige uno para ver cómo se modela. Recuerda que son simulaciones, nunca pronósticos.'),
    render: () => (
      <Picker
        hint={T('Pick a simulation.', 'Escolha uma simulação.', 'Elige una simulación.')}
        options={[
          { id: 'q', label: tri('Earthquake'), text: T('Shaking falls with distance from the focus; zones from intensity IX down to V.', 'O tremor cai com a distância do foco; zonas da intensidade IX até V.', 'El temblor cae con la distancia al foco; zonas de la intensidad IX a la V.') },
          { id: 'f', label: tri('Flood'), text: T('Water rises above the ground; everything lower than that level within 20 km floods.', 'A água sobe acima do chão; tudo mais baixo que esse nível em 20 km alaga.', 'El agua sube sobre el suelo; todo lo más bajo que ese nivel en 20 km se inunda.') },
          { id: 'w', label: tri('Wildfire'), text: T('A wind-driven ellipse that grows with the hours and the dryness of the fuel.', 'Uma elipse levada pelo vento que cresce com as horas e a secura do combustível.', 'Una elipse llevada por el viento que crece con las horas y la sequedad del combustible.') },
          { id: 's', label: tri('Storm'), text: T('A swath of damaging wind along a track, sized by the peak gust.', 'Uma faixa de vento destrutivo ao longo de uma trajetória, do tamanho da rajada máxima.', 'Una franja de viento destructivo a lo largo de una trayectoria, del tamaño de la ráfaga máxima.') },
        ]} />
    ),
  },
  {
    id: 'honest',
    kicker: T('10 · The honest ending', '10 · O fim honesto', '10 · El final honesto'),
    title: T('What we say, and what we don’t', 'O que dizemos e o que não dizemos', 'Lo que decimos y lo que no'),
    fig: T('Wording on the map', 'Texto no mapa', 'Texto en el mapa'),
    narration: T(
      'Before the end, a promise about wording. We say that the radar response changed, that a forecast has a band, and that a scenario is simulated and uncertain. We avoid saying that a satellite detected deforestation, that a place will flood in a given year, or that the model is always right.',
      'Antes do fim, uma promessa sobre as palavras. Dizemos que a resposta do radar mudou, que uma previsão tem uma faixa e que um cenário é simulado e incerto. Evitamos dizer que um satélite detectou desmatamento, que um lugar vai alagar em certo ano, ou que o modelo sempre acerta.',
      'Antes del final, una promesa sobre las palabras. Decimos que la respuesta del radar cambió, que un pronóstico tiene una banda y que un escenario es simulado e incierto. Evitamos decir que un satélite detectó deforestación, que un lugar se inundará en cierto año, o que el modelo siempre acierta.'),
    render: () => (
      <Prose paras={[
        T('We say things like: the radar response changed here, this forecast has an 80 % band, this is a simulated scenario and it is uncertain.', 'Dizemos coisas como: a resposta do radar mudou aqui, esta previsão tem uma faixa de 80 %, este é um cenário simulado e incerto.', 'Decimos cosas como: la respuesta del radar cambió aquí, este pronóstico tiene una banda del 80 %, este es un escenario simulado e incierto.'),
        T('We don\'t say that NISAR detected deforestation, that this place will flood in 2028, or that the model is always right.', 'Não dizemos que o NISAR detectou desmatamento, que este lugar vai alagar em 2028 ou que o modelo sempre acerta.', 'No decimos que NISAR detectó deforestación, que este lugar se inundará en 2028 ni que el modelo siempre acierta.'),
      ]} />
    ),
  },
  {
    id: 'next', solo: true,
    kicker: T('Next', 'Agora', 'Ahora'),
    title: T('Meet the satellite', 'Conheça o satélite', 'Conoce el satélite'),
    narration: T(
      'Before you open the map, one minute about the instrument that makes all of this possible: the radar satellite NISAR. Let us meet it.',
      'Antes de abrir o mapa, um minuto sobre o instrumento que torna tudo isso possível: o satélite de radar NISAR. Vamos conhecê-lo.',
      'Antes de abrir el mapa, un minuto sobre el instrumento que hace todo esto posible: el satélite de radar NISAR. Vamos a conocerlo.'),
  },
]
