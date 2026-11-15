import type { Step } from '../components/Deck'
import { T } from './helpers'
import { Claims, Echo, Metrics, ModelChoice, PixelGrid, ProblemSolution, RainLag, TimelineList, TwoDates } from './visuals'

export const SATELLITE_STEPS: Step[] = [
  {
    id: 'cover', solo: true,
    kicker: T('NASA Space Apps 2026 · NISAR radar story', 'NASA Space Apps 2026 · A história do radar NISAR', 'NASA Space Apps 2026 · La historia del radar NISAR'),
    title: T('Dancing with the SARs', 'Dancing with the SARs', 'Dancing with the SARs'),
    heading: <h1><span className="w">NISAR</span>Dancing with the <em>SARs</em></h1>,
    narration: T(
      'Welcome. In a few steps I will show you how a radar satellite listens to a forest near Manaus, and how to read what it hears without fooling ourselves. No maths needed, only curiosity. Press Continue to begin.',
      'Bem-vindo. Em poucos passos vou mostrar como um satélite de radar escuta uma floresta perto de Manaus, e como ler o que ele ouve sem nos enganarmos. Não precisa de matemática, só de curiosidade. Aperte Continuar para começar.',
      'Bienvenido. En pocos pasos te mostraré cómo un satélite de radar escucha una selva cerca de Manaos, y cómo leer lo que oye sin engañarnos. No hace falta matemática, solo curiosidad. Pulsa Continuar para empezar.'),
  },
  {
    id: 'meet',
    kicker: T('01 · Meet the satellite', '01 · Conheça o satélite', '01 · Conoce el satélite'),
    title: T('NISAR: a radar that works through clouds', 'NISAR: um radar que funciona através das nuvens', 'NISAR: un radar que funciona a través de las nubes'),
    fig: T('NISAR, sending pulses to the ground', 'NISAR, enviando pulsos ao solo', 'NISAR, enviando pulsos al suelo'),
    narration: T(
      'This is NISAR, a satellite built by NASA and the Indian space agency. It carries a radar with a dish twelve metres wide. The idea is simple: it sends a pulse down, and listens to the echo. Its long L-band wavelength goes deeper into a forest than other radars, so it feels trunks and branches, not only leaves. And because the radar makes its own light, clouds and night do not matter.',
      'Este é o NISAR, um satélite construído pela NASA e pela agência espacial indiana. Ele leva um radar com uma antena de doze metros. A ideia é simples: ele envia um pulso para baixo e escuta o eco. O comprimento de onda longo da banda L entra mais fundo na floresta do que outros radares, então ele sente troncos e galhos, não só folhas. E como o radar faz a própria luz, nuvens e noite não importam.',
      'Este es NISAR, un satélite construido por la NASA y la agencia espacial india. Lleva un radar con una antena de doce metros. La idea es simple: envía un pulso hacia abajo y escucha el eco. Su longitud de onda larga, la banda L, entra más hondo en la selva que otros radares, así que siente troncos y ramas, no solo hojas. Y como el radar hace su propia luz, las nubes y la noche no importan.'),
    render: () => (
      <>
        <Metrics items={[
          { n: 12, label: T('metre dish antenna', 'metros de antena', 'metros de antena') },
          { n: 12, label: T('days to revisit a spot', 'dias para revisitar um local', 'días para revisitar un lugar') },
          { n: 'L + S', label: T('radar bands (L is used here)', 'bandas de radar (aqui usamos a L)', 'bandas de radar (aquí usamos la L)') },
          { n: 10, label: T('metre pixels (GCOV)', 'metros por pixel (GCOV)', 'metros por píxel (GCOV)') },
        ]} />
      </>
    ),
  },
  {
    id: 'history',
    kicker: T('02 · A short history', '02 · Uma breve história', '02 · Una breve historia'),
    title: T('How NISAR got to Manaus', 'Como o NISAR chegou a Manaus', 'Cómo NISAR llegó a Manaos'),
    fig: T('Timeline of the mission', 'Linha do tempo da missão', 'Línea de tiempo de la misión'),
    narration: T(
      'The story starts in 2007, when scientists asked for a radar mission to watch land and ice change. In 2014 NASA and ISRO agreed to build one satellite together, and it was launched from India on the thirtieth of July 2025. After a few months of checks, the first scenes reached the public catalogue in October. Continuous coverage over Manaus began in June this year, and validated products start on the sixth of November, which is why our planned pair of dates is the twenty-first of October and the second of November.',
      'A história começa em 2007, quando cientistas pediram uma missão de radar para acompanhar a mudança de terra e gelo. Em 2014 a NASA e a ISRO combinaram construir um satélite juntas, e ele foi lançado da Índia em 30 de julho de 2025. Depois de alguns meses de testes, as primeiras cenas chegaram ao catálogo público em outubro. A cobertura contínua sobre Manaus começou em junho deste ano, e os produtos validados começam em 6 de novembro, por isso o nosso par de datas planejado é 21 de outubro e 2 de novembro.',
      'La historia empieza en 2007, cuando los científicos pidieron una misión de radar para ver cambiar la tierra y el hielo. En 2014 la NASA y la ISRO acordaron construir un satélite juntas, y se lanzó desde la India el 30 de julio de 2025. Tras unos meses de pruebas, las primeras escenas llegaron al catálogo público en octubre. La cobertura continua sobre Manaos empezó en junio de este año, y los productos validados empiezan el 6 de noviembre, por eso nuestro par de fechas previsto es el 21 de octubre y el 2 de noviembre.'),
    render: () => (
      <TimelineList items={[
        { when: '2007', text: T('US scientists recommend a radar mission to watch land and ice change.', 'Cientistas americanos recomendam uma missão de radar para acompanhar a mudança de terra e gelo.', 'Científicos de EE. UU. recomiendan una misión de radar para ver cambiar la tierra y el hielo.') },
        { when: '2014', text: T('NASA and ISRO agree to build one satellite together.', 'NASA e ISRO combinam construir um satélite juntas.', 'NASA e ISRO acuerdan construir un satélite juntas.') },
        { when: '30 JUL 2025', text: T('Launch from India, then months of checkout.', 'Lançamento na Índia, depois meses de testes.', 'Lanzamiento desde la India, luego meses de pruebas.') },
        { when: 'OCT 2025', text: T('The first scenes appear in the public catalogue.', 'As primeiras cenas aparecem no catálogo público.', 'Las primeras escenas aparecen en el catálogo público.') },
        { when: 'JUN 2026', text: T('Continuous coverage over Manaus begins.', 'Começa a cobertura contínua sobre Manaus.', 'Empieza la cobertura continua sobre Manaos.') },
        { when: '6 NOV 2026', text: T('Validated products start, covering scenes since 21 Oct.', 'Começam os produtos validados, cobrindo cenas desde 21 de outubro.', 'Empiezan los productos validados, cubriendo escenas desde el 21 de octubre.') },
      ]} />
    ),
  },
  {
    id: 'echo',
    kicker: T('03 · The echo', '03 · O eco', '03 · El eco'),
    title: T('What comes back depends on the ground', 'O que volta depende do chão', 'Lo que vuelve depende del suelo'),
    fig: T('Echo strength by surface', 'Intensidade do eco por superfície', 'Intensidad del eco por superficie'),
    narration: T(
      'Let us listen to the echo. Pick a surface. Calm water is like a mirror: the pulse bounces away and almost nothing returns, so it looks dark. A forest sends back a medium echo from leaves and branches. A city sends back a very strong one, because walls and corners throw the pulse straight back. And wet soil also reflects strongly, which means moisture alone can change the echo, even when the vegetation did not change.',
      'Vamos escutar o eco. Escolha uma superfície. A água calma é como um espelho: o pulso rebate para longe e quase nada volta, então ela fica escura. A floresta devolve um eco médio, de folhas e galhos. A cidade devolve um eco muito forte, porque paredes e quinas jogam o pulso de volta. E o solo molhado também reflete forte, o que quer dizer que só a umidade pode mudar o eco, mesmo quando a vegetação não mudou.',
      'Escuchemos el eco. Elige una superficie. El agua en calma es como un espejo: el pulso rebota lejos y casi nada vuelve, así que se ve oscura. La selva devuelve un eco medio, de hojas y ramas. La ciudad devuelve uno muy fuerte, porque paredes y esquinas devuelven el pulso. Y el suelo mojado también refleja fuerte, lo que significa que solo la humedad puede cambiar el eco, aunque la vegetación no haya cambiado.'),
    render: () => (
      <Echo items={[
        { id: 'water', strength: 6, label: T('Calm river water', 'Água calma de rio', 'Agua calma de río'), text: T('Almost nothing returns: the smooth surface bounces the pulse away, so it looks dark.', 'Quase nada volta: a superfície lisa rebate o pulso para longe, então fica escura.', 'Casi nada vuelve: la superficie lisa rebota el pulso lejos, así que se ve oscura.') },
        { id: 'forest', strength: 55, label: T('Dense forest', 'Floresta densa', 'Selva densa'), text: T('A medium echo from leaves, branches and trunks. L-band reaches deeper into them than C-band.', 'Um eco médio de folhas, galhos e troncos. A banda L chega mais fundo neles que a banda C.', 'Un eco medio de hojas, ramas y troncos. La banda L llega más hondo en ellos que la banda C.') },
        { id: 'town', strength: 95, label: T('Buildings', 'Prédios', 'Edificios'), text: T('A very strong echo: walls and corners send the pulse straight back, so it looks bright.', 'Um eco muito forte: paredes e quinas devolvem o pulso direto, então fica brilhante.', 'Un eco muy fuerte: paredes y esquinas devuelven el pulso directo, así que se ve brillante.') },
        { id: 'bare', strength: 72, label: T('Wet bare soil', 'Solo nu molhado', 'Suelo desnudo mojado'), text: T('Wet soil reflects strongly, so moisture alone can change the echo with no vegetation change.', 'O solo molhado reflete forte, então só a umidade pode mudar o eco sem mudança na vegetação.', 'El suelo mojado refleja fuerte, así que solo la humedad puede cambiar el eco sin cambio en la vegetación.') },
      ]} />
    ),
  },
  {
    id: 'numbers',
    kicker: T('04 · Numbers', '04 · Números', '04 · Números'),
    title: T('Every pixel is a number', 'Cada pixel é um número', 'Cada píxel es un número'),
    fig: T('An illustrative radar scene', 'Uma cena de radar ilustrativa', 'Una escena de radar ilustrativa'),
    narration: T(
      'A radar image is not a photograph. Every pixel is just a number: how strong the echo was. Move the mouse over the image and read some pixels. The files store a plain linear value, but charts show it in decibels, a scale that makes small and large echoes easy to compare.',
      'Uma imagem de radar não é uma fotografia. Cada pixel é só um número: a força do eco. Passe o mouse pela imagem e leia alguns pixels. Os arquivos guardam um valor linear simples, mas os gráficos mostram em decibéis, uma escala que facilita comparar ecos pequenos e grandes.',
      'Una imagen de radar no es una fotografía. Cada píxel es solo un número: la fuerza del eco. Pasa el ratón por la imagen y lee algunos píxeles. Los archivos guardan un valor lineal simple, pero los gráficos lo muestran en decibeles, una escala que facilita comparar ecos pequeños y grandes.'),
    render: () => <PixelGrid />,
  },
  {
    id: 'dates',
    kicker: T('05 · Two dates', '05 · Duas datas', '05 · Dos fechas'),
    title: T('What changed in 12 days?', 'O que mudou em 12 dias?', '¿Qué cambió en 12 días?'),
    fig: T('21 Oct against 2 Nov 2026 (illustrative)', '21 out contra 2 nov 2026 (ilustrativo)', '21 oct contra 2 nov 2026 (ilustrativo)'),
    narration: T(
      'Now we compare two dates, the twenty-first of October and the second of November. Slide the bar to wipe between them. Then set the threshold: how big a difference counts as change. If you set it too low, noise lights up everywhere. If you set it too high, the real change disappears. Choosing that threshold is a scientific decision, and the report has to explain it.',
      'Agora comparamos duas datas, 21 de outubro e 2 de novembro. Deslize a barra para alternar entre elas. Depois ajuste o limiar: o tamanho de diferença que conta como mudança. Se for baixo demais, o ruído acende em todo lugar. Se for alto demais, a mudança real desaparece. Escolher esse limiar é uma decisão científica, e o relatório precisa explicá-la.',
      'Ahora comparamos dos fechas, el 21 de octubre y el 2 de noviembre. Desliza la barra para alternar entre ellas. Luego ajusta el umbral: cuán grande debe ser una diferencia para contar como cambio. Si es muy bajo, el ruido se enciende por todos lados. Si es muy alto, el cambio real desaparece. Elegir ese umbral es una decisión científica, y el informe tiene que explicarla.'),
    render: () => <TwoDates />,
  },
  {
    id: 'claims',
    kicker: T('06 · Your call', '06 · Sua decisão', '06 · Tu decisión'),
    title: T('Bright patches appeared. What goes on the map?', 'Apareceram manchas brilhantes. O que vai no mapa?', 'Aparecieron manchas brillantes. ¿Qué va en el mapa?'),
    fig: T('The evidence ladder', 'A escada de evidências', 'La escalera de evidencias'),
    narration: T(
      'Bright patches appeared between the two dates. What do we write on the map? Try each sentence. Saying that NISAR detected deforestation is too strong: radar alone cannot tell logging from a wet-season shift. Saying that rain caused it is also too strong. The honest sentence is that the radar response changed here. See how far each claim climbs the evidence ladder.',
      'Apareceram manchas brilhantes entre as duas datas. O que escrevemos no mapa? Teste cada frase. Dizer que o NISAR detectou desmatamento é forte demais: só o radar não distingue extração de madeira de uma mudança da estação chuvosa. Dizer que a chuva causou também é forte demais. A frase honesta é que a resposta do radar mudou aqui. Veja até onde cada afirmação sobe na escada de evidências.',
      'Aparecieron manchas brillantes entre las dos fechas. ¿Qué escribimos en el mapa? Prueba cada frase. Decir que NISAR detectó deforestación es demasiado: el radar solo no distingue tala de un cambio de la estación lluviosa. Decir que la lluvia lo causó también es demasiado. La frase honesta es que la respuesta del radar cambió aquí. Mira hasta dónde sube cada afirmación en la escalera de evidencias.'),
    render: () => (
      <Claims
        hint={T('Pick a sentence to see where it lands.', 'Escolha uma frase para ver onde ela cai.', 'Elige una frase para ver dónde cae.')}
        ladder={[
          T('The radar response changed', 'A resposta do radar mudou', 'La respuesta del radar cambió'),
          T('An independent source agrees (OPERA alert, optical image)', 'Uma fonte independente concorda (alerta OPERA, imagem óptica)', 'Una fuente independiente coincide (alerta OPERA, imagen óptica)'),
          T('Rain and its time lag were examined', 'A chuva e a defasagem foram examinadas', 'La lluvia y su desfase se examinaron'),
          T('A cause is supported by outside evidence', 'Uma causa é sustentada por evidência externa', 'Una causa está respaldada por evidencia externa'),
        ]}
        claims={[
          { id: 'a', text: T('“NISAR detected deforestation here.”', '“O NISAR detectou desmatamento aqui.”', '“NISAR detectó deforestación aquí.”'), marks: { 4: 'far', 1: 'hit' }, answer: T('Not yet. Radar alone cannot tell logging from a wet-season shift. Until an independent check agrees, this claim is too strong.', 'Ainda não. Só o radar não distingue extração de madeira de uma mudança da estação chuvosa. Até uma checagem independente concordar, a afirmação é forte demais.', 'Todavía no. El radar solo no distingue tala de un cambio de la estación lluviosa. Hasta que una verificación independiente coincida, la afirmación es demasiado fuerte.') },
          { id: 'b', ok: true, text: T('“NISAR detected a change in the radar response here.”', '“O NISAR detectou uma mudança na resposta do radar aqui.”', '“NISAR detectó un cambio en la respuesta del radar aquí.”'), marks: { 1: 'hit' }, answer: T('Right. This wording is exactly what the data supports. Next comes the check against OPERA alerts, and a discussion of false positives over water and towns.', 'Certo. Essa redação é exatamente o que os dados sustentam. Em seguida vem a checagem com os alertas OPERA e uma discussão de falsos positivos sobre água e cidades.', 'Correcto. Esta redacción es exactamente lo que respaldan los datos. Sigue la verificación con las alertas OPERA y una discusión de falsos positivos sobre agua y ciudades.') },
          { id: 'c', text: T('“Rain caused these patches.”', '“A chuva causou essas manchas.”', '“La lluvia causó estas manchas.”'), marks: { 3: 'far', 1: 'hit' }, answer: T('Careful. Rain may explain part of it, or none. A time chart can show an association and a lag, but not a cause.', 'Cuidado. A chuva pode explicar parte, ou nada. Um gráfico no tempo mostra associação e defasagem, mas não causa.', 'Cuidado. La lluvia puede explicar una parte, o nada. Un gráfico en el tiempo muestra asociación y desfase, pero no causa.') },
        ]} />
    ),
  },
  {
    id: 'rain',
    kicker: T('07 · Rain', '07 · Chuva', '07 · Lluvia'),
    title: T('Did the weather do it?', 'Foi o tempo que fez isso?', '¿Lo hizo el clima?'),
    fig: T('Rain bars shifted by the lag, against the radar line', 'Barras de chuva deslocadas pela defasagem, contra a linha do radar', 'Barras de lluvia desplazadas por el desfase, contra la línea del radar'),
    narration: T(
      'Wet soil and wet leaves change the echo, so we always put the rain beside the radar, with the time lag stated. Slide the lag and watch the match between the blue rain bars and the green radar line. It peaks at the lag the data supports. Both outcomes are valid: rain may explain part, or none, and we report whichever we find. It shows association, never cause.',
      'Solo molhado e folhas molhadas mudam o eco, então sempre colocamos a chuva ao lado do radar, com a defasagem declarada. Deslize a defasagem e veja a concordância entre as barras azuis de chuva e a linha verde do radar. Ela chega ao máximo na defasagem que os dados sustentam. Os dois resultados são válidos: a chuva pode explicar parte ou nada, e relatamos o que encontrarmos. Mostra associação, nunca causa.',
      'El suelo mojado y las hojas mojadas cambian el eco, así que siempre ponemos la lluvia junto al radar, con el desfase indicado. Desliza el desfase y mira la coincidencia entre las barras azules de lluvia y la línea verde del radar. Llega al máximo en el desfase que respaldan los datos. Ambos resultados son válidos: la lluvia puede explicar una parte o nada, e informamos lo que encontremos. Muestra asociación, nunca causa.'),
    render: () => <RainLag />,
  },
  {
    id: 'model',
    kicker: T('08 · The model', '08 · O modelo', '08 · El modelo'),
    title: T('A model has to earn its place', 'Um modelo precisa merecer o seu lugar', 'Un modelo tiene que ganarse su lugar'),
    fig: T('Baseline against model, on unseen dates', 'Referência contra modelo, em datas nunca vistas', 'Referencia contra modelo, en fechas nunca vistas'),
    narration: T(
      'Last idea: a model has to earn its place. The simple baseline is the average of the same month. The light model only joins the map if it scores better on dates it has never seen. Try both outcomes. If the model wins, the map shows its layer next to the baseline. If it does not, the map shows the baseline, and the report explains why. Both are honest results.',
      'Última ideia: um modelo precisa merecer o seu lugar. A referência simples é a média do mesmo mês. O modelo leve só entra no mapa se tiver nota melhor em datas que nunca viu. Teste os dois resultados. Se o modelo vencer, o mapa mostra a camada dele ao lado da referência. Se não, o mapa mostra a referência, e o relatório explica por quê. Os dois são resultados honestos.',
      'Última idea: un modelo tiene que ganarse su lugar. La referencia simple es el promedio del mismo mes. El modelo ligero solo entra en el mapa si puntúa mejor en fechas que nunca vio. Prueba los dos resultados. Si el modelo gana, el mapa muestra su capa junto a la referencia. Si no, el mapa muestra la referencia, y el informe explica por qué. Ambos son resultados honestos.'),
    render: () => <ModelChoice />,
  },
  {
    id: 'honest',
    kicker: T('09 · Why it matters', '09 · Por que importa', '09 · Por qué importa'),
    title: T('The problem this project solves', 'O problema que este projeto resolve', 'El problema que resuelve este proyecto'),
    fig: T('Problem and answer', 'Problema e resposta', 'Problema y respuesta'),
    narration: T(
      'So what problem does all this solve? Forests and cities change, and we usually find out only after the damage is done. Clouds hide the Amazon from ordinary satellite photos for much of the year, and radar data is so large and technical that few people can use it. This project reads NISAR radar through the clouds and shows what changed between two dates, place by place. It puts rain next to the radar, to ask whether a change fits the weather, as an association and never as a proof of cause. And it projects radar and rain to 2030 as a labelled scenario, with an error band, and says plainly when the data is too short to trust. We say a change in the radar response, never that NISAR detected deforestation.',
      'Então, que problema tudo isso resolve? Florestas e cidades mudam, e normalmente só ficamos sabendo depois que o dano aconteceu. As nuvens escondem a Amazônia das fotos de satélite comuns durante boa parte do ano, e os dados de radar são tão grandes e técnicos que poucas pessoas conseguem usá-los. Este projeto lê o radar NISAR através das nuvens e mostra o que mudou entre duas datas, lugar por lugar. Coloca a chuva ao lado do radar, para perguntar se uma mudança combina com o tempo, como associação e nunca como prova de causa. E projeta radar e chuva até 2030 como um cenário rotulado, com faixa de erro, e diz com clareza quando os dados são curtos demais para confiar. Dizemos uma mudança na resposta do radar, nunca que o NISAR detectou desmatamento.',
      'Entonces, ¿qué problema resuelve todo esto? Los bosques y las ciudades cambian, y normalmente nos enteramos solo cuando el daño ya ocurrió. Las nubes esconden el Amazonas de las fotos de satélite comunes buena parte del año, y los datos de radar son tan grandes y técnicos que pocas personas pueden usarlos. Este proyecto lee el radar NISAR a través de las nubes y muestra qué cambió entre dos fechas, lugar por lugar. Pone la lluvia junto al radar, para preguntar si un cambio encaja con el tiempo, como asociación y nunca como prueba de causa. Y proyecta radar y lluvia hasta 2030 como un escenario etiquetado, con banda de error, y dice con claridad cuándo los datos son demasiado cortos para confiar. Decimos un cambio en la respuesta del radar, nunca que NISAR detectó deforestación.'),
    render: () => (
      <ProblemSolution
        problemLabel={T('The problem', 'O problema', 'El problema')} solutionLabel={T('What the project does', 'O que o projeto faz', 'Qué hace el proyecto')}
        problems={[
          T('Damage is noticed only after it happens.', 'O dano só é percebido depois que acontece.', 'El daño se nota solo después de que ocurre.'),
          T('Clouds hide the Amazon from ordinary satellite photos.', 'As nuvens escondem a Amazônia das fotos de satélite comuns.', 'Las nubes esconden el Amazonas de las fotos de satélite comunes.'),
          T('Radar data is huge and hard to read.', 'Dados de radar são enormes e difíceis de ler.', 'Los datos de radar son enormes y difíciles de leer.'),
        ]}
        solutions={[
          T('Reads NISAR radar through the clouds and shows what changed between two dates.', 'Lê o radar NISAR através das nuvens e mostra o que mudou entre duas datas.', 'Lee el radar NISAR a través de las nubes y muestra qué cambió entre dos fechas.'),
          T('Puts rain beside the radar: an association, never a proof of cause.', 'Põe a chuva ao lado do radar: uma associação, nunca prova de causa.', 'Pone la lluvia junto al radar: una asociación, nunca prueba de causa.'),
          T('Projects to 2030 as a labelled scenario, with an error band, and warns when data is too short.', 'Projeta até 2030 como cenário rotulado, com faixa de erro, e avisa quando os dados são curtos.', 'Proyecta hasta 2030 como escenario etiquetado, con banda de error, y avisa cuando los datos son cortos.'),
        ]} />
    ),
  },
  {
    id: 'next', solo: true,
    kicker: T('Now use it', 'Agora use', 'Ahora úsalo'),
    title: T('Open the observatory', 'Abra o observatório', 'Abre el observatorio'),
    narration: T(
      'That is all you need. Now open the observatory: the 3D map where these ideas are applied to real radar, real rain and forecasts up to 2030. Take your time, and remember what we say and what we avoid.',
      'Isso é tudo de que você precisa. Agora abra o observatório: o mapa 3D onde essas ideias são aplicadas a radar real, chuva real e previsões até 2030. Com calma, e lembre o que dizemos e o que evitamos.',
      'Eso es todo lo que necesitas. Ahora abre el observatorio: el mapa 3D donde estas ideas se aplican a radar real, lluvia real y pronósticos hasta 2030. Con calma, y recuerda lo que decimos y lo que evitamos.'),
  },
]
