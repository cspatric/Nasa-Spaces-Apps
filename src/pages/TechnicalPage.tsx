import { Fragment, useEffect } from 'react'
import Link from '../components/Link'
import Logo from '../components/Logo'
import { LANGS, useI18n } from '../lib/i18n'
import { T, useTx } from './helpers'
import './technical.css'

/**
 * Data and methods: the technical record of the project, written to be checked. Every number here comes from the code
 * (asf-cleaner: config.py, forecast.py, risk.py, training.py) or from models/training_log.json, not from memory.
 */

const STATS = [
  { v: '85 %', l: T('Land-cover accuracy', 'Acerto da cobertura do solo', 'Acierto de la cobertura del suelo'), n: T('radar + ground color, on places and years never seen', 'radar + cor do solo, em lugares e anos nunca vistos', 'radar + color del suelo, en lugares y años nunca vistos') },
  { v: '73 %', l: T('Radar alone', 'Só radar', 'Solo radar'), n: T('same test, without the optical color', 'mesmo teste, sem a cor óptica', 'misma prueba, sin el color óptico') },
  { v: '54 %', l: T('Simple reference', 'Referência simples', 'Referencia simple'), n: T('depth-2 tree; the model must beat it', 'árvore de profundidade 2; o modelo precisa vencê-la', 'árbol de profundidad 2; el modelo debe superarlo') },
  { v: '16', l: T('Training rounds', 'Rodadas de treino', 'Rondas de entrenamiento'), n: T('the model beat the reference in 15', 'o modelo venceu a referência em 15', 'el modelo superó la referencia en 15') },
]

const DATA: { name: string; who: string; spec: ReturnType<typeof T> }[] = [
  { name: 'NISAR L2 GCOV', who: 'ASF DAAC', spec: T('L-band (24 cm), 12-day repeat, since Oct 2025. Polarimetric covariance read from the HDF5 file, only the window around the point. Radiometric normalization gamma0. Mask: pixels with valid-samples 0 (not focused) or 255 (outside the acquisition) are dropped.', 'Banda L (24 cm), repetição de 12 dias, desde out/2025. Covariância polarimétrica lida do arquivo HDF5, só a janela em torno do ponto. Normalização radiométrica gamma0. Máscara: pixels com amostras válidas 0 (não focalizado) ou 255 (fora da aquisição) são descartados.', 'Banda L (24 cm), repetición de 12 días, desde oct/2025. Covarianza polarimétrica leída del archivo HDF5, solo la ventana alrededor del punto. Normalización radiométrica gamma0. Máscara: se descartan píxeles con muestras válidas 0 (no enfocado) o 255 (fuera de la adquisición).') },
  { name: 'OPERA RTC-S1', who: 'ASF · OPERA', spec: T('Sentinel-1 C-band, 30 m, gamma0, VV and VH, 2016 onward (1A, 1B, 1C). GeoTIFFs read by range requests. Shadow, layover and invalid pixels removed (mask 0 = valid). One scene per month, always from the same burst, track and direction, so the incidence angle does not drift.', 'Sentinel-1 banda C, 30 m, gamma0, VV e VH, de 2016 em diante (1A, 1B, 1C). GeoTIFFs lidos por requisições de faixa. Sombra, layover e pixels inválidos removidos (máscara 0 = válido). Uma cena por mês, sempre do mesmo burst, trilha e direção, para o ângulo de incidência não variar.', 'Sentinel-1 banda C, 30 m, gamma0, VV y VH, desde 2016 (1A, 1B, 1C). GeoTIFFs leídos por solicitudes de rango. Se eliminan sombra, layover y píxeles inválidos (máscara 0 = válido). Una escena por mes, siempre del mismo burst, pista y dirección, para que el ángulo de incidencia no varíe.') },
  { name: 'GPM IMERG V07', who: 'GES DISC', spec: T('Rain, 0.1° cells (about 11 km). Daily Final (gauge-adjusted, ends 2025-09-30) and Late (to yesterday) runs, and the monthly Final product. The run is recorded with every value, because they differ systematically.', 'Chuva, células de 0,1° (cerca de 11 km). Rodadas diárias Final (ajustada com pluviômetros, termina em 30/09/2025) e Late (até ontem), e o produto mensal Final. A rodada é registrada com cada valor, porque elas diferem de forma sistemática.', 'Lluvia, celdas de 0,1° (unos 11 km). Corridas diarias Final (ajustada con pluviómetros, termina el 30/09/2025) y Late (hasta ayer), y el producto mensual Final. La corrida se registra con cada valor, porque difieren de forma sistemática.') },
  { name: 'NASA GIBS', who: 'NASA ESDIS', spec: T('Map layers: NISAR_L2_Geocoded_Polarimetric_Covariance, OPERA_L3_Dynamic_Surface_Water_Extent-HLS (DSWx, 30 m), OPERA_L3_DIST-ALERT-HLS (vegetation loss, 30 m), IMERG_Precipitation_Rate, VIIRS_NOAA21_Land_Surface_Temp_Day (1 km), SMAP_L4_Analyzed_Surface_Soil_Moisture. Several days are stacked and tinted to one color per layer.', 'Camadas do mapa: NISAR_L2_Geocoded_Polarimetric_Covariance, OPERA_L3_Dynamic_Surface_Water_Extent-HLS (DSWx, 30 m), OPERA_L3_DIST-ALERT-HLS (perda de vegetação, 30 m), IMERG_Precipitation_Rate, VIIRS_NOAA21_Land_Surface_Temp_Day (1 km), SMAP_L4_Analyzed_Surface_Soil_Moisture. Vários dias são empilhados e coloridos com uma cor por camada.', 'Capas del mapa: NISAR_L2_Geocoded_Polarimetric_Covariance, OPERA_L3_Dynamic_Surface_Water_Extent-HLS (DSWx, 30 m), OPERA_L3_DIST-ALERT-HLS (pérdida de vegetación, 30 m), IMERG_Precipitation_Rate, VIIRS_NOAA21_Land_Surface_Temp_Day (1 km), SMAP_L4_Analyzed_Surface_Soil_Moisture. Se apilan varios días y se tiñen de un color por capa.') },
  { name: 'Sentinel-2 cloudless', who: 'EOX', spec: T('10 m base map, and the source of the "ground color" features the land-cover model uses (one tile request per place).', 'Mapa-base de 10 m, e a fonte das características de "cor do solo" que o modelo de cobertura usa (uma requisição de tile por lugar).', 'Mapa base de 10 m, y la fuente de las características de "color del suelo" que usa el modelo de cobertura (una solicitud de tile por lugar).') },
  { name: 'Open-Meteo', who: 'Open-Meteo', spec: T('Wind speed and direction at 850 hPa (about 1.5 km up) on a coarse grid; the animated air currents are interpolated from it.', 'Velocidade e direção do vento a 850 hPa (cerca de 1,5 km de altura) em grade grossa; as correntes de ar animadas são interpoladas dela.', 'Velocidad y dirección del viento a 850 hPa (unos 1,5 km de altura) en una malla gruesa; las corrientes de aire animadas se interpolan de ella.') },
  { name: 'Terrain and 3D city', who: 'AWS · OpenFreeMap', spec: T('Terrarium elevation tiles for the relief; OpenStreetMap buildings and streets (vector tiles) extruded by height from zoom 13.', 'Tiles de elevação Terrarium para o relevo; prédios e ruas do OpenStreetMap (tiles vetoriais) extrudados pela altura a partir do zoom 13.', 'Tiles de elevación Terrarium para el relieve; edificios y calles de OpenStreetMap (tiles vectoriales) extruidos por altura desde el zoom 13.') },
]

const PIPE = [
  { t: T('Search', 'Busca', 'Búsqueda'), d: T('ASF is searched by point and dates; results are remembered for minutes (an hour if the range ended days ago).', 'O ASF é consultado por ponto e datas; os resultados ficam na memória por minutos (uma hora se o período terminou há dias).', 'Se consulta el ASF por punto y fechas; los resultados se recuerdan unos minutos (una hora si el periodo terminó hace días).') },
  { t: T('Read', 'Leitura', 'Lectura'), d: T('Only the pixels of a window (500 m by default, 30 to 5000 m) are read from each scene, never the whole file.', 'Só os pixels de uma janela (500 m por padrão, de 30 a 5000 m) são lidos de cada cena, nunca o arquivo inteiro.', 'Solo se leen los píxeles de una ventana (500 m por defecto, de 30 a 5000 m) de cada escena, nunca el archivo entero.') },
  { t: T('Clean', 'Limpeza', 'Limpieza'), d: T('Invalid pixels are masked; the median of the window in dB (10·log10) is kept, because a single pixel is mostly speckle.', 'Pixels inválidos são mascarados; guarda-se a mediana da janela em dB (10·log10), porque um único pixel é quase só speckle.', 'Se enmascaran píxeles inválidos; se guarda la mediana de la ventana en dB (10·log10), porque un solo píxel es casi todo speckle.') },
  { t: T('Cache', 'Cache', 'Caché'), d: T('Each scene is stored once, tagged with the processing version, so a change in the cleaning logic refetches only what is stale.', 'Cada cena é guardada uma vez, marcada com a versão do processamento, então uma mudança na limpeza rebusca só o que ficou velho.', 'Cada escena se guarda una vez, marcada con la versión del procesamiento, así un cambio en la limpieza vuelve a pedir solo lo viejo.') },
  { t: T('Stream', 'Transmissão', 'Transmisión'), d: T('Rows travel to the page as Server-Sent Events while scenes finish; closing the page cancels the scenes not yet started.', 'As linhas chegam à página como Server-Sent Events enquanto as cenas terminam; fechar a página cancela as cenas ainda não iniciadas.', 'Las filas llegan a la página como Server-Sent Events mientras terminan las escenas; cerrar la página cancela las escenas aún no iniciadas.') },
]

const SPEC: { k: ReturnType<typeof T>; v: ReturnType<typeof T> }[] = [
  { k: T('Seasonality', 'Sazonalidade', 'Estacionalidad'), v: T('value minus the median of the same calendar month (needs 2+ years; otherwise the overall median, with a warning)', 'valor menos a mediana do mesmo mês do calendário (precisa de 2+ anos; senão a mediana geral, com aviso)', 'valor menos la mediana del mismo mes del calendario (necesita 2+ años; si no, la mediana general, con aviso)') },
  { k: T('Trend', 'Tendência', 'Tendencia'), v: T('Theil-Sen slope in dB/year with a 95 % interval and a Mann-Kendall p-value (10+ scenes, 2+ years); the p-value assumes independence, so it is optimistic', 'inclinação de Theil-Sen em dB/ano com intervalo de 95 % e p-valor de Mann-Kendall (10+ cenas, 2+ anos); o p-valor supõe independência, então é otimista', 'pendiente de Theil-Sen en dB/año con intervalo de 95 % y p-valor de Mann-Kendall (10+ escenas, 2+ años); el p-valor supone independencia, así que es optimista') },
  { k: T('Event', 'Evento', 'Evento'), v: T('3 or more consecutive scenes more than 2.5 dB from the baseline, in the same direction; shorter runs are listed as isolated outliers, never dropped', '3 ou mais cenas seguidas a mais de 2,5 dB da linha de base, no mesmo sentido; sequências menores aparecem como pontos isolados, nunca descartados', '3 o más escenas seguidas a más de 2,5 dB de la línea base, en el mismo sentido; las secuencias menores aparecen como puntos aislados, nunca descartados') },
  { k: T('Rain context', 'Contexto de chuva', 'Contexto de lluvia'), v: T('wet if IMERG showed 10 mm or more on the day or the day before, dry if less, unknown without data', 'úmido se o IMERG mostrou 10 mm ou mais no dia ou na véspera, seco se menos, desconhecido sem dados', 'húmedo si IMERG mostró 10 mm o más ese día o el anterior, seco si menos, desconocido sin datos') },
  { k: T('Channels', 'Canais', 'Canales'), v: T('cross-pol (HV, VH) follows vegetation change; co-pol (HH, VV) follows soil moisture and surface change', 'a polarização cruzada (HV, VH) segue a mudança da vegetação; a copolar (HH, VV) segue a umidade do solo e a superfície', 'la polarización cruzada (HV, VH) sigue el cambio de la vegetación; la copolar (HH, VV) sigue la humedad del suelo y la superficie') },
]

const MODELS = [
  { k: T('Candidates', 'Candidatos', 'Candidatos'), v: T('seasonal (yearly cycle, 2 harmonics) · seasonal + trend · seasonal + trend + rain anomaly · … + gradient boosting on the residuals. Rain: seasonal and seasonal + trend on log(1+rain).', 'sazonal (ciclo anual, 2 harmônicos) · sazonal + tendência · sazonal + tendência + anomalia de chuva · … + gradient boosting nos resíduos. Chuva: sazonal e sazonal + tendência em log(1+chuva).', 'estacional (ciclo anual, 2 armónicos) · estacional + tendencia · estacional + tendencia + anomalía de lluvia · … + gradient boosting sobre los residuos. Lluvia: estacional y estacional + tendencia en log(1+lluvia).') },
  { k: T('Choice', 'Escolha', 'Elección'), v: T('rolling-origin backtest: train on the past, forecast the next 12 months, move the origin forward, 3 folds; the lowest error wins and is refitted on all the data', 'backtest de origem móvel: treina no passado, prevê os 12 meses seguintes, avança a origem, 3 dobras; vence o menor erro, reajustado com todos os dados', 'backtest de origen móvil: entrena con el pasado, pronostica los 12 meses siguientes, avanza el origen, 3 pliegues; gana el menor error, reajustado con todos los datos') },
  { k: T('Reliable?', 'Confiável?', '¿Fiable?'), v: T('only if the skill against "same month last year" is above 0 and there are 48+ months; fewer than 39 months is refused', 'só se a habilidade contra "mesmo mês do ano passado" for maior que 0 e houver 48+ meses; menos de 39 meses é recusado', 'solo si la habilidad frente a "el mismo mes del año pasado" es mayor que 0 y hay 48+ meses; menos de 39 meses se rechaza') },
  { k: T('Uncertainty', 'Incerteza', 'Incertidumbre'), v: T('80 % band from the backtest errors, widened with each year ahead because the backtest only looks 12 months out', 'faixa de 80 % dos erros do backtest, ampliada a cada ano à frente porque o backtest só olha 12 meses', 'banda del 80 % de los errores del backtest, ampliada cada año porque el backtest solo mira 12 meses') },
  { k: T('Future rain', 'Chuva futura', 'Lluvia futura'), v: T('unknown, so the forecast assumes normal rain; the rain slider (0.5 to 1.5) is a what-if, not a prediction', 'desconhecida, então a previsão supõe chuva normal; o controle de chuva (0,5 a 1,5) é um "e se", não uma previsão', 'desconocida, así que el pronóstico supone lluvia normal; el control de lluvia (0,5 a 1,5) es un "qué pasaría si", no una predicción') },
]

const RISKS = [
  { k: T('Vegetation loss', 'Perda de vegetação', 'Pérdida de vegetación'), v: T('a lasting drop of the cross-polarization after removing the yearly cycle, found as the most likely single step change', 'queda duradoura da polarização cruzada depois de remover o ciclo anual, achada como a mudança de degrau única mais provável', 'caída duradera de la polarización cruzada tras quitar el ciclo anual, hallada como el cambio de escalón único más probable') },
  { k: T('Flood', 'Inundação', 'Inundación'), v: T('past inundation-like backscatter, rain of the last 3 months against the place’s own climate, forecast wet-season peak against past peaks', 'retroespalhamento parecido com inundação no passado, chuva dos últimos 3 meses contra o clima do próprio lugar, pico previsto da estação chuvosa contra picos passados', 'retrodispersión parecida a inundación en el pasado, lluvia de los últimos 3 meses frente al clima del propio lugar, pico previsto de la estación lluviosa frente a picos pasados') },
  { k: T('Drought and fire', 'Seca e fogo', 'Sequía y fuego'), v: T('standardised 3-month rain (SPI-like) and the forecast of the next six months', 'chuva de 3 meses padronizada (tipo SPI) e a previsão dos próximos seis meses', 'lluvia de 3 meses estandarizada (tipo SPI) y el pronóstico de los próximos seis meses') },
  { k: T('Unusual change', 'Mudança incomum', 'Cambio inusual'), v: T('IsolationForest over the monthly vectors [VV, VH, VV−VH, rain, 3-month rain]', 'IsolationForest sobre os vetores mensais [VV, VH, VV−VH, chuva, chuva de 3 meses]', 'IsolationForest sobre los vectores mensuales [VV, VH, VV−VH, lluvia, lluvia de 3 meses]') },
]

const LIMITS = [
  T('The risks are screening signals ("look here first"), not predictions of events. The model knows nothing about floods, fires or land-cover change that have not happened.', 'Os riscos são sinais de triagem ("olhe aqui primeiro"), não previsões de eventos. O modelo não sabe nada de enchentes, incêndios ou mudanças de cobertura que ainda não aconteceram.', 'Los riesgos son señales de cribado ("mira aquí primero"), no predicciones de eventos. El modelo no sabe nada de inundaciones, incendios o cambios de cobertura que aún no ocurrieron.'),
  T('We did not reach the 90 % target for land cover: with 51 reference places each test holds about 13, so one hard place moves the result by several points, and "other vegetation" is a mixed class. More labeled places are the way up.', 'Não chegamos à meta de 90 % na cobertura do solo: com 51 lugares de referência cada teste tem cerca de 13, então um lugar difícil move o resultado vários pontos, e "outra vegetação" é uma classe mista. Mais lugares rotulados são o caminho.', 'No llegamos a la meta del 90 % en cobertura del suelo: con 51 lugares de referencia cada prueba tiene unos 13, así que un lugar difícil mueve el resultado varios puntos, y "otra vegetación" es una clase mixta. Más lugares etiquetados son el camino.'),
  T('NISAR only exists since Oct 2025, far too short to learn seasons from; the forecast is learned from Sentinel-1 (OPERA). NISAR is shown, compared and used for recent change.', 'O NISAR só existe desde out/2025, curto demais para aprender estações; a previsão aprende do Sentinel-1 (OPERA). O NISAR é mostrado, comparado e usado para mudança recente.', 'NISAR solo existe desde oct/2025, demasiado corto para aprender estaciones; el pronóstico aprende de Sentinel-1 (OPERA). NISAR se muestra, se compara y se usa para el cambio reciente.'),
  T('NISAR’s mask says nothing about shadow or layover, so on steep terrain those pixels are not filtered; and its calibration may still change early in the mission. Watch for steps in a long series at platform or version boundaries.', 'A máscara do NISAR não diz nada sobre sombra ou layover, então em terreno íngreme esses pixels não são filtrados; e sua calibração ainda pode mudar no início da missão. Atenção a degraus numa série longa nas trocas de plataforma ou versão.', 'La máscara de NISAR no dice nada de sombra o layover, así que en terreno empinado esos píxeles no se filtran; y su calibración aún puede cambiar al inicio de la misión. Ojo a los escalones en una serie larga en los cambios de plataforma o versión.'),
  T('IMERG cells are about 11 km wide, far larger than the radar window: it is the regional rain, and a local storm can be missed. Final and Late runs can differ, so rain before and after 2025-09-30 is not strictly comparable.', 'As células do IMERG têm cerca de 11 km, muito maiores que a janela do radar: é a chuva regional, e uma tempestade local pode passar despercebida. As rodadas Final e Late podem diferir, então a chuva antes e depois de 30/09/2025 não é estritamente comparável.', 'Las celdas de IMERG miden unos 11 km, mucho más que la ventana del radar: es la lluvia regional, y una tormenta local puede pasar inadvertida. Las corridas Final y Late pueden diferir, así que la lluvia antes y después del 30/09/2025 no es estrictamente comparable.'),
  T('An anomaly says that something changed, not what. Confirm with optical imagery or known event dates before calling it an event. The disaster simulations are illustrations of scale, not forecasts.', 'Uma anomalia diz que algo mudou, não o quê. Confirme com imagem óptica ou datas de eventos conhecidos antes de chamar de evento. As simulações de desastres são ilustrações de escala, não previsões.', 'Una anomalía dice que algo cambió, no qué. Confirma con imagen óptica o fechas de eventos conocidos antes de llamarlo evento. Las simulaciones de desastres son ilustraciones de escala, no pronósticos.'),
]

type Tri = ReturnType<typeof T>
interface Source { name: string; by: string; use: Tri; /** The address the program really calls, so it can be checked in the network tab. */ calls: string; links: [string, string][] }
interface SourceGroup { id: string; title: Tri; note: Tri; items: Source[] }

/**
 * Every outside source SARIS reads, with the address it calls and where to read about it. "Through the SARIS API" means
 * the page asks the backend (asf-cleaner, an HTTP API at API_URL) and the backend asks the source; "from the browser" means
 * the page asks the source itself.
 */
const SOURCE_GROUPS: SourceGroup[] = [
  {
    id: 'radar', title: T('Radar and rain (through the SARIS API)', 'Radar e chuva (pela API do SARIS)', 'Radar y lluvia (por la API de SARIS)'),
    note: T('The page never talks to these archives: it asks the SARIS backend, which holds the Earthdata token, reads only the pixels it needs and streams the result.', 'A página nunca fala com estes arquivos: ela pergunta ao backend do SARIS, que guarda o token do Earthdata, lê só os pixels necessários e transmite o resultado.', 'La página nunca habla con estos archivos: pregunta al backend de SARIS, que guarda el token de Earthdata, lee solo los píxeles necesarios y transmite el resultado.'),
    items: [
      { name: 'NISAR L2 GCOV', by: 'NASA/JPL · ISRO · ASF DAAC', use: T('L-band radar backscatter at a point (HH, HV), from October 2025.', 'Retroespalhamento do radar banda L num ponto (HH, HV), desde outubro de 2025.', 'Retrodispersión del radar banda L en un punto (HH, HV), desde octubre de 2025.'), calls: 'api.daac.asf.alaska.edu/services/search/param (dataset=NISAR, processingLevel=GCOV)', links: [['NISAR mission', 'https://nisar.jpl.nasa.gov'], ['Product documentation', 'https://nisar-docs.asf.alaska.edu'], ['ASF DAAC', 'https://asf.alaska.edu']] },
      { name: 'OPERA RTC-S1 (Sentinel-1)', by: 'NASA/JPL OPERA · ESA Copernicus · ASF DAAC', use: T('C-band radar backscatter (VV, VH), 2016 onward: the historical series and the base of the forecast.', 'Retroespalhamento do radar banda C (VV, VH), de 2016 em diante: a série histórica e a base da previsão.', 'Retrodispersión del radar banda C (VV, VH), desde 2016: la serie histórica y la base del pronóstico.'), calls: 'api.daac.asf.alaska.edu/services/search/param (dataset=OPERA-S1, processingLevel=RTC); GeoTIFFs by range request', links: [['OPERA RTC product', 'https://www.jpl.nasa.gov/go/opera/products/rtc-product/'], ['OPERA project', 'https://www.jpl.nasa.gov/go/opera'], ['Sentinel-1 mission', 'https://sentinels.copernicus.eu/web/sentinel/missions/sentinel-1']] },
      { name: 'ASF Search API', by: 'ASF DAAC', use: T('Finds the scenes that cover a point and a period.', 'Encontra as cenas que cobrem um ponto e um período.', 'Encuentra las escenas que cubren un punto y un período.'), calls: 'api.daac.asf.alaska.edu/services/search/param', links: [['API documentation', 'https://docs.asf.alaska.edu/api/basics/']] },
      { name: 'GPM IMERG V07', by: 'NASA GPM · GES DISC', use: T('Daily rain (Final and Late runs) and monthly rain (Final), in 0.1° cells.', 'Chuva diária (rodadas Final e Late) e mensal (Final), em células de 0,1°.', 'Lluvia diaria (corridas Final y Late) y mensual (Final), en celdas de 0,1°.'), calls: 'opendap.earthdata.nasa.gov/collections/…/granules/… (one grid cell per request); granule lists from cmr.earthdata.nasa.gov', links: [['GPM IMERG', 'https://gpm.nasa.gov/data/imerg'], ['Daily Final (GPM_3IMERGDF)', 'https://disc.gsfc.nasa.gov/datasets/GPM_3IMERGDF_07/summary'], ['Daily Late (GPM_3IMERGDL)', 'https://disc.gsfc.nasa.gov/datasets/GPM_3IMERGDL_07/summary'], ['Monthly (GPM_3IMERGM)', 'https://disc.gsfc.nasa.gov/datasets/GPM_3IMERGM_07/summary']] },
      { name: 'NASA CMR', by: 'NASA ESDIS', use: T('Lists the IMERG files that exist for each day or month.', 'Lista os arquivos do IMERG que existem para cada dia ou mês.', 'Lista los archivos de IMERG que existen para cada día o mes.'), calls: 'cmr.earthdata.nasa.gov/search/granules.json', links: [['CMR search API', 'https://cmr.earthdata.nasa.gov/search/site/docs/search/api.html']] },
      { name: 'Earthdata Login', by: 'NASA ESDIS', use: T('Authenticates every read of ASF and GES DISC; the token stays on the server.', 'Autentica toda leitura do ASF e do GES DISC; o token fica no servidor.', 'Autentica toda lectura de ASF y GES DISC; el token queda en el servidor.'), calls: 'urs.earthdata.nasa.gov (token in the EARTHDATA_TOKEN variable or the backend .env)', links: [['Earthdata Login', 'https://urs.earthdata.nasa.gov']] },
    ],
  },
  {
    id: 'layers', title: T('Map layers (from the browser)', 'Camadas do mapa (direto do navegador)', 'Capas del mapa (desde el navegador)'),
    note: T('Imagery tiles are requested by the map itself and kept on the device by a service worker.', 'Os tiles de imagem são pedidos pelo próprio mapa e guardados no aparelho por um service worker.', 'Los mosaicos de imagen los pide el propio mapa y un service worker los guarda en el dispositivo.'),
    items: [
      { name: 'NASA GIBS', by: 'NASA ESDIS', use: T('Every NASA layer on the map: NISAR backscatter, surface water (OPERA DSWx), vegetation-loss alerts (OPERA DIST-ALERT), rain rate (IMERG), land surface temperature (VIIRS NOAA-21), soil moisture (SMAP L4), daily true color (VIIRS, MODIS) and Blue Marble.', 'Todas as camadas da NASA no mapa: retroespalhamento do NISAR, água superficial (OPERA DSWx), alertas de perda de vegetação (OPERA DIST-ALERT), taxa de chuva (IMERG), temperatura da superfície (VIIRS NOAA-21), umidade do solo (SMAP L4), cor real diária (VIIRS, MODIS) e Blue Marble.', 'Todas las capas de la NASA en el mapa: retrodispersión de NISAR, agua superficial (OPERA DSWx), alertas de pérdida de vegetación (OPERA DIST-ALERT), tasa de lluvia (IMERG), temperatura de la superficie (VIIRS NOAA-21), humedad del suelo (SMAP L4), color real diario (VIIRS, MODIS) y Blue Marble.'), calls: 'gibs.earthdata.nasa.gov/wmts/epsg3857/best', links: [['GIBS API', 'https://www.earthdata.nasa.gov/engage/open-data-services-software/earthdata-developer-portal/gibs-api'], ['GIBS documentation', 'https://nasa-gibs.github.io/gibs-api-docs/'], ['Worldview (browse the layers)', 'https://worldview.earthdata.nasa.gov']] },
      { name: 'SMAP L4 · VIIRS · MODIS · Blue Marble', by: 'NASA', use: T('The instruments and products behind some GIBS layers.', 'Os instrumentos e produtos por trás de algumas camadas do GIBS.', 'Los instrumentos y productos detrás de algunas capas de GIBS.'), calls: 'through gibs.earthdata.nasa.gov', links: [['SMAP L4 soil moisture (NSIDC)', 'https://nsidc.org/data/spl4smau'], ['VIIRS', 'https://www.earthdata.nasa.gov/data/instruments/viirs'], ['MODIS', 'https://modis.gsfc.nasa.gov'], ['Blue Marble', 'https://visibleearth.nasa.gov/collection/1484/blue-marble']] },
      { name: 'OPERA DSWx · DIST-ALERT', by: 'NASA/JPL OPERA', use: T('Surface-water extent and vegetation-disturbance alerts shown as layers.', 'Extensão de água superficial e alertas de distúrbio da vegetação mostrados como camadas.', 'Extensión de agua superficial y alertas de perturbación de la vegetación mostrados como capas.'), calls: 'through gibs.earthdata.nasa.gov', links: [['DSWx', 'https://www.jpl.nasa.gov/go/opera/products/dswx-product-suite/'], ['DIST-ALERT', 'https://www.jpl.nasa.gov/go/opera/products/dist-product-suite/']] },
      { name: 'Sentinel-2 cloudless', by: 'EOX · contains modified Copernicus Sentinel data', use: T('The 10 m satellite base map; the backend also reads one tile per place to get the "ground color" the land-cover model uses.', 'O mapa-base de satélite de 10 m; o backend também lê um tile por lugar para obter a "cor do solo" que o modelo de cobertura usa.', 'El mapa base de satélite de 10 m; el backend también lee un mosaico por lugar para obtener el "color del suelo" que usa el modelo de cobertura.'), calls: 'tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2025_3857', links: [['Sentinel-2 cloudless', 'https://s2maps.eu'], ['Sentinel-2 mission', 'https://sentinels.copernicus.eu/web/sentinel/missions/sentinel-2']] },
      { name: 'AWS Terrain Tiles (Terrarium)', by: 'Mapzen · AWS Open Data', use: T('Elevation for the 3D relief and the flood simulation.', 'Elevação para o relevo 3D e a simulação de cheia.', 'Elevación para el relieve 3D y la simulación de inundación.'), calls: 's3.amazonaws.com/elevation-tiles-prod/terrarium', links: [['AWS Terrain Tiles', 'https://registry.opendata.aws/terrain-tiles/']] },
      { name: 'OpenFreeMap · OpenStreetMap', by: 'OpenFreeMap · OpenStreetMap contributors', use: T('3D buildings, streets, city names and map fonts (vector tiles).', 'Prédios em 3D, ruas, nomes de cidades e fontes do mapa (tiles vetoriais).', 'Edificios en 3D, calles, nombres de ciudades y fuentes del mapa (mosaicos vectoriales).'), calls: 'tiles.openfreemap.org/planet · tiles.openfreemap.org/fonts', links: [['OpenFreeMap', 'https://openfreemap.org'], ['OpenStreetMap copyright', 'https://www.openstreetmap.org/copyright']] },
    ],
  },
  {
    id: 'services', title: T('Other services (from the browser)', 'Outros serviços (direto do navegador)', 'Otros servicios (desde el navegador)'),
    note: T('Each of these receives only what it needs: the wind request carries a grid of coordinates, the search carries the text you type.', 'Cada um recebe só o que precisa: o pedido de vento leva uma grade de coordenadas, a busca leva o texto que você digita.', 'Cada uno recibe solo lo que necesita: la solicitud de viento lleva una cuadrícula de coordenadas, la búsqueda lleva el texto que escribes.'),
    items: [
      { name: 'Open-Meteo', by: 'Open-Meteo', use: T('Wind speed and direction at 850 hPa for the current hour, from weather models, on an 80-point grid of 4°. It is model output, not a measurement; if it is unreachable a typical trade-wind field is drawn and labeled as such.', 'Velocidade e direção do vento a 850 hPa para a hora atual, de modelos de previsão do tempo, numa grade de 80 pontos de 4°. É saída de modelo, não medição; se estiver inacessível, desenha-se um campo típico de ventos alísios, rotulado como tal.', 'Velocidad y dirección del viento a 850 hPa para la hora actual, de modelos meteorológicos, en una cuadrícula de 80 puntos de 4°. Es salida de modelo, no una medición; si no está disponible se dibuja un campo típico de vientos alisios, rotulado como tal.'), calls: 'api.open-meteo.com/v1/forecast (wind_speed_850hPa, wind_direction_850hPa)', links: [['Open-Meteo documentation', 'https://open-meteo.com/en/docs'], ['Open-Meteo', 'https://open-meteo.com']] },
      { name: 'Nominatim', by: 'OpenStreetMap Foundation', use: T('Place search (only the text typed in the search box is sent, after a pause in typing).', 'Busca de lugares (só o texto digitado na caixa de busca é enviado, após uma pausa na digitação).', 'Búsqueda de lugares (solo se envía el texto escrito en el cuadro de búsqueda, tras una pausa al teclear).'), calls: 'nominatim.openstreetmap.org/search', links: [['Search API', 'https://nominatim.org/release-docs/latest/api/Search/'], ['Usage policy', 'https://operations.osmfoundation.org/policies/nominatim/']] },
      { name: 'Claude API (optional)', by: 'Anthropic', use: T('Answers open questions in the AI bar, only from what the map shows. Off unless the backend has an ANTHROPIC_API_KEY.', 'Responde perguntas abertas na barra de IA, só a partir do que o mapa mostra. Desligado se o backend não tiver ANTHROPIC_API_KEY.', 'Responde preguntas abiertas en la barra de IA, solo a partir de lo que muestra el mapa. Apagado si el backend no tiene ANTHROPIC_API_KEY.'), calls: 'through the SARIS API (POST /assistant)', links: [['Anthropic documentation', 'https://docs.anthropic.com']] },
    ],
  },
  {
    id: 'software', title: T('Our software and libraries', 'Nosso software e bibliotecas', 'Nuestro software y bibliotecas'),
    note: T('The SARIS API is an HTTP API (FastAPI) at the address the page is configured with (VITE_API_URL, default http://127.0.0.1:8000); its interactive documentation is at /docs.', 'A API do SARIS é uma API HTTP (FastAPI) no endereço com que a página está configurada (VITE_API_URL, padrão http://127.0.0.1:8000); a documentação interativa fica em /docs.', 'La API de SARIS es una API HTTP (FastAPI) en la dirección con que está configurada la página (VITE_API_URL, por defecto http://127.0.0.1:8000); su documentación interactiva está en /docs.'),
    items: [
      { name: 'SARIS API (asf-cleaner)', by: 'SARIS team', use: T('Searches ASF, reads and cleans the scenes, reads IMERG, trains and runs the forecast and the risk model, and serves it all as JSON and Server-Sent Events.', 'Busca no ASF, lê e limpa as cenas, lê o IMERG, treina e roda a previsão e o modelo de risco, e serve tudo em JSON e Server-Sent Events.', 'Busca en ASF, lee y limpia las escenas, lee IMERG, entrena y ejecuta el pronóstico y el modelo de riesgo, y lo sirve todo en JSON y Server-Sent Events.'), calls: '/series/stream · /rain/stream · /forecast/stream · /regions · /health · /assistant', links: [['Backend repository', 'https://github.com/luiz-fleal/asf-cleaner']] },
      { name: 'SARIS observatory', by: 'SARIS team', use: T('This web app (React, TypeScript, Vite).', 'Este aplicativo web (React, TypeScript, Vite).', 'Esta aplicación web (React, TypeScript, Vite).'), calls: '—', links: [['Frontend repository', 'https://github.com/cspatric/Nasa-Spaces-Apps']] },
      { name: 'MapLibre GL JS · three.js · scikit-learn', by: 'open source', use: T('The 3D map, the 3D space scenes in the presentations, and the forecast and land-cover models.', 'O mapa 3D, as cenas espaciais 3D das apresentações, e os modelos de previsão e cobertura do solo.', 'El mapa 3D, las escenas espaciales 3D de las presentaciones, y los modelos de pronóstico y cobertura del suelo.'), calls: '—', links: [['MapLibre', 'https://maplibre.org'], ['three.js', 'https://threejs.org'], ['scikit-learn', 'https://scikit-learn.org']] },
      { name: 'NASA Space Apps Challenge 2026', by: 'NASA', use: T('"Dancing with the SARs": the challenge this project answers.', '"Dancing with the SARs": o desafio a que este projeto responde.', '"Dancing with the SARs": el desafío al que responde este proyecto.'), calls: '—', links: [['Space Apps Challenge', 'https://www.spaceappschallenge.org']] },
    ],
  },
]

const NAV = [
  ['numbers', T('Numbers', 'Números', 'Números')], ['data', T('Data', 'Dados', 'Datos')], ['pipeline', T('Pipeline', 'Pipeline', 'Pipeline')],
  ['models', T('Models', 'Modelos', 'Modelos')], ['land', T('Land cover', 'Cobertura', 'Cobertura')], ['limits', T('Limits', 'Limites', 'Límites')], ['sources', T('Sources', 'Fontes', 'Fuentes')],
] as const

function Rows({ rows }: { rows: { k: ReturnType<typeof T>; v: ReturnType<typeof T> }[] }) {
  const tx = useTx()
  return <dl className="tx-rows">{rows.map((r, i) => <Fragment key={i}><dt>{tx(r.k)}</dt><dd>{tx(r.v)}</dd></Fragment>)}</dl>
}

export default function TechnicalPage() {
  const { lang, setLang } = useI18n()
  const tx = useTx()
  useEffect(() => { document.title = 'SARIS · ' + tx(T('Data and methods', 'Dados e métodos', 'Datos y métodos')) }, [lang]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="tech">
      <header className="tx-top">
        <div className="tx-id"><Logo size={22} /><b>SARIS</b><span>{tx(T('Data and methods', 'Dados e métodos', 'Datos y métodos'))}</span></div>
        <nav aria-label="Sections">{NAV.map(([id, l]) => <a key={id} href={`#${id}`}>{tx(l)}</a>)}</nav>
        <div className="tx-rt">
          <div className="tx-lang" role="group" aria-label="Language">
            {LANGS.map((l) => <button key={l.id} className={lang === l.id ? 'on' : ''} title={l.name} onClick={() => setLang(l.id)}>{l.label}</button>)}
          </div>
          <Link to="/mapa" className="tx-open">{tx(T('Open the map', 'Abrir o mapa', 'Abrir el mapa'))} →</Link>
        </div>
      </header>

      <main>
        <section className="tx-hero">
          <p className="tx-kick">{tx(T('Technical record', 'Registro técnico', 'Registro técnico'))}</p>
          <h1>{tx(T('What is under the map, and how far to trust it', 'O que há por baixo do mapa, e até onde confiar', 'Qué hay bajo el mapa, y hasta dónde confiar'))}</h1>
          <p className="tx-lead">{tx(T('SARIS reads radar and rain from NASA archives on demand, cleans them, learns the history of each place and projects it to 2030 with an honest error band. This page lists every product, parameter and limit, so that anyone can check the work.', 'O SARIS lê radar e chuva dos arquivos da NASA sob demanda, limpa, aprende o histórico de cada lugar e projeta até 2030 com uma faixa de erro honesta. Esta página lista cada produto, parâmetro e limite, para que qualquer pessoa possa conferir o trabalho.', 'SARIS lee radar y lluvia de los archivos de la NASA bajo demanda, los limpia, aprende el historial de cada lugar y lo proyecta a 2030 con una banda de error honesta. Esta página lista cada producto, parámetro y límite, para que cualquiera pueda verificar el trabajo.'))}</p>
        </section>

        <section id="numbers" className="tx-sec">
          <h2>{tx(T('The numbers', 'Os números', 'Los números'))}</h2>
          <div className="tx-stats">
            {STATS.map((s) => <div key={s.v + s.l.en} className="tx-stat"><b>{s.v}</b><span>{tx(s.l)}</span><small>{tx(s.n)}</small></div>)}
          </div>
          <p className="tx-note">{tx(T('Test = places the model never saw, in years it never saw (trained up to 2022, tested from 2023), mean over 16 rounds with a different random choice of test places each time; spread 8.6 points, worst round 66 %, best 100 %. 51 reference places, 337 place-years, four classes: forest, other vegetation, city, open water.', 'Teste = lugares que o modelo nunca viu, em anos que nunca viu (treino até 2022, teste de 2023 em diante), média de 16 rodadas com escolha aleatória diferente de lugares de teste a cada vez; desvio de 8,6 pontos, pior rodada 66 %, melhor 100 %. 51 lugares de referência, 337 amostras lugar-ano, quatro classes: floresta, outra vegetação, cidade, água aberta.', 'Prueba = lugares que el modelo nunca vio, en años que nunca vio (entrenado hasta 2022, probado desde 2023), media de 16 rondas con una elección aleatoria distinta de lugares de prueba cada vez; dispersión de 8,6 puntos, peor ronda 66 %, mejor 100 %. 51 lugares de referencia, 337 muestras lugar-año, cuatro clases: bosque, otra vegetación, ciudad, agua abierta.'))}</p>
        </section>

        <section id="data" className="tx-sec">
          <h2>{tx(T('Data products', 'Produtos de dados', 'Productos de datos'))}</h2>
          <div className="tx-table" role="table">
            <div className="tx-tr tx-th" role="row"><span>{tx(T('Product', 'Produto', 'Producto'))}</span><span>{tx(T('Provider', 'Fonte', 'Fuente'))}</span><span>{tx(T('How we use it', 'Como usamos', 'Cómo lo usamos'))}</span></div>
            {DATA.map((d) => <div key={d.name} className="tx-tr" role="row"><b>{d.name}</b><span className="tx-who">{d.who}</span><span>{tx(d.spec)}</span></div>)}
          </div>
        </section>

        <section id="pipeline" className="tx-sec">
          <h2>{tx(T('From scene to series', 'Da cena à série', 'De la escena a la serie'))}</h2>
          <ol className="tx-pipe">{PIPE.map((p, i) => <li key={i}><b>{String(i + 1).padStart(2, '0')} · {tx(p.t)}</b><span>{tx(p.d)}</span></li>)}</ol>
          <h3>{tx(T('How a series is read', 'Como uma série é lida', 'Cómo se lee una serie'))}</h3>
          <Rows rows={SPEC} />
        </section>

        <section id="models" className="tx-sec">
          <h2>{tx(T('Forecast to 2030', 'Previsão até 2030', 'Pronóstico a 2030'))}</h2>
          <Rows rows={MODELS} />
          <h3>{tx(T('Four risk signals', 'Quatro sinais de risco', 'Cuatro señales de riesgo'))}</h3>
          <p className="tx-note">{tx(T('Each has a score from 0 to 1 and a level (low below 0.3, moderate below 0.6, high from 0.6) with the evidence behind it. Everything is learned from the place’s own history, never compared with another place’s numbers.', 'Cada um tem uma nota de 0 a 1 e um nível (baixo abaixo de 0,3, moderado abaixo de 0,6, alto a partir de 0,6) com a evidência por trás. Tudo é aprendido do histórico do próprio lugar, nunca comparado com números de outro lugar.', 'Cada una tiene una nota de 0 a 1 y un nivel (bajo menos de 0,3, moderado menos de 0,6, alto desde 0,6) con la evidencia detrás. Todo se aprende del historial del propio lugar, nunca se compara con números de otro lugar.'))}</p>
          <Rows rows={RISKS} />
        </section>

        <section id="land" className="tx-sec">
          <h2>{tx(T('Land-cover model and its test', 'Modelo de cobertura e seu teste', 'Modelo de cobertura y su prueba'))}</h2>
          <Rows rows={[
            { k: T('Why', 'Por quê', 'Por qué'), v: T('decides which risks make sense: vegetation loss is meaningless over a city, drought over a lake', 'decide quais riscos fazem sentido: perda de vegetação não faz sentido numa cidade, seca num lago', 'decide qué riesgos tienen sentido: pérdida de vegetación no tiene sentido en una ciudad, sequía en un lago') },
            { k: T('Features', 'Características', 'Características'), v: T('monthly VV and VH history from 2019 and, when reachable, the color of the Sentinel-2 mosaic around the place', 'histórico mensal de VV e VH desde 2019 e, quando disponível, a cor do mosaico Sentinel-2 em torno do lugar', 'historial mensual de VV y VH desde 2019 y, cuando está disponible, el color del mosaico Sentinel-2 alrededor del lugar') },
            { k: T('Baseline first', 'Referência primeiro', 'Referencia primero'), v: T('a depth-2 decision tree on mean VV and VH; the model is used only if it beats it', 'uma árvore de decisão de profundidade 2 em VV e VH médios; o modelo só é usado se a vencer', 'un árbol de decisión de profundidad 2 sobre VV y VH medios; el modelo solo se usa si lo supera') },
            { k: T('No leakage', 'Sem vazamento', 'Sin fuga'), v: T('no random split of rows: test places and years are held out; scales are fitted on the training part only; settings are chosen by cross-validation grouped by place', 'sem divisão aleatória de linhas: lugares e anos de teste ficam de fora; as escalas são ajustadas só na parte de treino; as configurações são escolhidas por validação cruzada agrupada por lugar', 'sin división aleatoria de filas: los lugares y años de prueba quedan fuera; las escalas se ajustan solo con la parte de entrenamiento; los ajustes se eligen por validación cruzada agrupada por lugar') },
            { k: T('Search', 'Busca', 'Búsqueda'), v: T('five model families and three feature sets tuned in every round; the winner was logistic regression on radar + ground color', 'cinco famílias de modelos e três conjuntos de características ajustados em cada rodada; a vencedora foi regressão logística em radar + cor do solo', 'cinco familias de modelos y tres conjuntos de características ajustados en cada ronda; la ganadora fue regresión logística con radar + color del suelo') },
          ]} />
        </section>

        <section id="limits" className="tx-sec">
          <h2>{tx(T('Limits we state ourselves', 'Limites que nós mesmos declaramos', 'Límites que declaramos nosotros'))}</h2>
          <ul className="tx-limits">{LIMITS.map((l, i) => <li key={i}>{tx(l)}</li>)}</ul>
        </section>

        <section id="sources" className="tx-sec">
          <h2>{tx(T('Sources', 'Fontes', 'Fuentes'))}</h2>
          <p className="tx-note">{tx(T('Every outside source the project reads, the address it calls, and where to read about it. Nothing here is invented or preloaded: radar and rain are read from NASA on demand.', 'Toda fonte externa que o projeto lê, o endereço que ele chama e onde ler sobre ela. Nada aqui é inventado nem pré-carregado: radar e chuva são lidos da NASA sob demanda.', 'Toda fuente externa que lee el proyecto, la dirección que llama y dónde leer sobre ella. Nada aquí es inventado ni precargado: radar y lluvia se leen de la NASA bajo demanda.'))}</p>
          <div className="tx-flow" aria-label="Data flow">
            <span>{tx(T('Browser', 'Navegador', 'Navegador'))}</span><i>→</i><span>{tx(T('SARIS API', 'API do SARIS', 'API de SARIS'))}</span><i>→</i><span>ASF · GES DISC · CMR</span>
            <em>{tx(T('radar, rain, forecast, risk', 'radar, chuva, previsão, risco', 'radar, lluvia, pronóstico, riesgo'))}</em>
            <span>{tx(T('Browser', 'Navegador', 'Navegador'))}</span><i>→</i><span>GIBS · EOX · AWS · OpenFreeMap · Open-Meteo · Nominatim</span>
            <em>{tx(T('map tiles, wind, place search', 'tiles do mapa, vento, busca de lugares', 'mosaicos del mapa, viento, búsqueda de lugares'))}</em>
          </div>
          {SOURCE_GROUPS.map((g) => (
            <div key={g.id} className="tx-grp">
              <h3>{tx(g.title)}</h3>
              <p className="tx-note">{tx(g.note)}</p>
              <ul className="tx-srcs">
                {g.items.map((it) => (
                  <li key={it.name}>
                    <div className="tx-sh"><b>{it.name}</b><span>{it.by}</span></div>
                    <p>{tx(it.use)}</p>
                    <code>{it.calls}</code>
                    <div className="tx-links">{it.links.map(([n, u]) => <a key={u} href={u} target="_blank" rel="noreferrer">{n} ↗</a>)}</div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <p className="tx-note">{tx(T('Built for the NASA Space Apps Challenge 2026, "Dancing with the SARs". Not an official NASA product; NASA does not endorse it.', 'Feito para o NASA Space Apps Challenge 2026, "Dancing with the SARs". Não é um produto oficial da NASA; a NASA não o endossa.', 'Hecho para el NASA Space Apps Challenge 2026, "Dancing with the SARs". No es un producto oficial de la NASA; la NASA no lo respalda.'))}</p>
        </section>
      </main>
    </div>
  )
}
