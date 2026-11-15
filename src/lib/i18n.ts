import { createContext, useContext } from 'react'
import { STORY_ES, STORY_PT } from './storyText'

export type Lang = 'en' | 'pt' | 'es'
export const LANGS: { id: Lang; label: string; locale: string; name: string }[] = [
  { id: 'en', label: 'EN', locale: 'en-GB', name: 'English' },
  { id: 'pt', label: 'PT', locale: 'pt-BR', name: 'Português' },
  { id: 'es', label: 'ES', locale: 'es-ES', name: 'Español' },
]

/** English text is the key; a missing entry simply shows the English text. */
const PT: Record<string, string> = {
  // top bar
  Layers: 'Camadas', Inspector: 'Inspetor', Capitals: 'Capitais', 'Camera presets': 'Atalhos de câmera', Language: 'Idioma',
  'Search a city or place': 'Buscar cidade ou lugar', 'No results': 'Sem resultados', 'Searching…': 'Buscando…', Searching: 'Buscando',
  Amazon: 'Amazônia', Andes: 'Andes', Overview: 'Visão geral', 'Rio Grande do Sul': 'Rio Grande do Sul',
  // layer panel
  'Base map': 'Mapa base', 'NASA layers': 'Camadas NASA', Terrain: 'Relevo', Simulation: 'Simulação',
  Satellite: 'Satélite', 'Blue Marble': 'Blue Marble', Daily: 'Diário', 'Daily true color': 'Cor real diária',
  'Sentinel-2 cloudless mosaic, 10 m': 'Mosaico Sentinel-2 sem nuvens, 10 m', 'Shaded relief, static': 'Relevo sombreado, estático',
  'MODIS and VIIRS, follows the timeline': 'MODIS e VIIRS, segue a linha do tempo',
  'NISAR backscatter': 'Retroespalhamento NISAR', 'GCOV, L-band, 2025 onward': 'GCOV, banda L, de 2025 em diante',
  'Surface water': 'Água superficial', 'OPERA DSWx, 30 m': 'OPERA DSWx, 30 m',
  'Vegetation loss alerts': 'Alertas de perda de vegetação', 'OPERA DIST-ALERT, 30 m': 'OPERA DIST-ALERT, 30 m',
  'Rain rate': 'Taxa de chuva', 'GPM IMERG, daily': 'GPM IMERG, diário',
  'Land surface temperature': 'Temperatura da superfície', 'VIIRS NOAA-21, daily 1 km': 'VIIRS NOAA-21, diário, 1 km',
  'Soil moisture': 'Umidade do solo', 'SMAP L4, daily': 'SMAP L4, diário',
  '3D buildings and streets': 'Prédios e ruas em 3D', 'OpenStreetMap, visible close to cities': 'OpenStreetMap, visível perto das cidades',
  'City names': 'Nomes das cidades', Exaggeration: 'Exagero vertical', 'Terrain exaggeration': 'Exagero vertical do relevo',
  'Flood scenario': 'Cenário de cheia', 'Water level': 'Nível da água', 'Water level computed from the elevation model, near Manaus': 'Nível da água calculado a partir do modelo de elevação, perto de Manaus',
  'Storm cell': 'Célula de tempestade', '3D clouds over the selected point': 'Nuvens 3D sobre o ponto selecionado',
  'Simulation, not a forecast': 'Simulação, não é previsão', 'Simulation: storm cell': 'Simulação: célula de tempestade',
  // hud / timeline
  'Zoom in': 'Aproximar', 'Zoom out': 'Afastar', 'North up': 'Norte para cima', 'Toggle 3D tilt': 'Alternar inclinação 3D', 'Tilt the camera for a 3D view': 'Inclina a câmera para a vista 3D',
  Play: 'Reproduzir', Pause: 'Pausar', Date: 'Data', 'Overview map': 'Mapa geral',
  'C-band · OPERA': 'Banda C · OPERA', 'L-band · NISAR': 'Banda L · NISAR', 'Scenario · simulation': 'Cenário · simulação', ' · latest imagery': ' · imagem mais recente',
  'C-band, OPERA': 'Banda C, OPERA', 'L-band, NISAR': 'Banda L, NISAR', 'Scenarios (simulation)': 'Cenários (simulação)',
  // inspector
  Point: 'Ponto', Save: 'Salvar', Clear: 'Limpar', 'Click the map or search a city.': 'Clique no mapa ou busque uma cidade.',
  'L-band': 'Banda L', 'C-band': 'Banda C', Rain: 'Chuva', 'reading…': 'lendo…', unavailable: 'indisponível', 'no data': 'sem dados', 'no scene near this date': 'sem cena perto desta data',
  'NASA GPM IMERG daily total, 0.1 degree cell': 'Total diário NASA GPM IMERG, célula de 0,1 grau',
  '{done} of {total} scenes': '{done} de {total} cenas', '{done} of {total} scenes, {cached} cached': '{done} de {total} cenas, {cached} em cache',
  '{done} of {total} days': '{done} de {total} dias', '{done} of {total} days, {cached} cached': '{done} de {total} dias, {cached} em cache', 'Searching ASF…': 'Buscando no ASF…',
  'No scenes near this date.': 'Nenhuma cena perto desta data.', '{n} scene(s) could not be read.': '{n} cena(s) não puderam ser lidas.',
  Pins: 'Pins', Insights: 'Análises', 'Remove {name}': 'Remover {name}', 'Pin {n}': 'Pin {n}',
  'Radar {pol} on {date} is {delta} dB against the median of the {n} loaded scenes.': 'Radar {pol} em {date} está {delta} dB em relação à mediana das {n} cenas carregadas.',
  'Rain in the 30 days before: {total} mm, {delta}% against the previous {months} months.': 'Chuva nos 30 dias anteriores: {total} mm, {delta}% em relação aos {months} meses anteriores.',
  'Rain in the 30 days before: {total} mm.': 'Chuva nos 30 dias anteriores: {total} mm.',
  'Wettest day in that period: {mm} mm on {date}.': 'Dia mais chuvoso desse período: {mm} mm em {date}.',
  'Backscatter series': 'Série de retroespalhamento', 'Backend not reachable at {url}. Start it with: uv run asf-api': 'Backend inacessível em {url}. Inicie com: uv run asf-api',
  'Loading imagery…': 'Carregando imagens…', 'No observed data in a scenario period': 'Sem dados observados em período de cenário', 'No data for this period': 'Sem dados neste período',
  'Forecast and risks to 2030': 'Previsão e riscos até 2030', 'Risks need both polarizations and at least 30 months of data.': 'Os riscos precisam das duas polarizações e de pelo menos 30 meses de dados.',
  'Vegetation loss': 'Perda de vegetação', Flood: 'Enchente', 'Drought and fire': 'Seca e queimada', 'Unusual change': 'Mudança incomum', Low: 'Baixo', Moderate: 'Moderado', High: 'Alto', 'Not applicable': 'Não se aplica',
  'Land cover': 'Cobertura do solo', Forest: 'Floresta', 'Other vegetation': 'Outra vegetação', City: 'Cidade', 'Open water': 'Água aberta',
  'Cross-polarization backscatter fell {db} dB around {date} and stayed lower.': 'O retroespalhamento em polarização cruzada caiu {db} dB por volta de {date} e continuou mais baixo.',
  'Cross-polarization backscatter rose {db} dB around {date}.': 'O retroespalhamento em polarização cruzada subiu {db} dB por volta de {date}.',
  'No lasting change in cross-polarization backscatter.': 'Nenhuma mudança duradoura no retroespalhamento em polarização cruzada.',
  'The forecast keeps falling by {db} dB per decade.': 'A previsão segue caindo {db} dB por década.',
  'Not enough history to look for a change.': 'Histórico insuficiente para buscar uma mudança.',
  '{pct}% of the months looked flooded in the radar.': '{pct}% dos meses pareciam alagados no radar.', 'The place is a floodplain.': 'O local é uma várzea.',
  'Rain of the last 3 months is {z} standard deviations above normal.': 'A chuva dos últimos 3 meses está {z} desvios padrão acima do normal.',
  'The forecast wet season peaks at {pct}% of the wettest past years.': 'O pico da estação chuvosa prevista é {pct}% dos anos mais chuvosos do passado.',
  'No sign of flooding in the history or in the rain.': 'Sem sinal de alagamento no histórico nem na chuva.',
  'Not enough rain history.': 'Histórico de chuva insuficiente.',
  'Rain of the last 3 months is {z} standard deviations below normal.': 'A chuva dos últimos 3 meses está {z} desvios padrão abaixo do normal.',
  'The next 6 months are forecast {pct}% drier than the same months of the past.': 'Os próximos 6 meses devem ser {pct}% mais secos que os mesmos meses do passado.',
  'Rain is normal or above, now and in the forecast.': 'A chuva está normal ou acima, agora e na previsão.',
  'Not enough history to find unusual months.': 'Histórico insuficiente para achar meses incomuns.',
  '{n} of the last 12 months look unlike the rest of the history.': '{n} dos últimos 12 meses não se parecem com o resto do histórico.',
  'The last 12 months look like the rest of the history.': 'Os últimos 12 meses se parecem com o resto do histórico.',
  'Natural disasters': 'Desastres naturais', Earthquake: 'Terremoto', Wildfire: 'Incêndio florestal', Storm: 'Tempestade', Magnitude: 'Magnitude', Depth: 'Profundidade', 'Water rise': 'Subida da água',
  Duration: 'Duração', Wind: 'Vento', 'Wind from': 'Vento de', 'Fuel dryness': 'Secura do combustível', 'Peak gust': 'Rajada máxima', 'Track direction': 'Direção da trajetória',
  "Use this point's drought risk ({v})": 'Usar o risco de seca deste ponto ({v})', 'Length to width {r}': 'Comprimento / largura {r}',
  'Simulate here': 'Simular aqui', 'Simulate at the center': 'Simular no centro', buildings: 'prédios',
  'Zoom in to count the buildings in each zone.': 'Aproxime para contar os prédios de cada zona.', 'Sound on': 'Som ligado', 'Sound off': 'Som desligado',
  'Destructive (MMI IX or more)': 'Destruição (MMI IX ou mais)', 'Heavy damage (MMI VII to VIII)': 'Danos graves (MMI VII a VIII)', 'Moderate damage (MMI VI)': 'Danos moderados (MMI VI)', 'Felt, light damage (MMI V)': 'Sentido, danos leves (MMI V)',
  'Embers and smoke zone': 'Zona de brasas e fumaça', 'Burned area': 'Área queimada', 'Damaging wind (90 km/h or more)': 'Vento danoso (90 km/h ou mais)', 'Severe wind (120 km/h or more)': 'Vento severo (120 km/h ou mais)', 'Destructive wind (170 km/h or more)': 'Vento destrutivo (170 km/h ou mais)',
  'Flooded land (below the water level)': 'Terra alagada (abaixo do nível da água)',
  Data: 'Dados', Forecast: 'Previsão', Regions: 'Regiões', Area: 'Área', 'Selection mode': 'Modo de seleção', 'Drag a rectangle on the map.': 'Arraste um retângulo no mapa.',
  'Centered at {lat}, {lon}. Radar window {m} m; rain is the IMERG cell of the center.': 'Centro em {lat}, {lon}. Janela do radar de {m} m; a chuva é a célula IMERG do centro.',
  'Sample places': 'Lugares amostrados', 'Riskiest place': 'Lugar mais arriscado', 'Run forecast again': 'Gerar a previsão de novo', 'Try the forecast again': 'Tentar a previsão de novo', 'Map year': 'Ano no mapa', Close: 'Fechar', 'ready-made': 'pronta',
  'The first forecast of a place reads years of satellite scenes; the next ones are instant.': 'A primeira previsão de um lugar lê anos de cenas de satélite; as próximas são instantâneas.',
  'Learns from this place since 2016 and projects radar and rain to 2030. The button below starts it.': 'Aprende com este lugar desde 2016 e projeta radar e chuva até 2030. O botão abaixo inicia.',
  'Select a point or an area on the map, or open a ready-made region.': 'Selecione um ponto ou uma área no mapa, ou abra uma região pronta.',
  'Forecasts computed ahead for whole regions: nothing to wait for.': 'Previsões calculadas antes para regiões inteiras: sem espera.', 'The backend has no regions yet.': 'O backend ainda não tem regiões.',
  '{n} sample places': '{n} lugares amostrados', 'being prepared': 'em preparo', '3D view': 'Vista 3D', '{n} on': '{n} ligadas', 'none on': 'nenhuma ligada', '{n} of 2 on': '{n} de 2 ligados', running: 'em andamento', simulations: 'simulações',
  'Average of {n} sample places spread over the region.': 'Média de {n} lugares amostrados pela região.',
  'Drag a rectangle on the map. Esc cancels.': 'Arraste um retângulo no mapa. Esc cancela.', 'Select area': 'Selecionar área', 'Select area (or hold Shift and drag)': 'Selecionar área (ou segure Shift e arraste)',
  // forecast
  'Forecast to 2030': 'Previsão até 2030', 'Learns from this point since 2016 and projects radar and rain to 2030.': 'Aprende com o histórico deste ponto desde 2016 e projeta radar e chuva até 2030.',
  'Run forecast': 'Gerar previsão', 'Searching radar scenes…': 'Buscando cenas de radar…', 'Reading radar history': 'Lendo histórico do radar', 'Reading monthly rain': 'Lendo chuva mensal',
  'Reading recent rain': 'Lendo chuva recente', 'Training the model…': 'Treinando o modelo…', 'Working…': 'Processando…', Radar: 'Radar', 'Rain (mm/month)': 'Chuva (mm/mês)',
  reliable: 'confiável', weak: 'fraca', Model: 'Modelo', error: 'erro', decade: 'década',
  '{n}% better than last year': '{n}% melhor que repetir o ano anterior', '{n}% worse than last year': '{n}% pior que repetir o ano anterior',
  '{a} radar scenes, {b} months of rain. Band: 80 %. Forecast until {date}.': '{a} cenas de radar, {b} meses de chuva. Faixa: 80 %. Previsão até {date}.',
  'Future rain is unknown: the backscatter forecast assumes normal rain.': 'A chuva futura é desconhecida: a previsão do radar assume chuva normal.',
  'The 80 % band comes from backtest errors and widens with the years ahead; it does not include events not yet seen.': 'A faixa de 80 % vem dos erros do teste retroativo e aumenta com os anos; não inclui eventos ainda não vistos.',
  // credits
  'Sentinel-2 cloudless © EOX · NASA GIBS, GPM IMERG · ASF NISAR and OPERA · AWS Terrain Tiles · © OpenStreetMap contributors · MapLibre': 'Sentinel-2 cloudless © EOX · NASA GIBS · ASF NISAR e OPERA · AWS Terrain Tiles · © colaboradores do OpenStreetMap · MapLibre',
}

const ES: Record<string, string> = {
  Layers: 'Capas', Inspector: 'Inspector', Capitals: 'Capitales', 'Camera presets': 'Atajos de cámara', Language: 'Idioma',
  'Search a city or place': 'Buscar ciudad o lugar', 'No results': 'Sin resultados', 'Searching…': 'Buscando…', Searching: 'Buscando',
  Amazon: 'Amazonía', Andes: 'Andes', Overview: 'Vista general', 'Rio Grande do Sul': 'Rio Grande do Sul',
  'Base map': 'Mapa base', 'NASA layers': 'Capas NASA', Terrain: 'Relieve', Simulation: 'Simulación',
  Satellite: 'Satélite', 'Blue Marble': 'Blue Marble', Daily: 'Diario', 'Daily true color': 'Color real diario',
  'Sentinel-2 cloudless mosaic, 10 m': 'Mosaico Sentinel-2 sin nubes, 10 m', 'Shaded relief, static': 'Relieve sombreado, estático',
  'MODIS and VIIRS, follows the timeline': 'MODIS y VIIRS, sigue la línea de tiempo',
  'NISAR backscatter': 'Retrodispersión NISAR', 'GCOV, L-band, 2025 onward': 'GCOV, banda L, desde 2025',
  'Surface water': 'Agua superficial', 'OPERA DSWx, 30 m': 'OPERA DSWx, 30 m',
  'Vegetation loss alerts': 'Alertas de pérdida de vegetación', 'OPERA DIST-ALERT, 30 m': 'OPERA DIST-ALERT, 30 m',
  'Rain rate': 'Tasa de lluvia', 'GPM IMERG, daily': 'GPM IMERG, diario',
  'Land surface temperature': 'Temperatura de la superficie', 'VIIRS NOAA-21, daily 1 km': 'VIIRS NOAA-21, diario, 1 km',
  'Soil moisture': 'Humedad del suelo', 'SMAP L4, daily': 'SMAP L4, diario',
  '3D buildings and streets': 'Edificios y calles en 3D', 'OpenStreetMap, visible close to cities': 'OpenStreetMap, visible cerca de las ciudades',
  'City names': 'Nombres de ciudades', Exaggeration: 'Exageración vertical', 'Terrain exaggeration': 'Exageración vertical del relieve',
  'Flood scenario': 'Escenario de inundación', 'Water level': 'Nivel del agua', 'Water level computed from the elevation model, near Manaus': 'Nivel del agua calculado con el modelo de elevación, cerca de Manaos',
  'Storm cell': 'Celda de tormenta', '3D clouds over the selected point': 'Nubes 3D sobre el punto seleccionado',
  'Simulation, not a forecast': 'Simulación, no es un pronóstico', 'Simulation: storm cell': 'Simulación: celda de tormenta',
  'Zoom in': 'Acercar', 'Zoom out': 'Alejar', 'North up': 'Norte arriba', 'Toggle 3D tilt': 'Alternar inclinación 3D', 'Tilt the camera for a 3D view': 'Inclina la cámara para la vista 3D',
  Play: 'Reproducir', Pause: 'Pausar', Date: 'Fecha', 'Overview map': 'Mapa general',
  'C-band · OPERA': 'Banda C · OPERA', 'L-band · NISAR': 'Banda L · NISAR', 'Scenario · simulation': 'Escenario · simulación', ' · latest imagery': ' · imagen más reciente',
  'C-band, OPERA': 'Banda C, OPERA', 'L-band, NISAR': 'Banda L, NISAR', 'Scenarios (simulation)': 'Escenarios (simulación)',
  Point: 'Punto', Save: 'Guardar', Clear: 'Borrar', 'Click the map or search a city.': 'Haz clic en el mapa o busca una ciudad.',
  'L-band': 'Banda L', 'C-band': 'Banda C', Rain: 'Lluvia', 'reading…': 'leyendo…', unavailable: 'no disponible', 'no data': 'sin datos', 'no scene near this date': 'sin escena cerca de esta fecha',
  'NASA GPM IMERG daily total, 0.1 degree cell': 'Total diario NASA GPM IMERG, celda de 0,1 grado',
  '{done} of {total} scenes': '{done} de {total} escenas', '{done} of {total} scenes, {cached} cached': '{done} de {total} escenas, {cached} en caché',
  '{done} of {total} days': '{done} de {total} días', '{done} of {total} days, {cached} cached': '{done} de {total} días, {cached} en caché', 'Searching ASF…': 'Buscando en ASF…',
  'No scenes near this date.': 'Ninguna escena cerca de esta fecha.', '{n} scene(s) could not be read.': 'No se pudieron leer {n} escena(s).',
  Pins: 'Pines', Insights: 'Análisis', 'Remove {name}': 'Quitar {name}', 'Pin {n}': 'Pin {n}',
  'Radar {pol} on {date} is {delta} dB against the median of the {n} loaded scenes.': 'Radar {pol} el {date} está {delta} dB respecto a la mediana de las {n} escenas cargadas.',
  'Rain in the 30 days before: {total} mm, {delta}% against the previous {months} months.': 'Lluvia en los 30 días anteriores: {total} mm, {delta}% respecto a los {months} meses previos.',
  'Rain in the 30 days before: {total} mm.': 'Lluvia en los 30 días anteriores: {total} mm.',
  'Wettest day in that period: {mm} mm on {date}.': 'Día más lluvioso de ese período: {mm} mm el {date}.',
  'Backscatter series': 'Serie de retrodispersión', 'Backend not reachable at {url}. Start it with: uv run asf-api': 'Backend inaccesible en {url}. Inícialo con: uv run asf-api',
  'Loading imagery…': 'Cargando imágenes…', 'No observed data in a scenario period': 'Sin datos observados en un período de escenario', 'No data for this period': 'Sin datos en este período',
  'Forecast and risks to 2030': 'Pronóstico y riesgos a 2030', 'Risks need both polarizations and at least 30 months of data.': 'Los riesgos necesitan las dos polarizaciones y al menos 30 meses de datos.',
  'Vegetation loss': 'Pérdida de vegetación', Flood: 'Inundación', 'Drought and fire': 'Sequía e incendio', 'Unusual change': 'Cambio inusual', Low: 'Bajo', Moderate: 'Moderado', High: 'Alto', 'Not applicable': 'No aplica',
  'Land cover': 'Cobertura del suelo', Forest: 'Bosque', 'Other vegetation': 'Otra vegetación', City: 'Ciudad', 'Open water': 'Agua abierta',
  'Cross-polarization backscatter fell {db} dB around {date} and stayed lower.': 'La retrodispersión en polarización cruzada cayó {db} dB hacia {date} y siguió más baja.',
  'Cross-polarization backscatter rose {db} dB around {date}.': 'La retrodispersión en polarización cruzada subió {db} dB hacia {date}.',
  'No lasting change in cross-polarization backscatter.': 'Ningún cambio duradero en la retrodispersión en polarización cruzada.',
  'The forecast keeps falling by {db} dB per decade.': 'El pronóstico sigue cayendo {db} dB por década.',
  'Not enough history to look for a change.': 'Historial insuficiente para buscar un cambio.',
  '{pct}% of the months looked flooded in the radar.': 'El {pct}% de los meses parecía inundado en el radar.', 'The place is a floodplain.': 'El lugar es una llanura inundable.',
  'Rain of the last 3 months is {z} standard deviations above normal.': 'La lluvia de los últimos 3 meses está {z} desviaciones estándar sobre lo normal.',
  'The forecast wet season peaks at {pct}% of the wettest past years.': 'El pico de la estación lluviosa prevista es el {pct}% de los años más lluviosos del pasado.',
  'No sign of flooding in the history or in the rain.': 'Sin señal de inundación en el historial ni en la lluvia.',
  'Not enough rain history.': 'Historial de lluvia insuficiente.',
  'Rain of the last 3 months is {z} standard deviations below normal.': 'La lluvia de los últimos 3 meses está {z} desviaciones estándar bajo lo normal.',
  'The next 6 months are forecast {pct}% drier than the same months of the past.': 'Se pronostican los próximos 6 meses un {pct}% más secos que los mismos meses del pasado.',
  'Rain is normal or above, now and in the forecast.': 'La lluvia es normal o superior, ahora y en el pronóstico.',
  'Not enough history to find unusual months.': 'Historial insuficiente para hallar meses inusuales.',
  '{n} of the last 12 months look unlike the rest of the history.': '{n} de los últimos 12 meses no se parecen al resto del historial.',
  'The last 12 months look like the rest of the history.': 'Los últimos 12 meses se parecen al resto del historial.',
  'Natural disasters': 'Desastres naturales', Earthquake: 'Terremoto', Wildfire: 'Incendio forestal', Storm: 'Tormenta', Magnitude: 'Magnitud', Depth: 'Profundidad', 'Water rise': 'Subida del agua',
  Duration: 'Duración', Wind: 'Viento', 'Wind from': 'Viento del', 'Fuel dryness': 'Sequedad del combustible', 'Peak gust': 'Ráfaga máxima', 'Track direction': 'Dirección de la trayectoria',
  "Use this point's drought risk ({v})": 'Usar el riesgo de sequía de este punto ({v})', 'Length to width {r}': 'Largo / ancho {r}',
  'Simulate here': 'Simular aquí', 'Simulate at the center': 'Simular en el centro', buildings: 'edificios',
  'Zoom in to count the buildings in each zone.': 'Acerca para contar los edificios de cada zona.', 'Sound on': 'Sonido activado', 'Sound off': 'Sonido desactivado',
  'Destructive (MMI IX or more)': 'Destrucción (MMI IX o más)', 'Heavy damage (MMI VII to VIII)': 'Daños graves (MMI VII a VIII)', 'Moderate damage (MMI VI)': 'Daños moderados (MMI VI)', 'Felt, light damage (MMI V)': 'Sentido, daños leves (MMI V)',
  'Embers and smoke zone': 'Zona de brasas y humo', 'Burned area': 'Área quemada', 'Damaging wind (90 km/h or more)': 'Viento dañino (90 km/h o más)', 'Severe wind (120 km/h or more)': 'Viento severo (120 km/h o más)', 'Destructive wind (170 km/h or more)': 'Viento destructivo (170 km/h o más)',
  'Flooded land (below the water level)': 'Tierra inundada (bajo el nivel del agua)',
  Data: 'Datos', Forecast: 'Pronóstico', Regions: 'Regiones', Area: 'Área', 'Selection mode': 'Modo de selección', 'Drag a rectangle on the map.': 'Arrastra un rectángulo en el mapa.',
  'Centered at {lat}, {lon}. Radar window {m} m; rain is the IMERG cell of the center.': 'Centro en {lat}, {lon}. Ventana del radar de {m} m; la lluvia es la celda IMERG del centro.',
  'Sample places': 'Lugares muestreados', 'Riskiest place': 'Lugar más riesgoso', 'Run forecast again': 'Generar el pronóstico de nuevo', 'Try the forecast again': 'Reintentar el pronóstico', 'Map year': 'Año en el mapa', Close: 'Cerrar', 'ready-made': 'lista',
  'The first forecast of a place reads years of satellite scenes; the next ones are instant.': 'El primer pronóstico de un lugar lee años de escenas de satélite; los siguientes son instantáneos.',
  'Learns from this place since 2016 and projects radar and rain to 2030. The button below starts it.': 'Aprende de este lugar desde 2016 y proyecta radar y lluvia hasta 2030. El botón de abajo lo inicia.',
  'Select a point or an area on the map, or open a ready-made region.': 'Selecciona un punto o un área en el mapa, o abre una región lista.',
  'Forecasts computed ahead for whole regions: nothing to wait for.': 'Pronósticos calculados antes para regiones enteras: sin espera.', 'The backend has no regions yet.': 'El backend aún no tiene regiones.',
  '{n} sample places': '{n} lugares muestreados', 'being prepared': 'en preparación', '3D view': 'Vista 3D', '{n} on': '{n} activas', 'none on': 'ninguna activa', '{n} of 2 on': '{n} de 2 activos', running: 'en curso', simulations: 'simulaciones',
  'Average of {n} sample places spread over the region.': 'Promedio de {n} lugares muestreados por la región.',
  'Drag a rectangle on the map. Esc cancels.': 'Arrastra un rectángulo en el mapa. Esc cancela.', 'Select area': 'Seleccionar área', 'Select area (or hold Shift and drag)': 'Seleccionar área (o mantén Shift y arrastra)',
  // forecast
  'Forecast to 2030': 'Pronóstico a 2030', 'Learns from this point since 2016 and projects radar and rain to 2030.': 'Aprende del historial de este punto desde 2016 y proyecta radar y lluvia hasta 2030.',
  'Run forecast': 'Generar pronóstico', 'Searching radar scenes…': 'Buscando escenas de radar…', 'Reading radar history': 'Leyendo historial del radar', 'Reading monthly rain': 'Leyendo lluvia mensual',
  'Reading recent rain': 'Leyendo lluvia reciente', 'Training the model…': 'Entrenando el modelo…', 'Working…': 'Procesando…', Radar: 'Radar', 'Rain (mm/month)': 'Lluvia (mm/mes)',
  reliable: 'fiable', weak: 'débil', Model: 'Modelo', error: 'error', decade: 'década',
  '{n}% better than last year': '{n}% mejor que repetir el año anterior', '{n}% worse than last year': '{n}% peor que repetir el año anterior',
  '{a} radar scenes, {b} months of rain. Band: 80 %. Forecast until {date}.': '{a} escenas de radar, {b} meses de lluvia. Banda: 80 %. Pronóstico hasta {date}.',
  'Future rain is unknown: the backscatter forecast assumes normal rain.': 'La lluvia futura es desconocida: el pronóstico del radar asume lluvia normal.',
  'The 80 % band comes from backtest errors and widens with the years ahead; it does not include events not yet seen.': 'La banda del 80 % viene de los errores de la prueba retroactiva y crece con los años; no incluye eventos aún no vistos.',
  'Sentinel-2 cloudless © EOX · NASA GIBS, GPM IMERG · ASF NISAR and OPERA · AWS Terrain Tiles · © OpenStreetMap contributors · MapLibre': 'Sentinel-2 cloudless © EOX · NASA GIBS · ASF NISAR y OPERA · AWS Terrain Tiles · © colaboradores de OpenStreetMap · MapLibre',
}

const DICT: Record<Lang, Record<string, string>> = { en: {}, pt: { ...PT, ...STORY_PT }, es: { ...ES, ...STORY_ES } }

export function translate(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  let out = DICT[lang][key] ?? key
  if (vars) for (const [k, v] of Object.entries(vars)) out = out.replaceAll(`{${k}}`, String(v))
  return out
}

export interface I18n {
  lang: Lang
  setLang: (l: Lang) => void
  /** Locale for dates and numbers. */
  locale: string
  t: (key: string, vars?: Record<string, string | number>) => string
}

export const I18nContext = createContext<I18n>({ lang: 'en', setLang: () => {}, locale: 'en-GB', t: (k, v) => translate('en', k, v) })
export const useI18n = () => useContext(I18nContext)

export function initialLang(): Lang {
  try {
    const saved = localStorage.getItem('saris-lang')
    if (saved === 'en' || saved === 'pt' || saved === 'es') return saved
  } catch { /* storage may be blocked */ }
  const n = (navigator.language || 'en').slice(0, 2)
  return n === 'pt' || n === 'es' ? n : 'en'
}
