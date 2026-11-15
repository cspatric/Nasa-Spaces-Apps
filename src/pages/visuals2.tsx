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
  const rows = [
    { l: T('Simple rule', 'Regra simples', 'Regla simple'), v: 54, c: '#6f9bff' },
    { l: T('Radar only', 'Só radar', 'Solo radar'), v: 73, c: '#a78bfa' },
    { l: T('Radar + ground color', 'Radar + cor do solo', 'Radar + color del suelo'), v: 85, c: '#3be0c5' },
  ]
  const steps = [T('Anomaly detector', 'Detector de anomalias', 'Detector de anomalías'), T('Strict acceptance', 'Aceite rigoroso', 'Aceptación estricta'), T('Anomaly map', 'Mapa de anomalias', 'Mapa de anomalías')]
  const outs = [
    { t: T('Anomaly layer', 'Camada de anomalia', 'Capa de anomalía'), d: T('a 0 to 1 score on the map', 'nota de 0 a 1 no mapa', 'nota de 0 a 1 en el mapa') },
    { t: T('Expected range', 'Faixa esperada', 'Rango esperado'), d: T('chart with the normal band', 'gráfico com a faixa normal', 'gráfico con la banda normal') },
    { t: T('Scorecard', 'Placar', 'Marcador'), d: T('model and rule side by side', 'modelo e regra lado a lado', 'modelo y regla lado a lado') },
  ]
  return (
    <>
      <div className="bars sc">
        {rows.map((r) => (
          <div key={r.l.en} className="bar"><i style={{ width: go ? `${r.v}%` : 0, background: r.c, opacity: 0.9 }} /><span>{tx(r.l)}</span><em>{r.v}%</em></div>
        ))}
      </div>
      <div className="sc-note">{tx(T('Land cover, places and years never seen · 16 rounds', 'Cobertura do solo, lugares e anos nunca vistos · 16 rodadas', 'Cobertura del suelo, lugares y años nunca vistos · 16 rondas'))}</div>
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
