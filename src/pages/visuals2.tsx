import { useEffect, useMemo, useState } from 'react'
import type { Tri } from '../components/Deck'
import { sound } from '../lib/sound'
import { T, rng, useTx } from './helpers'

/** Figures of the "engine" chapter: how a radar value becomes a decibel, how the model learns "normal", how it earns its place. */

/** A 6 x 6 window of radar backscatter: linear values on one side, decibels on the other. */
const WINDOW = [
  [0.022, 0.105, 0.184, 2.354, 6.702, 2.762],
  [0.013, 0.033, 0.132, 0.642, 4.182, 2.458],
  [0.008, 0.012, 0.017, 0.110, 3.666, 2.220],
  [0.012, 0.013, 0.016, 0.066, 2.380, 0.264],
  [0.014, 0.008, 0.021, 0.073, 3.898, 0.124],
  [0.011, 0.010, 0.016, 0.030, 0.576, 0.048],
]
const db = (v: number) => 10 * Math.log10(v)
/** The number the chart gets from a window: the median of its values in dB (a single pixel is mostly speckle). */
const windowMedianDb = () => {
  const all = WINDOW.flat().map(db).sort((a, b) => a - b)
  return (all[all.length / 2 - 1] + all[all.length / 2]) / 2
}
const grey = (v: number) => { const t = Math.max(0, Math.min(1, (db(v) + 22) / 31)); const c = Math.round(18 + t * 232); return `rgb(${c},${c},${c})` }

export function PixelMatrix() {
  const tx = useTx()
  const [mode, setMode] = useState<'lin' | 'db'>('lin')
  const [sel, setSel] = useState<[number, number]>([0, 4])
  const v = WINDOW[sel[0]][sel[1]]
  const median = useMemo(() => windowMedianDb(), [])
  return (
    <>
      <div className="pm">
        <div className="pm-grid" role="grid" aria-label="6 by 6 window of radar pixels">
          {WINDOW.map((row, r) => row.map((x, c) => (
            <button key={`${r}-${c}`} className={`pm-c ${sel[0] === r && sel[1] === c ? 'on' : ''}`} style={{ background: grey(x), color: db(x) > -9 ? '#111' : '#cfd8e6' }}
              onClick={() => { sound.ping(); setSel([r, c]) }} aria-label={`${x}`}>
              {mode === 'lin' ? (x < 1 ? x.toFixed(3) : x.toFixed(2)) : db(x).toFixed(1)}
            </button>
          )))}
        </div>
        <div className="pm-side">
          <div className="seg" role="group">
            <button className={mode === 'lin' ? 'on' : ''} onClick={() => setMode('lin')}>{tx(T('Linear power', 'Potência linear', 'Potencia lineal'))}</button>
            <button className={mode === 'db' ? 'on' : ''} onClick={() => setMode('db')}>{tx(T('Decibels', 'Decibéis', 'Decibelios'))}</button>
          </div>
          <div className="pm-f mono">dB = 10 · log<sub>10</sub>(x)</div>
          <div className="pm-r"><b>{v < 1 ? v.toFixed(3) : v.toFixed(3)}</b><span>→</span><b className="acc">{db(v).toFixed(1)} dB</b></div>
        </div>
      </div>
      <div className="pm-leg" aria-hidden="true">
        {[
          [T('Black', 'Preto', 'Negro'), T('low echo', 'eco fraco', 'eco débil'), '#111'],
          [T('Dark grey', 'Cinza escuro', 'Gris oscuro'), T('low-medium', 'fraco-médio', 'débil-medio'), '#555'],
          [T('Light grey', 'Cinza claro', 'Gris claro'), T('medium-high', 'médio-forte', 'medio-fuerte'), '#aaa'],
          [T('White', 'Branco', 'Blanco'), T('strong echo', 'eco forte', 'eco fuerte'), '#f2f2f2'],
        ].map(([n, d, c], k) => (
          <span key={k}><i style={{ background: c as string }} /><b>{tx(n as never)}</b>{tx(d as never)}</span>
        ))}
      </div>
      <div className="pm-use">
        <div>
          <b>{tx(T('L-band · NISAR', 'Banda L · NISAR', 'Banda L · NISAR'))}</b>
          <span>{tx(T('24 cm wavelength: it reaches deeper into foliage than C-band (Sentinel-1), so it answers to trunks and wet soil too. Since Oct 2025.', 'Comprimento de onda de 24 cm: penetra mais na folhagem que a banda C (Sentinel-1), então responde também a troncos e solo úmido. Desde out/2025.', 'Longitud de onda de 24 cm: penetra más en el follaje que la banda C (Sentinel-1), así que responde también a troncos y suelo húmedo. Desde oct/2025.'))}</span>
        </div>
        <div>
          <b>{tx(T('The real window', 'A janela real', 'La ventana real'))}</b>
          <span>{tx(T('On the map it covers 500 m: 51 × 51 pixels of 10 m (NISAR) or 17 × 17 of 30 m (Sentinel-1). Here, 6 × 6 to fit.', 'No mapa ela cobre 500 m: 51 × 51 pixels de 10 m (NISAR) ou 17 × 17 de 30 m (Sentinel-1). Aqui, 6 × 6 para caber.', 'En el mapa cubre 500 m: 51 × 51 píxeles de 10 m (NISAR) o 17 × 17 de 30 m (Sentinel-1). Aquí, 6 × 6 para que quepa.'))}</span>
        </div>
        <div>
          <b>{tx(T('From pixels to one point', 'De pixels a um ponto', 'De píxeles a un punto'))}</b>
          <span>{tx(T('Invalid pixels are dropped, and the median of the window, in dB, becomes the chart point for that date.', 'Pixels inválidos saem, e a mediana da janela, em dB, vira o ponto do gráfico daquela data.', 'Los píxeles inválidos salen, y la mediana de la ventana, en dB, se vuelve el punto del gráfico de esa fecha.'))}</span>
          <em className="mono">{tx(T('this window', 'esta janela', 'esta ventana'))}: <strong>{median.toFixed(1)} dB</strong></em>
        </div>
      </div>
    </>
  )
}

/** One place, ten years: learn what is normal, expect the next months, flag what falls outside. */
const N = 124 // monthly points, 2016 -> mid 2026
function series() {
  const r = rng(11), xs: number[] = [], rain: number[] = []
  for (let i = 0; i < N; i++) {
    const season = Math.sin((i / 12) * 2 * Math.PI - 1.2)
    const wet = Math.max(0, season)
    rain.push(0.25 + 0.75 * wet + (r() - 0.5) * 0.25)
    let v = -11.5 + 1.5 * season + (r() - 0.5) * 0.9
    if (i >= N - 9) v -= 3.1 + (i - (N - 9)) * 0.08 // a lasting drop: the cross-polarized signal of cleared vegetation
    xs.push(v)
  }
  return { xs, rain }
}

export function MlStory() {
  const tx = useTx()
  const [stage, setStage] = useState(0)
  const [auto, setAuto] = useState(true)
  const { xs, rain } = useMemo(() => series(), [])
  useEffect(() => {
    if (!auto) return
    const id = setInterval(() => setStage((s) => (s + 1) % 3), 4200)
    return () => clearInterval(id)
  }, [auto])
  const W = 560, H = 210, L = 10, R = 10, TOP = 12, BOT = 52
  const FUT = 36 // months forecast after the history
  const total = N + FUT
  const px = (i: number) => L + (i / (total - 1)) * (W - L - R)
  const py = (v: number) => TOP + (1 - (v + 18) / 10) * (H - TOP - BOT)
  const expected = (i: number) => -11.5 + 1.5 * Math.sin((i / 12) * 2 * Math.PI - 1.2)
  const sigma = 0.75
  const path = (f: (i: number) => number, a: number, b: number) => Array.from({ length: b - a }, (_, k) => `${k ? 'L' : 'M'}${px(a + k).toFixed(1)} ${py(f(a + k)).toFixed(1)}`).join(' ')
  const band = (a: number, b: number, k: (i: number) => number) => {
    const up = Array.from({ length: b - a }, (_, j) => `${j ? 'L' : 'M'}${px(a + j).toFixed(1)} ${py(expected(a + j) + k(a + j)).toFixed(1)}`)
    const dn = Array.from({ length: b - a }, (_, j) => `L${px(b - 1 - j).toFixed(1)} ${py(expected(b - 1 - j) - k(b - 1 - j)).toFixed(1)}`)
    return `${up.join(' ')} ${dn.join(' ')} Z`
  }
  const out = xs.map((v, i) => Math.abs(v - expected(i)) > 2 * sigma)
  const flagged = out.slice(N - 9).every(Boolean)
  const tabs = [T('1 · Learn normal', '1 · Aprende o normal', '1 · Aprende lo normal'), T('2 · Expect', '2 · Espera', '2 · Espera'), T('3 · Flag', '3 · Sinaliza', '3 · Señala')]
  const reads = [
    T('Ten years of one place: the radar rhythm follows the seasons, month after month.', 'Dez anos de um lugar: o ritmo do radar segue as estações, mês após mês.', 'Diez años de un lugar: el ritmo del radar sigue las estaciones, mes tras mes.'),
    T('From that rhythm it expects each coming month, with a band that widens with the years ahead.', 'Desse ritmo ele espera cada mês que vem, com uma faixa que se alarga com os anos à frente.', 'De ese ritmo espera cada mes que viene, con una banda que se ensancha con los años por delante.'),
    T('Months far outside the band, for a long time, and not explained by rain, raise the alert.', 'Meses muito fora da faixa, por muito tempo e sem a chuva explicar, levantam o alerta.', 'Meses muy fuera de la banda, por mucho tiempo y sin que la lluvia lo explique, levantan la alerta.'),
  ]
  return (
    <>
      <div className="seg ml-tabs" role="tablist">
        {tabs.map((t, k) => <button key={k} role="tab" aria-selected={stage === k} className={stage === k ? 'on' : ''} onClick={() => { sound.ping(); setAuto(false); setStage(k) }}>{tx(t)}</button>)}
      </div>
      <svg className="svg ml" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Radar history, expected band and flagged months">
        <defs><linearGradient id="ml-b" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#3be0c5" stopOpacity=".28" /><stop offset="1" stopColor="#3be0c5" stopOpacity=".06" /></linearGradient></defs>
        <line x1={px(N - 1)} x2={px(N - 1)} y1={TOP} y2={H - BOT + 6} stroke="#e7b04a" strokeDasharray="3 4" strokeOpacity=".7" />
        <text x={px(N - 1) + 4} y={TOP + 9} fill="#e7b04a" fontSize="9" fontFamily="ui-monospace,monospace">{tx(T('TODAY', 'HOJE', 'HOY'))}</text>
        {stage >= 1 && <path d={band(0, N, () => 2 * sigma)} fill="url(#ml-b)" className="fade-in" />}
        {stage >= 1 && <path d={band(N - 1, total, (i) => 2 * sigma + (i - N) * 0.045)} fill="rgba(231,176,74,.16)" className="fade-in" />}
        <path d={path(expected, 0, total)} fill="none" stroke="#3be0c5" strokeOpacity=".55" strokeWidth="1.2" strokeDasharray={stage >= 1 ? '0' : '3 3'} />
        <path d={path((i) => xs[i], 0, N)} fill="none" stroke="#dfe8f7" strokeWidth="1.5" className="draw" key={`h${stage === 0}`} />
        {stage >= 2 && xs.map((v, i) => out[i] && <circle key={i} cx={px(i)} cy={py(v)} r="3.2" fill="#f87171" className="fade-in" />)}
        {rain.map((q, i) => <rect key={i} x={px(i) - 0.9} y={H - 10 - q * 30} width="1.8" height={q * 30} fill="#818cf8" opacity=".55" />)}
        <g fontFamily="ui-monospace,monospace" fontSize="9" fill="#8a99b4">
          <text x={L} y={H - 44 + 0} opacity="0">.</text>
          <text x={px(0)} y={H} >2016</text><text x={px(60)} y={H}>2021</text><text x={px(N)} y={H}>2026</text><text x={px(total - 1) - 22} y={H}>2030</text>
          <text x={L + 2} y={H - 40} fill="#818cf8">{tx(T('RAIN', 'CHUVA', 'LLUVIA'))}</text>
        </g>
      </svg>
      <div className="ml-read">
        <span>{tx(reads[stage])}</span>
        {stage === 2 && <b className={flagged ? 'bad' : ''}>{tx(T('Score 0.82 · high', 'Nota 0,82 · alta', 'Nota 0,82 · alta'))}</b>}
      </div>
    </>
  )
}

/** A few plain paragraphs on the instrument screen (no cards, no bullets). */
export function Prose({ paras }: { paras: Tri[] }) {
  const tx = useTx()
  return <div className="prose">{paras.map((t, k) => <p key={k}>{tx(t)}</p>)}</div>
}

/** The scoreboard and the three outputs: anomaly layer, chart with expected range, transparent scorecard. */
export function Scorecard() {
  const tx = useTx()
  const [go, setGo] = useState(false)
  useEffect(() => { const id = setTimeout(() => setGo(true), 250); return () => clearTimeout(id) }, [])
  // what a person can read: how often each one is right when it says what a place is (forest, city, water or other vegetation)
  const rows = [
    { l: T('Simple guess', 'Palpite simples', 'Suposición simple'), v: 54, c: '#6f9bff' },
    { l: T('Radar alone', 'Só o radar', 'Solo el radar'), v: 73, c: '#a78bfa' },
    { l: T('Radar + color of the ground', 'Radar + cor do solo', 'Radar + color del suelo'), v: 85, c: '#3be0c5' },
  ]
  return (
    <>
      <div className="bars sc">
        {rows.map((r) => (
          <div key={r.l.en} className="bar"><i style={{ width: go ? `${r.v}%` : 0, background: r.c, opacity: 0.9 }} /><span>{tx(r.l)}</span><em>{r.v}%</em></div>
        ))}
      </div>
      <div className="sc-note">{tx(T('Out of 100 places, how many it gets right: forest, city, water or other vegetation. Tested on places and years it never saw, repeated 16 times.', 'De cada 100 lugares, quantos ele acerta: floresta, cidade, água ou outra vegetação. Testado em lugares e anos que nunca viu, repetido 16 vezes.', 'De cada 100 lugares, cuántos acierta: bosque, ciudad, agua u otra vegetación. Probado en lugares y años que nunca vio, repetido 16 veces.'))}</div>
      <p className="sc-prose">{tx(T('When the model wins, the map gets three things: a score from 0 to 1 for each place and date, a chart with the expected range, and this scorecard with the model next to the simple rule.', 'Quando o modelo vence, o mapa ganha três coisas: uma nota de 0 a 1 para cada lugar e data, um gráfico com a faixa esperada e este placar com o modelo ao lado da regra simples.', 'Cuando el modelo gana, el mapa recibe tres cosas: una nota de 0 a 1 para cada lugar y fecha, un gráfico con el rango esperado y este marcador con el modelo junto a la regla simple.'))}</p>
    </>
  )
}

/** The Amazon and the regions its moisture reaches, as two paragraphs (the 3D scene next to it carries the picture). */
export function ImpactList() {
  return <Prose paras={[
    T('The air that leaves the Amazon climbs the Andes and feeds the headwaters of rivers on the other side. It also brings rain to the centre and southeast of Brazil, São Paulo included, and farther south to Rio Grande do Sul, Paraguay, Uruguay and northern Argentina.', 'O ar que sai da Amazônia sobe os Andes e alimenta as nascentes de rios do outro lado. Também leva chuva ao centro e ao sudeste do Brasil, São Paulo incluída, e mais ao sul ao Rio Grande do Sul, ao Paraguai, ao Uruguai e ao norte da Argentina.', 'El aire que sale del Amazonas sube los Andes y alimenta las cabeceras de ríos del otro lado. También lleva lluvia al centro y al sudeste de Brasil, São Paulo incluida, y más al sur a Rio Grande do Sul, Paraguay, Uruguay y el norte de Argentina.'),
    T('São Paulo and Rio Grande do Sul already have a forecast ready on the map, so you can read them next to the Amazon.', 'São Paulo e o Rio Grande do Sul já têm uma previsão pronta no mapa, então dá para lê-los ao lado da Amazônia.', 'São Paulo y Rio Grande do Sul ya tienen un pronóstico listo en el mapa, así que se pueden leer junto al Amazonas.'),
  ]} />
}

/** What each physical driver does to the radar, by polarization. The numbers are illustrative orders of magnitude (dB), the signs are the physics. */
const DRIVERS = [
  { id: 'clear', human: true, co: -2, cross: -6, c: '#fb923c',
    n: T('Forest clearing', 'Desmatamento', 'Tala de bosque'),
    why: T('The canopy is gone, so the scattering from leaves, branches and trunks disappears. The cross-polarized echo (HV, VH) is the one that falls the most.', 'A copa some, e com ela o espalhamento das folhas, dos galhos e dos troncos. O eco em polarização cruzada (HV, VH) é o que mais cai.', 'La copa desaparece, y con ella la dispersión de hojas, ramas y troncos. El eco en polarización cruzada (HV, VH) es el que más cae.'),
    map: T('Vegetation loss risk · alerts layer', 'Risco de perda de vegetação · camada de alertas', 'Riesgo de pérdida de vegetación · capa de alertas') },
  { id: 'fire', human: true, co: -1.5, cross: -4, c: '#f87171',
    n: T('Fire', 'Queimada', 'Incendio'),
    why: T('Fire strips the canopy and leaves a scar. The cross-polarized echo falls and stays low for months, which is how a burned area differs from a dry season.', 'O fogo tira a copa e deixa uma cicatriz. O eco em polarização cruzada cai e fica baixo por meses, e é assim que uma área queimada se diferencia de uma estação seca.', 'El fuego quita la copa y deja una cicatriz. El eco en polarización cruzada cae y se mantiene bajo por meses, y así se distingue un área quemada de una estación seca.'),
    map: T('Drought and fire risk', 'Risco de seca e queimada', 'Riesgo de sequía e incendio') },
  { id: 'flood', human: false, co: 5, cross: 1, c: '#60a5fa',
    n: T('Flooded forest', 'Floresta alagada', 'Bosque inundado'),
    why: T('Water under the trees makes the pulse bounce off the water and then off the trunk. That double bounce makes the co-polarized echo (HH) much brighter. Open flood water, on the other hand, looks dark.', 'A água sob as árvores faz o pulso rebater na água e depois no tronco. Esse rebatimento duplo deixa o eco co-polarizado (HH) bem mais brilhante. Já a água aberta de uma enchente fica escura.', 'El agua bajo los árboles hace que el pulso rebote en el agua y luego en el tronco. Ese rebote doble hace el eco copolarizado (HH) mucho más brillante. El agua abierta de una inundación, en cambio, se ve oscura.'),
    map: T('Flood risk · surface water layer', 'Risco de enchente · camada de água superficial', 'Riesgo de inundación · capa de agua superficial') },
  { id: 'soil', human: false, co: 3, cross: 1, c: '#a3e635',
    n: T('Soil moisture', 'Umidade do solo', 'Humedad del suelo'),
    why: T('Wet soil reflects more because of its high dielectric constant. The echo, mostly the co-polarized one, goes up after rain and down in a drought.', 'O solo molhado reflete mais por causa da sua constante dielétrica alta. O eco, principalmente o co-polarizado, sobe depois da chuva e desce na seca.', 'El suelo mojado refleja más por su constante dieléctrica alta. El eco, sobre todo el copolarizado, sube después de la lluvia y baja en la sequía.'),
    map: T('Rain and soil moisture layers', 'Camadas de chuva e umidade do solo', 'Capas de lluvia y humedad del suelo') },
  { id: 'crop', human: true, co: 2, cross: 4, c: '#fbbf24',
    n: T('Crops and pasture', 'Lavoura e pasto', 'Cultivos y pasto'),
    why: T('A growing crop scatters more, and harvest or ploughing brings that down, so the cross-polarized echo follows the crop cycle. Pasture looks very different from forest.', 'Uma lavoura em crescimento espalha mais o sinal, e a colheita ou a aração derrubam isso, então o eco em polarização cruzada acompanha o ciclo da lavoura. O pasto é bem diferente da floresta.', 'Un cultivo en crecimiento dispersa más la señal, y la cosecha o el arado lo bajan, así que el eco en polarización cruzada sigue el ciclo del cultivo. El pasto se ve muy distinto del bosque.'),
    map: T('Land cover · the Rondônia pasture place', 'Cobertura do solo · o lugar de pasto em Rondônia', 'Cobertura del suelo · el lugar de pasto en Rondônia') },
  { id: 'city', human: true, co: 4, cross: 2, c: '#c084fc',
    n: T('City growth', 'Crescimento urbano', 'Crecimiento urbano'),
    why: T('Walls and the ground form corners that send the pulse straight back, so new buildings brighten the echo, mostly the co-polarized one.', 'Paredes e chão formam quinas que mandam o pulso direto de volta, então prédios novos deixam o eco mais brilhante, principalmente o co-polarizado.', 'Las paredes y el suelo forman esquinas que mandan el pulso directo de vuelta, así que los edificios nuevos hacen el eco más brillante, sobre todo el copolarizado.'),
    map: T('Land cover: city', 'Cobertura do solo: cidade', 'Cobertura del suelo: ciudad') },
]

export function DriversPicker() {
  const tx = useTx()
  const [sel, setSel] = useState('clear')
  const d = DRIVERS.find((x) => x.id === sel) ?? DRIVERS[0]
  const bar = (v: number, color: string) => (
    <span className="dv-bar" aria-hidden="true">
      <i style={{ [v >= 0 ? 'left' : 'right']: '50%', width: `${(Math.abs(v) / 8) * 50}%`, background: color }} />
    </span>
  )
  return (
    <>
      <div className="dv-list" role="tablist">
        {DRIVERS.map((x) => (
          <button key={x.id} role="tab" aria-selected={sel === x.id} className={sel === x.id ? 'on' : ''} style={{ ['--c' as string]: x.c }} onClick={() => { sound.ping(); setSel(x.id) }}>
            <i />{tx(x.n)}
          </button>
        ))}
      </div>
      <div className="dv-card" key={d.id} style={{ ['--c' as string]: d.c }}>
        <div className="dv-head">
          <strong>{tx(d.n)}</strong>
          <span className="mono">{d.human ? tx(T('human driver', 'causa humana', 'causa humana')) : tx(T('natural driver', 'causa natural', 'causa natural'))}</span>
        </div>
        <div className="dv-pol">
          <div><b>{tx(T('Co-pol · HH, VV', 'Co-pol · HH, VV', 'Copol · HH, VV'))}</b>{bar(d.co, '#5eead4')}<em>{d.co > 0 ? '+' : '−'}{Math.abs(d.co)} dB</em></div>
          <div><b>{tx(T('Cross-pol · HV, VH', 'Pol. cruzada · HV, VH', 'Pol. cruzada · HV, VH'))}</b>{bar(d.cross, '#fb923c')}<em>{d.cross > 0 ? '+' : '−'}{Math.abs(d.cross)} dB</em></div>
        </div>
        <p>{tx(d.why)}</p>
        <small>{tx(T('On the map', 'No mapa', 'En el mapa'))}: <b>{tx(d.map)}</b></small>
      </div>
      <div className="sc-note">{tx(T('These numbers are only rough orders of magnitude. The radar tells us that something changed, and the cause stays a hypothesis until optical images and rain confirm it.', 'Esses números são só ordens de grandeza aproximadas. O radar diz que algo mudou, e a causa continua sendo uma hipótese até que imagens ópticas e a chuva a confirmem.', 'Estos números son solo órdenes de magnitud aproximados. El radar dice que algo cambió, y la causa sigue siendo una hipótesis hasta que las imágenes ópticas y la lluvia la confirmen.'))}</div>
    </>
  )
}

/** What NISAR can do beyond this project, and what SARIS adds next, as two paragraphs. */
export function FutureList() {
  return <Prose paras={[
    T('Beyond forests, the same radar can follow ground motion down to the centimetre, glaciers and sea ice even in polar night, water hidden under vegetation, crops and their water stress, and the carbon held in the forest.', 'Além das florestas, o mesmo radar acompanha o movimento do solo até o centímetro, geleiras e gelo marinho mesmo na noite polar, a água escondida sob a vegetação, as lavouras e o estresse hídrico delas, e o carbono guardado na floresta.', 'Más allá de los bosques, el mismo radar puede seguir el movimiento del suelo hasta el centímetro, los glaciares y el hielo marino incluso en la noche polar, el agua escondida bajo la vegetación, los cultivos y su estrés hídrico, y el carbono guardado en el bosque.'),
    T('For SARIS, the next steps are a layer for ground motion, passes from both directions put together, and layers with population and land use.', 'Para o SARIS, os próximos passos são uma camada de movimento do solo, as passagens dos dois sentidos juntas e camadas de população e uso do solo.', 'Para SARIS, los próximos pasos son una capa de movimiento del suelo, las pasadas de los dos sentidos juntas y capas de población y uso del suelo.'),
  ]} />
}
