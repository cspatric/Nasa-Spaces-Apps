import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Tri } from '../components/Deck'
import { sound } from '../lib/sound'
import { T, rng, useTx } from './helpers'

/** Numbers that count up when they appear. */
function useCount(to: number) {
  const [n, setN] = useState(0)
  useEffect(() => {
    let i = 0
    const id = setInterval(() => { i++; setN(Math.round((to * i) / 24)); if (i >= 24) clearInterval(id) }, 30)
    return () => clearInterval(id)
  }, [to])
  return n
}
function Num({ to }: { to: number }) { return <b>{useCount(to)}</b> }

export function Metrics({ items }: { items: { n: number | string; label: Tri }[] }) {
  const tx = useTx()
  return (
    <div className="metrics">
      {items.map((m, k) => (
        <div className="metric" key={k}>{typeof m.n === 'number' ? <Num to={m.n} /> : <b>{m.n}</b>}<span>{tx(m.label)}</span></div>
      ))}
    </div>
  )
}

export function Tiles({ items }: { items: { title: Tri; text: Tri }[] }) {
  const tx = useTx()
  return (
    <div className="tiles">
      {items.map((it, k) => (
        <div className="tile" key={k}><span className="n mono">{String(k + 1).padStart(2, '0')}</span><div><b>{tx(it.title)}</b><span>{tx(it.text)}</span></div></div>
      ))}
    </div>
  )
}

interface Option { id: string; label: Tri; text: Tri; color?: string }
/** Pick one of several options; what it means is read below. */
export function Picker({ options, hint, after }: { options: Option[]; hint: Tri; after?: (id: string | null) => ReactNode }) {
  const tx = useTx()
  const [sel, setSel] = useState<string | null>(null)
  const cur = options.find((o) => o.id === sel)
  return (
    <>
      <div className="opts">
        {options.map((o) => (
          <button key={o.id} className={`opt ${sel === o.id ? 'on' : ''}`} onClick={() => { sound.ping(); setSel(o.id) }}>
            {o.color && <i style={{ background: o.color }} />}{tx(o.label)}
          </button>
        ))}
      </div>
      {after?.(sel)}
      <div className="read" style={cur?.color ? { borderLeftColor: cur.color } : undefined}>{cur ? tx(cur.text) : <span style={{ color: 'var(--mut)' }}>{tx(hint)}</span>}</div>
    </>
  )
}

export function ScoreBars({ items, delay = 500 }: { items: { label: Tri; v: number; c: string }[]; delay?: number }) {
  const tx = useTx()
  const [on, setOn] = useState(false)
  useEffect(() => { const id = setTimeout(() => setOn(true), delay); return () => clearTimeout(id) }, [delay])
  return (
    <div className="bars">
      {items.map((s, k) => (
        <div className="bar" key={k}><i style={{ width: on ? `${s.v}%` : 0, background: s.c, transitionDelay: `${k * 0.25}s`, opacity: 0.85 }} /><span>{tx(s.label)}</span><em>{on ? `${s.v} %` : ''}</em></div>
      ))}
    </div>
  )
}

export function SayAvoid({ say, avoid, sayLabel, avoidLabel }: { say: Tri[]; avoid: Tri[]; sayLabel: Tri; avoidLabel: Tri }) {
  const tx = useTx()
  return (
    <div className="twocol">
      <div className="box yes"><b>{tx(sayLabel)}</b>{say.map((s, k) => <div key={k}>{tx(s)}</div>)}</div>
      <div className="box no"><b>{tx(avoidLabel)}</b>{avoid.map((s, k) => <div key={k}>{tx(s)}</div>)}</div>
    </div>
  )
}

export function TimelineList({ items }: { items: { when: string; text: Tri }[] }) {
  const tx = useTx()
  return <div className="tl">{items.map((e, k) => <div key={k}><b className="mono">{e.when}</b>{tx(e.text)}</div>)}</div>
}

/** Optical light is stopped by cloud; the radar pulse goes through. */
export function CloudRadar() {
  const tx = useTx()
  return (
    <svg className="svg" viewBox="0 0 520 300" role="img" aria-label="Optical ray blocked by clouds, radar ray passing through">
      <defs>
        <linearGradient id="cr-g" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#3be0c5" stopOpacity=".9" /><stop offset="1" stopColor="#3be0c5" stopOpacity=".15" /></linearGradient>
        <filter id="cr-b"><feGaussianBlur stdDeviation="4" /></filter>
      </defs>
      <rect x="0" y="262" width="520" height="38" fill="#0b2a22" /><path d="M0 262 L520 262" stroke="#3be0c5" strokeOpacity=".5" />
      <g fill="#cfd9ee" opacity=".92" filter="url(#cr-b)"><ellipse cx="150" cy="130" rx="95" ry="26" /><ellipse cx="220" cy="118" rx="70" ry="24" /><ellipse cx="370" cy="132" rx="100" ry="26" /><ellipse cx="440" cy="120" rx="60" ry="22" /></g>
      <g fontFamily="ui-monospace,Menlo,monospace" fontSize="11" fill="#7f8fab"><text x="20" y="32">{tx(T('OPTICAL', 'ÓPTICO', 'ÓPTICO'))}</text><text x="300" y="32">RADAR</text></g>
      <rect x="120" y="42" width="60" height="22" fill="#e7b04a" opacity=".9" /><rect x="400" y="42" width="60" height="22" fill="#3be0c5" opacity=".9" />
      <path d="M150 64 L150 112" stroke="#e7b04a" strokeWidth="3" strokeDasharray="5 4"><animate attributeName="stroke-dashoffset" from="18" to="0" dur="1s" repeatCount="indefinite" /></path>
      <text x="150" y="160" textAnchor="middle" fill="#e7b04a" fontSize="12" fontFamily="ui-monospace,Menlo,monospace">{tx(T('blocked', 'bloqueado', 'bloqueado'))}</text>
      <path d="M430 64 L430 262" stroke="url(#cr-g)" strokeWidth="4"><animate attributeName="stroke-dasharray" values="0 200;200 0" dur="1.6s" repeatCount="indefinite" /></path>
      <circle cx="430" cy="262" r="6" fill="#3be0c5"><animate attributeName="r" values="4;14;4" dur="1.6s" repeatCount="indefinite" /><animate attributeName="opacity" values="1;.1;1" dur="1.6s" repeatCount="indefinite" /></circle>
      <text x="430" y="288" textAnchor="middle" fill="#3be0c5" fontSize="12" fontFamily="ui-monospace,Menlo,monospace">{tx(T('echo back', 'o eco volta', 'vuelve el eco'))}</text>
    </svg>
  )
}

/** The NISAR drawing: a dish, a body, two solar panels, and pulses going down. */
export function Dish() {
  return (
    <svg className="svg" viewBox="0 0 400 270" role="img" aria-label="NISAR satellite sending radar pulses to the ground">
      <defs><radialGradient id="dd-g" cx=".5" cy=".4"><stop offset="0" stopColor="#f3dfa0" /><stop offset="1" stopColor="#b3862b" /></radialGradient></defs>
      <path d="M0 238 Q200 196 400 238 V270 H0Z" fill="#0b2a22" stroke="#3be0c5" strokeOpacity=".4" />
      {[0, 0.8, 1.6].map((d) => (
        <ellipse key={d} cx="200" cy="140" rx="120" ry="92" fill="none" stroke="#3be0c5" strokeWidth="1.5" opacity="0"><animate attributeName="opacity" values="0;.8;0" dur="2.4s" begin={`${d}s`} repeatCount="indefinite" /><animate attributeName="rx" values="20;130" dur="2.4s" begin={`${d}s`} repeatCount="indefinite" /><animate attributeName="ry" values="16;100" dur="2.4s" begin={`${d}s`} repeatCount="indefinite" /></ellipse>
      ))}
      <g>
        <line x1="200" y1="112" x2="200" y2="78" stroke="#7f8fab" strokeWidth="3" />
        <ellipse cx="200" cy="58" rx="92" ry="32" fill="url(#dd-g)" stroke="#fff" strokeOpacity=".4" />
        <g stroke="#6b4a10" strokeWidth="1" opacity=".6"><line x1="108" y1="58" x2="292" y2="58" /><line x1="200" y1="26" x2="200" y2="90" /></g>
        <rect x="165" y="112" width="70" height="44" fill="#c9d4ea" /><rect x="172" y="120" width="56" height="7" fill="#3be0c5" />
        <g fill="#1d3b86" stroke="#6f9bff"><rect x="26" y="120" width="130" height="28" /><rect x="244" y="120" width="130" height="28" /></g>
        <g stroke="#6f9bff" strokeWidth=".7"><path d="M52 120v28M78 120v28M104 120v28M130 120v28M270 120v28M296 120v28M322 120v28M348 120v28" /></g>
      </g>
    </svg>
  )
}

/** A surface picker with an echo strength meter. */
export function Echo({ items }: { items: { id: string; label: Tri; strength: number; text: Tri }[] }) {
  const tx = useTx()
  const [sel, setSel] = useState<string | null>(null)
  const cur = items.find((i) => i.id === sel)
  return (
    <>
      <div className="opts">
        {items.map((o) => <button key={o.id} className={`opt ${sel === o.id ? 'on' : ''}`} onClick={() => { sound.ping(); setSel(o.id) }}>{tx(o.label)}</button>)}
      </div>
      <div className="bars"><div className="bar"><i style={{ width: `${cur?.strength ?? 0}%`, background: 'linear-gradient(90deg,#3be0c5,#e7b04a)', transition: 'width .8s' }} /><span>{tx(T('Echo strength', 'Intensidade do eco', 'Intensidad del eco'))}</span><em>{cur ? cur.strength : ''}</em></div></div>
      <div className="read">{cur ? tx(cur.text) : <span style={{ color: 'var(--mut)' }}>{tx(T('Tap a surface to see the echo.', 'Toque numa superfície para ver o eco.', 'Toca una superficie para ver el eco.'))}</span>}</div>
    </>
  )
}

const N = 48
/** An illustrative radar scene and a second date with three patches of change. */
function useScenes() {
  return useMemo(() => {
    const R = rng(11)
    const A: number[] = [], B: number[] = [], IN: boolean[] = []
    let inside = 0
    const blobs = [[13, 14, 6], [33, 20, 7], [22, 37, 5]]
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      let v = 0.45 + 0.17 * Math.sin(x / 5.3) * Math.cos(y / 6.1) + 0.1 * Math.sin((x + y) / 3.7)
      if (Math.abs(y - (0.55 * N + 8 * Math.sin(x / 7))) < 3.4) v = 0.08 + 0.04 * R()
      let ch = 0
      for (const b of blobs) { const d = Math.hypot(x - b[0], y - b[1]); if (d < b[2]) ch += 0.5 * (1 - d / b[2]) + 0.12 }
      A.push(v + (R() - 0.5) * 0.16); B.push(v + ch + (R() - 0.5) * 0.16); IN.push(ch > 0.1)
      if (ch > 0.1) inside++
    }
    return { A, B, IN, inside }
  }, [])
}
function paint(c: HTMLCanvasElement | null, arr: number[]) {
  const g = c?.getContext('2d')
  if (!g) return
  const im = g.createImageData(N, N)
  arr.forEach((v, i) => { const k = Math.max(0, Math.min(255, v * 255 * 1.25)); im.data.set([k * 0.45, k, k * 0.82, 255], i * 4) })
  g.putImageData(im, 0, 0)
}

export function PixelGrid() {
  const tx = useTx()
  const { A } = useScenes()
  const ref = useRef<HTMLCanvasElement>(null)
  const [read, setRead] = useState<string | null>(null)
  useEffect(() => paint(ref.current, A), [A])
  const rd = (e: { clientX: number; clientY: number }) => {
    const c = ref.current
    if (!c) return
    const r = c.getBoundingClientRect()
    const x = Math.min(N - 1, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * N)))
    const y = Math.min(N - 1, Math.max(0, Math.floor(((e.clientY - r.top) / r.height) * N)))
    const db = -22 + A[y * N + x] * 20
    setRead(`(${x}, ${y})  ·  ${Math.pow(10, db / 10).toFixed(3)}  →  ${db.toFixed(1)} dB`)
  }
  return (
    <>
      <canvas ref={ref} className="px" width={N} height={N} onMouseMove={rd} onClick={rd} onTouchStart={(e) => rd(e.touches[0])} style={{ maxHeight: '42vh', width: 'auto', maxWidth: '100%', alignSelf: 'center', aspectRatio: '1' }} />
      <div className="read mono" style={{ fontSize: 13 }}>{read ?? tx(T('Touch or hover the image to read a pixel. (illustrative)', 'Toque ou passe o mouse na imagem para ler um pixel. (ilustrativo)', 'Toca o pasa el ratón por la imagen para leer un píxel. (ilustrativo)'))}</div>
      <div className="row"><span>{tx(T('linear value → decibels: dB = 10 × log10(value)', 'valor linear → decibéis: dB = 10 × log10(valor)', 'valor lineal → decibeles: dB = 10 × log10(valor)'))}</span></div>
    </>
  )
}

export function TwoDates() {
  const tx = useTx()
  const { A, B, IN, inside } = useScenes()
  const cb = useRef<HTMLCanvasElement>(null), ca = useRef<HTMLCanvasElement>(null), cc = useRef<HTMLCanvasElement>(null)
  const [wipe, setWipe] = useState(50)
  const [th, setTh] = useState(22)
  useEffect(() => { paint(cb.current, A); paint(ca.current, B) }, [A, B])
  const stats = useMemo(() => {
    const t = th / 100
    let hit = 0, fa = 0
    for (let i = 0; i < N * N; i++) if (Math.abs(B[i] - A[i]) > t) { if (IN[i]) hit++; else fa++ }
    return { hit: Math.round((hit / inside) * 100), fa, t }
  }, [th, A, B, IN, inside])
  useEffect(() => {
    const g = cc.current?.getContext('2d')
    if (!g) return
    const im = g.createImageData(N, N)
    for (let i = 0; i < N * N; i++) if (Math.abs(B[i] - A[i]) > stats.t) im.data.set([255, 80, 120, 235], i * 4)
    g.putImageData(im, 0, 0)
  }, [stats.t, A, B])
  return (
    <>
      <div className="stack" style={{ maxHeight: '36vh', aspectRatio: '1', alignSelf: 'center', width: 'min(100%, 36vh)' }}>
        <canvas ref={cb} className="px" width={N} height={N} />
        <canvas ref={ca} className="px" width={N} height={N} style={{ clipPath: `inset(0 0 0 ${wipe}%)` }} />
        <canvas ref={cc} className="px ov" width={N} height={N} />
      </div>
      <div className="row mono"><span>◀ 21 OCT</span><span>2 NOV ▶</span></div>
      <input type="range" min={0} max={100} value={wipe} onChange={(e) => setWipe(+e.target.value)} aria-label="Wipe" />
      <div className="row"><b style={{ color: 'var(--fg)' }}>{tx(T('Change threshold', 'Limiar de mudança', 'Umbral de cambio'))}</b><span>&gt; {(stats.t * 10).toFixed(1)} dB</span></div>
      <input type="range" min={4} max={60} value={th} onChange={(e) => setTh(+e.target.value)} onMouseUp={() => sound.ping()} aria-label="Threshold" />
      <div className="metrics">
        <div className="metric"><b>{stats.hit}%</b><span>{tx(T('of the real change found', 'da mudança real encontrada', 'del cambio real encontrado'))}</span></div>
        <div className="metric"><b style={{ color: 'var(--red)' }}>{stats.fa}</b><span>{tx(T('false alarms (noise)', 'alarmes falsos (ruído)', 'falsas alarmas (ruido)'))}</span></div>
      </div>
    </>
  )
}

/** Claims and how far each can climb the evidence ladder. */
export function Claims({ claims, ladder, hint }: { claims: { id: string; text: Tri; answer: Tri; ok?: boolean; marks: Record<number, 'hit' | 'far'> }[]; ladder: Tri[]; hint: Tri }) {
  const tx = useTx()
  const [sel, setSel] = useState<string | null>(null)
  const cur = claims.find((c) => c.id === sel)
  return (
    <>
      <div className="tiles">
        {claims.map((c) => <button key={c.id} className={`opt ${sel === c.id ? 'on' : ''}`} onClick={() => { if (c.ok) sound.success(); else sound.alert(); setSel(c.id) }}>{tx(c.text)}</button>)}
      </div>
      <div className={`read ${cur && !cur.ok ? 'bad' : ''}`}>{cur ? tx(cur.answer) : <span style={{ color: 'var(--mut)' }}>{tx(hint)}</span>}</div>
      <ol className="ladder">{ladder.map((l, k) => <li key={k} className={cur?.marks[k + 1] ?? ''}>{k + 1} · {tx(l)}</li>)}</ol>
    </>
  )
}

export function RainLag() {
  const tx = useTx()
  const { rain, rad } = useMemo(() => {
    const R = rng(5)
    const rain: number[] = [], rad: number[] = []
    for (let i = 0; i < 30; i++) rain.push(R() < 0.3 ? 8 + R() * 22 : R() * 3)
    for (let i = 0; i < 30; i++) rad.push(-9 + 0.1 * (i >= 2 ? rain[i - 2] : 0) + (R() - 0.5) * 1.4)
    return { rain, rad }
  }, [])
  const [lag, setLag] = useState(0)
  const r = useMemo(() => {
    const a: number[] = [], b: number[] = []
    for (let i = lag; i < 30; i++) { a.push(rain[i - lag]); b.push(rad[i]) }
    const n = a.length, ma = a.reduce((x, y) => x + y) / n, mb = b.reduce((x, y) => x + y) / n
    let sa = 0, sb = 0, sab = 0
    for (let i = 0; i < n; i++) { sa += (a[i] - ma) ** 2; sb += (b[i] - mb) ** 2; sab += (a[i] - ma) * (b[i] - mb) }
    return sab / Math.sqrt(sa * sb)
  }, [lag, rain, rad])
  return (
    <>
      <svg className="svg" viewBox="0 0 600 210" role="img" aria-label="Rain bars and radar line with an adjustable lag">
        <line x1="14" y1="190" x2="590" y2="190" stroke="#7f8fab" opacity=".4" />
        {rain.map((v, i) => { const x = 20 + (i + lag) * 19; return x > 580 ? null : <rect key={i} x={x} y={190 - v * 4.4} width="11" height={v * 4.4} fill="#6f9bff" opacity=".75" /> })}
        <polyline points={rad.map((v, i) => `${25 + i * 19},${180 - (v + 10) * 40}`).join(' ')} fill="none" stroke="#3be0c5" strokeWidth="3" strokeLinejoin="round" />
      </svg>
      <input type="range" min={0} max={6} value={lag} onChange={(e) => setLag(+e.target.value)} onMouseUp={() => sound.ping()} aria-label="Lag" />
      <div className="row"><b style={{ color: 'var(--fg)' }}>{tx(T('Lag', 'Defasagem', 'Desfase'))}: {lag} {tx(T('days', 'dias', 'días'))}</b><b style={{ color: 'var(--acc)', fontSize: 26 }}>r = {r.toFixed(2)}</b></div>
      <div className="row"><span>{tx(T('Illustrative series: it shows association, never cause.', 'Série ilustrativa: mostra associação, nunca causa.', 'Serie ilustrativa: muestra asociación, nunca causa.'))}</span></div>
    </>
  )
}

export function ModelChoice() {
  const tx = useTx()
  const [m, setM] = useState<'a' | 'b' | null>(null)
  return (
    <>
      <div className="opts">
        <button className={`opt ${m === 'a' ? 'on' : ''}`} onClick={() => { sound.success(); setM('a') }}>{tx(T('Model improves', 'O modelo melhora', 'El modelo mejora'))}</button>
        <button className={`opt ${m === 'b' ? 'on' : ''}`} onClick={() => { sound.alert(); setM('b') }}>{tx(T('Model does not improve', 'O modelo não melhora', 'El modelo no mejora'))}</button>
      </div>
      <div className="bars">
        <div className="bar"><i style={{ width: m ? '70%' : 0, background: '#6f9bff', opacity: 0.85 }} /><span>{tx(T('Baseline error', 'Erro da referência', 'Error de la referencia'))}</span></div>
        <div className="bar"><i style={{ width: m ? (m === 'a' ? '42%' : '84%') : 0, background: m === 'b' ? '#f87171' : '#3be0c5', opacity: 0.85 }} /><span>{tx(T('Model error', 'Erro do modelo', 'Error del modelo'))}</span></div>
      </div>
      <div className={`read ${m === 'b' ? 'bad' : ''}`}>
        {m === 'a' && tx(T('The model beat the baseline on unseen dates, so the map shows its layer next to the baseline scoreboard.', 'O modelo venceu a referência em datas que nunca viu, então o mapa mostra a camada dele ao lado do placar da referência.', 'El modelo superó la referencia en fechas que nunca vio, así que el mapa muestra su capa junto al marcador de la referencia.'))}
        {m === 'b' && tx(T('The model did not beat the baseline, so the map shows the baseline and the report explains why. That is a valid, honest result.', 'O modelo não venceu a referência, então o mapa mostra a referência e o relatório explica por quê. É um resultado válido e honesto.', 'El modelo no superó la referencia, así que el mapa muestra la referencia y el informe explica por qué. Es un resultado válido y honesto.'))}
        {!m && <span style={{ color: 'var(--mut)' }}>{tx(T('Try both outcomes.', 'Teste os dois resultados.', 'Prueba los dos resultados.'))}</span>}
      </div>
    </>
  )
}

export function SegmentBar({ parts }: { parts: { w: number; label: Tri; color: string; hatch?: boolean }[] }) {
  const tx = useTx()
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', height: 46, gap: 3 }}>
        {parts.map((p, k) => (
          <div key={k} style={{ flex: p.w, background: p.hatch ? `repeating-linear-gradient(135deg, ${p.color}aa 0 3px, ${p.color}22 3px 8px)` : p.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#04121a', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            <span style={{ color: p.hatch ? p.color : '#04121a' }}>{tx(p.label)}</span>
          </div>
        ))}
      </div>
      <div className="row mono"><span>2016</span><span>2026</span><span>2030</span></div>
    </div>
  )
}

/** Air currents, drawn as streamlines that flow from the Atlantic (right) over the basin to the Andes (left). */
export function Flow() {
  const tx = useTx()
  const lines = Array.from({ length: 11 }, (_, k) => {
    const y = 40 + k * 20
    const bend = (k % 2 ? 1 : -1) * (12 + (k % 3) * 8)
    return `M 560 ${y + 20} C 430 ${y + bend}, 300 ${y - bend}, 40 ${y - 6 + (k - 5) * 3}`
  })
  return (
    <svg className="svg" viewBox="0 0 600 280" role="img" aria-label="Air currents flowing over the Amazon">
      <defs><linearGradient id="fl-g" x1="1" x2="0"><stop offset="0" stopColor="#3be0c5" stopOpacity=".1" /><stop offset=".5" stopColor="#3be0c5" /><stop offset="1" stopColor="#ffffff" stopOpacity=".8" /></linearGradient></defs>
      <rect x="0" y="0" width="600" height="280" fill="none" />
      {lines.map((d, k) => (
        <path key={k} d={d} fill="none" stroke="url(#fl-g)" strokeWidth="2" strokeLinecap="round" strokeDasharray="14 22" opacity={0.45 + (k % 3) * 0.2}>
          <animate attributeName="stroke-dashoffset" from="72" to="0" dur={`${3.2 + (k % 4) * 0.5}s`} repeatCount="indefinite" />
        </path>
      ))}
      <g fontFamily="ui-monospace,Menlo,monospace" fontSize="11" fill="#7f8fab"><text x="498" y="268">{tx(T('ATLANTIC', 'ATLÂNTICO', 'ATLÁNTICO'))}</text><text x="20" y="268">ANDES</text></g>
    </svg>
  )
}

/** A picture of the assistant bar with commands you could type. */
export function AskMock({ lines }: { lines: Tri[] }) {
  const tx = useTx()
  const [i, setI] = useState(0)
  useEffect(() => { const id = setInterval(() => setI((v) => (v + 1) % lines.length), 2600); return () => clearInterval(id) }, [lines.length])
  return (
    <>
      <div style={{ border: '1px solid var(--acc)', background: 'rgba(5,9,18,.9)', padding: '16px 18px', boxShadow: '0 0 40px rgba(59,224,197,.18)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ color: 'var(--acc)', fontSize: 20 }}>✦</span>
        <span key={i} style={{ fontSize: 18, color: '#e6eefc' }}>{tx(lines[i])}<span className="cursor" style={{ display: 'inline-block', width: 7, height: '1em', background: 'var(--acc)', marginLeft: 3, verticalAlign: -2 }} /></span>
      </div>
      <div className="opts">{lines.map((l, k) => <div key={k} className={`opt ${k === i ? 'on' : ''}`} style={{ cursor: 'default', fontSize: 13 }}>{tx(l)}</div>)}</div>
    </>
  )
}
