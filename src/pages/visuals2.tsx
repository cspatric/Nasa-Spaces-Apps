import { useEffect, useMemo, useState } from 'react'
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
const grey = (v: number) => { const t = Math.max(0, Math.min(1, (db(v) + 22) / 31)); const c = Math.round(18 + t * 232); return `rgb(${c},${c},${c})` }

export function PixelMatrix() {
  const tx = useTx()
  const [mode, setMode] = useState<'lin' | 'db'>('lin')
  const [sel, setSel] = useState<[number, number]>([0, 4])
  const v = WINDOW[sel[0]][sel[1]]
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
  const steps = [T('1 · Learns from known places', '1 · Aprende com lugares conhecidos', '1 · Aprende de lugares conocidos'), T('2 · Tested on places it never saw', '2 · Testado em lugares que nunca viu', '2 · Probado en lugares que nunca vio'), T('3 · Enters the map only if it wins', '3 · Só entra no mapa se vencer', '3 · Solo entra al mapa si gana')]
  const outs = [
    { t: T('On the map', 'No mapa', 'En el mapa'), d: T('a score from 0 to 1 shows how unusual a place is', 'uma nota de 0 a 1 mostra o quão incomum é um lugar', 'una nota de 0 a 1 muestra qué tan inusual es un lugar') },
    { t: T('In the charts', 'Nos gráficos', 'En los gráficos'), d: T('a band shows what is normal for that place', 'uma faixa mostra o que é normal naquele lugar', 'una banda muestra qué es normal en ese lugar') },
    { t: T('Scorecard', 'Placar', 'Marcador'), d: T('the model next to the simple guess', 'o modelo ao lado do palpite simples', 'el modelo junto a la suposición simple') },
  ]
  return (
    <>
      <div className="bars sc">
        {rows.map((r) => (
          <div key={r.l.en} className="bar"><i style={{ width: go ? `${r.v}%` : 0, background: r.c, opacity: 0.9 }} /><span>{tx(r.l)}</span><em>{r.v}%</em></div>
        ))}
      </div>
      <div className="sc-note">{tx(T('Out of 100 places, how many it gets right: forest, city, water or other vegetation. Tested on places and years it never saw, repeated 16 times.', 'De cada 100 lugares, quantos ele acerta: floresta, cidade, água ou outra vegetação. Testado em lugares e anos que nunca viu, repetido 16 vezes.', 'De cada 100 lugares, cuántos acierta: bosque, ciudad, agua u otra vegetación. Probado en lugares y años que nunca vio, repetido 16 veces.'))}</div>
      <div className="chev" aria-hidden="true">{steps.map((s, k) => <span key={k}>{tx(s)}</span>)}</div>
      <div className="outs">{outs.map((o, k) => <div key={k}><b>{tx(o.t)}</b><span>{tx(o.d)}</span></div>)}</div>
    </>
  )
}

/** The Amazon and the regions its moisture reaches. Compact: the 3D scene next to it carries the picture. */
export function ImpactList() {
  const tx = useTx()
  const rows = [
    { c: '#5eead4', n: T('Andes · Peru, Bolivia', 'Andes · Peru, Bolívia', 'Andes · Perú, Bolivia'), d: T('moisture climbs the slopes and feeds headwaters', 'a umidade sobe as encostas e alimenta nascentes', 'la humedad sube las laderas y alimenta cabeceras') },
    { c: '#fbbf24', n: T('Centre-West and Southeast · São Paulo', 'Centro-Oeste e Sudeste · São Paulo', 'Centro-Oeste y Sudeste · São Paulo'), d: T('summer rain and reservoirs', 'chuva de verão e reservatórios', 'lluvia de verano y embalses'), tag: true },
    { c: '#60a5fa', n: T('South · Rio Grande do Sul', 'Sul · Rio Grande do Sul', 'Sur · Rio Grande do Sul'), d: T('rain along the path south', 'chuva no caminho para o sul', 'lluvia en el camino al sur'), tag: true },
    { c: '#c084fc', n: T('Plata basin · Paraguay, Uruguay, Argentina', 'Bacia do Prata · Paraguai, Uruguai, Argentina', 'Cuenca del Plata · Paraguay, Uruguay, Argentina'), d: T('farmland and rivers downwind', 'lavouras e rios a sotavento', 'cultivos y ríos a sotavento') },
  ]
  return (
    <div className="imp">
      {rows.map((r, k) => (
        <div key={k} style={{ ['--c' as string]: r.c, animationDelay: `${k * 0.12}s` }}>
          <i />
          <p><b>{tx(r.n)}</b><span>{tx(r.d)}</span>{r.tag && <em className="mono">{tx(T('forecast ready', 'previsão pronta', 'pronóstico listo'))}</em>}</p>
        </div>
      ))}
    </div>
  )
}

/** What each physical driver does to the radar, by polarization. The numbers are illustrative orders of magnitude (dB), the signs are the physics. */
const DRIVERS = [
  { id: 'clear', human: true, co: -2, cross: -6, c: '#fb923c',
    n: T('Forest clearing', 'Desmatamento', 'Tala de bosque'),
    why: T('The canopy is gone, so the volume scattering of leaves, branches and trunks disappears: the cross-polarized echo (HV, VH) drops the most.', 'A copa some, e com ela o espalhamento de volume de folhas, galhos e troncos: o eco em polarização cruzada (HV, VH) é o que mais cai.', 'La copa desaparece, y con ella la dispersión de volumen de hojas, ramas y troncos: el eco en polarización cruzada (HV, VH) es el que más cae.'),
    map: T('Vegetation loss risk · alerts layer', 'Risco de perda de vegetação · camada de alertas', 'Riesgo de pérdida de vegetación · capa de alertas') },
  { id: 'fire', human: true, co: -1.5, cross: -4, c: '#f87171',
    n: T('Fire', 'Queimada', 'Incendio'),
    why: T('Burning strips canopy and leaves a scar: the cross-polarized echo falls and stays low for months, which is how a burned area differs from a dry season.', 'O fogo tira a copa e deixa uma cicatriz: o eco em polarização cruzada cai e fica baixo por meses, o que diferencia área queimada de estação seca.', 'El fuego quita la copa y deja una cicatriz: el eco en polarización cruzada cae y se mantiene bajo por meses, lo que distingue un área quemada de una estación seca.'),
    map: T('Drought and fire risk', 'Risco de seca e queimada', 'Riesgo de sequía e incendio') },
  { id: 'flood', human: false, co: 5, cross: 1, c: '#60a5fa',
    n: T('Flooded forest', 'Floresta alagada', 'Bosque inundado'),
    why: T('Water under the trees makes the pulse bounce off the water and then the trunk: a double bounce that makes the co-polarized echo (HH) much brighter. Open flood water, by contrast, goes dark.', 'A água sob as árvores faz o pulso rebater na água e depois no tronco: um rebatimento duplo que deixa o eco co-polarizado (HH) bem mais brilhante. Já a água aberta fica escura.', 'El agua bajo los árboles hace rebotar el pulso en el agua y luego en el tronco: un rebote doble que hace el eco copolarizado (HH) mucho más brillante. El agua abierta, en cambio, se ve oscura.'),
    map: T('Flood risk · surface water layer', 'Risco de enchente · camada de água superficial', 'Riesgo de inundación · capa de agua superficial') },
  { id: 'soil', human: false, co: 3, cross: 1, c: '#a3e635',
    n: T('Soil moisture', 'Umidade do solo', 'Humedad del suelo'),
    why: T('Wet soil has a high dielectric constant and reflects more: the echo, mostly the co-polarized one, rises after rain and falls in a drought.', 'O solo molhado tem constante dielétrica alta e reflete mais: o eco, sobretudo o co-polarizado, sobe depois da chuva e cai na seca.', 'El suelo mojado tiene una constante dieléctrica alta y refleja más: el eco, sobre todo el copolarizado, sube después de la lluvia y cae en la sequía.'),
    map: T('Rain and soil moisture layers', 'Camadas de chuva e umidade do solo', 'Capas de lluvia y humedad del suelo') },
  { id: 'crop', human: true, co: 2, cross: 4, c: '#fbbf24',
    n: T('Crops and pasture', 'Lavoura e pasto', 'Cultivos y pasto'),
    why: T('As a crop grows its volume scattering rises, and at harvest or ploughing it drops: the cross-polarized echo traces the crop cycle. Pasture looks very different from forest.', 'Conforme a lavoura cresce o espalhamento de volume sobe, e na colheita ou aração ele cai: o eco em polarização cruzada desenha o ciclo da lavoura. O pasto é bem diferente da floresta.', 'A medida que el cultivo crece su dispersión de volumen sube, y en la cosecha o el arado baja: el eco en polarización cruzada dibuja el ciclo del cultivo. El pasto se ve muy distinto del bosque.'),
    map: T('Land cover · the Rondônia pasture place', 'Cobertura do solo · o lugar de pasto em Rondônia', 'Cobertura del suelo · el lugar de pasto en Rondônia') },
  { id: 'city', human: true, co: 4, cross: 2, c: '#c084fc',
    n: T('City growth', 'Crescimento urbano', 'Crecimiento urbano'),
    why: T('Walls and ground form corners that send the pulse straight back: new buildings brighten the echo, mostly the co-polarized one.', 'Paredes e chão formam quinas que devolvem o pulso direto: prédios novos deixam o eco mais brilhante, sobretudo o co-polarizado.', 'Paredes y suelo forman esquinas que devuelven el pulso directo: edificios nuevos hacen el eco más brillante, sobre todo el copolarizado.'),
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
      <div className="sc-note">{tx(T('Illustrative orders of magnitude. The radar says something changed; the driver is a hypothesis to confirm with optical images and rain.', 'Ordens de grandeza ilustrativas. O radar diz que algo mudou; a causa é uma hipótese a confirmar com imagem óptica e chuva.', 'Órdenes de magnitud ilustrativos. El radar dice que algo cambió; la causa es una hipótesis a confirmar con imagen óptica y lluvia.'))}</div>
    </>
  )
}

/** What NISAR can do beyond this project, and what SARIS adds next. */
export function FutureList() {
  const tx = useTx()
  const rows = [
    { n: T('Ground motion', 'Movimento do solo', 'Movimiento del suelo'), d: T('earthquakes, landslides, subsidence, to the centimetre (interferometry)', 'terremotos, deslizamentos, subsidência, em centímetros (interferometria)', 'terremotos, deslizamientos, subsidencia, al centímetro (interferometría)') },
    { n: T('Glaciers and sea ice', 'Geleiras e gelo marinho', 'Glaciares y hielo marino'), d: T('flow and change, even in polar night', 'fluxo e mudança, até na noite polar', 'flujo y cambio, incluso en la noche polar') },
    { n: T('Wetlands and floods', 'Áreas úmidas e enchentes', 'Humedales e inundaciones'), d: T('water under vegetation', 'água sob a vegetação', 'agua bajo la vegetación') },
    { n: T('Crops and soil moisture', 'Lavouras e umidade do solo', 'Cultivos y humedad del suelo'), d: T('growth cycles and water stress', 'ciclos de crescimento e estresse hídrico', 'ciclos de crecimiento y estrés hídrico') },
    { n: T('Forest biomass', 'Biomassa florestal', 'Biomasa forestal'), d: T('the carbon in trunks and branches (L-band)', 'o carbono em troncos e galhos (banda L)', 'el carbono en troncos y ramas (banda L)') },
  ]
  const next = [T('An interferometry layer for ground motion', 'Uma camada de interferometria para movimento do solo', 'Una capa de interferometría para movimiento del suelo'), T('Ascending and descending passes together', 'Passagens ascendentes e descendentes juntas', 'Pasadas ascendentes y descendentes juntas'), T('Population and land-use overlays', 'Camadas de população e uso do solo', 'Capas de población y uso del suelo')]
  return (
    <div className="imp fu">
      {rows.map((r, k) => (
        <div key={k} style={{ ['--c' as string]: '#5eead4', animationDelay: `${k * 0.1}s` }}><i /><p><b>{tx(r.n)}</b><span>{tx(r.d)}</span></p></div>
      ))}
      <h4 className="mono">{tx(T('SARIS next', 'SARIS a seguir', 'SARIS a continuación'))}</h4>
      {next.map((n, k) => <div key={`n${k}`} style={{ ['--c' as string]: '#fbbf24', animationDelay: `${(rows.length + k) * 0.1}s` }}><i /><p><b>{tx(n)}</b></p></div>)}
    </div>
  )
}
