import { useEffect, useRef, useState } from 'react'
import { OVERLAYS } from '../lib/catalog'
import { LANGS, useI18n } from '../lib/i18n'
import { sound } from '../lib/sound'
import Link from '../components/Link'
import './Story.css'

/** Fade-in as each block scrolls into view. */
function useReveal() {
  useEffect(() => {
    const els = [...document.querySelectorAll('.story .rv')]
    const io = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } }), { threshold: 0.12 })
    els.forEach((e) => io.observe(e))
    return () => io.disconnect()
  }, [])
}

/** A number that counts up when it appears. */
function Count({ to }: { to: number }) {
  const ref = useRef<HTMLElement>(null)
  const [n, setN] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let id = 0
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      let i = 0
      id = window.setInterval(() => { i++; setN(Math.round((to * i) / 24)); if (i >= 24) clearInterval(id) }, 35)
    })
    io.observe(el)
    return () => { io.disconnect(); clearInterval(id) }
  }, [to])
  return <b ref={el => { ref.current = el }}>{n}</b>
}

function Stars() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const g = c.getContext('2d')!
    let stars: number[][] = []
    let raf = 0
    const size = () => {
      c.width = c.offsetWidth
      c.height = c.offsetHeight
      stars = Array.from({ length: 120 }, () => [Math.random() * c.width, Math.random() * c.height, Math.random() * 1.6 + 0.3, Math.random() * 6.28])
    }
    size()
    window.addEventListener('resize', size)
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches
    const draw = (t: number) => {
      g.clearRect(0, 0, c.width, c.height)
      for (const s of stars) {
        g.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t / 900 + s[3]))
        g.fillStyle = '#fff'
        g.fillRect(s[0], (s[1] + t * 0.004 * s[2]) % c.height, s[2], s[2])
      }
      if (!still) raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', size) }
  }, [])
  return <canvas ref={ref} className="stars" aria-hidden="true" />
}

const RISKS: { id: string; name: string; text: string }[] = [
  { id: 'veg', name: 'Vegetation loss', text: 'A lasting drop of the cross-polarized radar after the yearly cycle is removed: the signature of cleared or degraded vegetation.' },
  { id: 'flood', name: 'Flood', text: 'Past flood-like radar, rain of the last months against the place’s own climate, and the forecast wet season.' },
  { id: 'fire', name: 'Drought and fire', text: 'A standardised 3-month rain index and the rain forecast of the next six months.' },
  { id: 'odd', name: 'Unusual change', text: 'Months that do not look like the rest of the history, found by an Isolation Forest.' },
]
const DISASTERS: { id: string; name: string; text: string }[] = [
  { id: 'q', name: 'Earthquake', text: 'Shaking falls with distance from the focus; zones from intensity IX down to V.' },
  { id: 'f', name: 'Flood', text: 'Water rises above the ground; everything lower than that level within 20 km floods.' },
  { id: 'w', name: 'Wildfire', text: 'A wind-driven ellipse that grows with the hours and the dryness of the fuel.' },
  { id: 's', name: 'Storm', text: 'A swath of damaging wind along a track, sized by the peak gust.' },
]
const REGIONS = [
  { id: 'amazon', name: 'Amazon', level: 'Moderate', what: 'drought and fire (Tapajós)' },
  { id: 'sp', name: 'São Paulo', level: 'Moderate', what: 'unusual change (São Paulo city)' },
  { id: 'rs', name: 'Rio Grande do Sul', level: 'Moderate', what: 'unusual change (Caxias do Sul)' },
]
const SCORES = [{ k: 'Simple rule', v: 54, c: '#7aa2ff' }, { k: 'Radar only', v: 73, c: '#ffb938' }, { k: 'Radar + ground color', v: 85, c: '#27e0c4' }]

export default function Story() {
  const { t, lang, setLang } = useI18n()
  const [layer, setLayer] = useState(OVERLAYS[0].id)
  const [risk, setRisk] = useState<string | null>(null)
  const [dis, setDis] = useState<string | null>(null)
  const [shown, setShown] = useState(false)
  const [progress, setProgress] = useState(0)
  useReveal()
  useEffect(() => {
    const f = () => {
      const h = document.documentElement
      setProgress((h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight)) * 100)
    }
    window.addEventListener('scroll', f, { passive: true })
    return () => window.removeEventListener('scroll', f)
  }, [])
  const chosen = OVERLAYS.find((o) => o.id === layer)!
  const pick = (fn: () => void) => () => { sound.ping(); fn() }

  return (
    <div className="story">
      <div className="progress" style={{ width: `${progress}%` }} />
      <nav className="top">
        <div className="lang-switch" role="group" aria-label={t('Language')}>
          {LANGS.map((l) => <button key={l.id} className={lang === l.id ? 'on' : ''} title={l.name} onClick={() => setLang(l.id)}>{l.label}</button>)}
        </div>
        <Link to="/mapa" className="skip">{t('Skip to the map')} →</Link>
      </nav>

      <header className="hero">
        <Stars />
        <div>
          <div className="kick">{t('NASA Space Apps 2026 · Dancing with the SARs')}</div>
          <h1><span className="w">{t('Surface change observatory')}</span><span className="sars"><span>S</span><span>A</span><span>R</span><span>I</span><span>S</span></span></h1>
          <p className="sub">{t('A 3D observatory that uses radar to show how the land changes, from the Amazon to the south, and says honestly how sure it is.')}</p>
          <a className="go" href="#s1" onClick={sound.ping}>{t('Start the story ↓')}</a>
        </div>
      </header>

      <main>
        <section id="s1">
          <div className="tag rv">{t('The question')}</div>
          <h2 className="rv">{t('How does the ground change when nobody is looking?')}</h2>
          <p className="rv">{t('Forests are cleared, rivers rise, soil dries. Optical satellites go blind under clouds, and the Amazon is cloudy most of the year. Radar makes its own light, so it keeps watching day and night.')}</p>
          <div className="chips">
            <div className="chip rv"><Count to={OVERLAYS.length} /><span>{t('NASA layers on the map')}</span></div>
            <div className="chip rv"><Count to={10} /><span>{t('years of radar history, from 2016')}</span></div>
            <div className="chip rv"><Count to={51} /><span>{t('places the model learned from')}</span></div>
            <div className="chip rv"><Count to={3} /><span>{t('regions forecast ahead of time')}</span></div>
          </div>
        </section>

        <section id="s2">
          <div className="tag rv">{t('What we built')}</div>
          <div className="three">
            <div className="card rv"><b>{t('A 3D observatory')}</b><p>{t('Real relief, buildings and streets, only over South and Central America, where the study is.')}</p></div>
            <div className="card rv"><b>{t('Live data')}</b><p>{t('NISAR and OPERA radar and IMERG rain are read from the backend around the date you choose.')}</p></div>
            <div className="card rv"><b>{t('A timeline to 2030')}</b><p>{t('Observed data until today, scenarios after it, never mixed.')}</p></div>
          </div>
        </section>

        <section id="s3">
          <div className="tag rv">{t('Chapter 1 · NASA layers')}</div>
          <h2 className="rv">{t('Pick a layer and learn what it shows')}</h2>
          <div className="card rv">
            <div className="btns">
              {OVERLAYS.map((o) => (
                <button key={o.id} className={`btn ${layer === o.id ? 'on' : ''}`} onClick={pick(() => setLayer(o.id))}>
                  <i className="dot" style={{ background: o.color }} />{t(o.label)}
                </button>
              ))}
            </div>
            <div className="fb" style={{ borderColor: chosen.color }}><b style={{ color: chosen.color }}>{t(chosen.label)}</b> · {t(chosen.hint)}</div>
          </div>
          <p className="cap rv">{t('Every layer keeps one color at every zoom, so you always know what you are looking at.')}</p>
        </section>

        <section id="s4">
          <div className="tag rv">{t('Chapter 2 · Forecast')}</div>
          <h2 className="rv">{t('A model has to earn its place')}</h2>
          <p className="rv">{t('From the history of a place the model forecasts radar and rain to 2030, with an 80 % band. It only counts if it beats a simple reference on places and dates it has never seen.')}</p>
          <div className="card rv">
            <p className="cap">{t('Recognising what a place is (forest, other vegetation, city, water), tested on places the model never saw:')}</p>
            <div className="bars">
              {SCORES.map((s) => (
                <div className="bar2" key={s.k}><i style={{ width: shown ? `${s.v}%` : 0, background: s.c }} /><span>{t(s.k)} · {shown ? `${s.v} %` : '?'}</span></div>
              ))}
            </div>
            <button className="btn" onClick={pick(() => setShown(true))} disabled={shown}>{t('Show the result')}</button>
          </div>
        </section>

        <section id="s5">
          <div className="tag rv">{t('Chapter 3 · Risks')}</div>
          <h2 className="rv">{t('Where to look first')}</h2>
          <p className="rv">{t('Pick a risk to see which signal it reads:')}</p>
          <div className="card rv">
            <div className="btns">
              {RISKS.map((r) => <button key={r.id} className={`btn ${risk === r.id ? 'on' : ''}`} onClick={pick(() => setRisk(r.id))}>{t(r.name)}</button>)}
            </div>
            {risk && <div className="fb">{t(RISKS.find((r) => r.id === risk)!.text)}</div>}
          </div>
          <p className="cap rv">{t('These are screening signals: they say where to look first, not that an event will happen.')}</p>
        </section>

        <section id="s6">
          <div className="tag rv">{t('Chapter 4 · Ready-made regions')}</div>
          <h2 className="rv">{t('Forecasts that are already waiting for you')}</h2>
          <p className="rv">{t('Computed ahead of time from sample places, so nothing loads when you open them.')}</p>
          <div className="three">
            {REGIONS.map((r) => (
              <div className="card rv" key={r.id}><b>{t(r.name)}</b><div><span className="chip-level">{t(r.level)}</span></div><p className="cap">{t(r.what)}</p></div>
            ))}
          </div>
        </section>

        <section id="s7">
          <div className="tag rv">{t('Chapter 5 · What if?')}</div>
          <h2 className="rv">{t('See the size of a disaster')}</h2>
          <p className="rv">{t('Place an event on the map and watch its damage zones grow, with the area and the buildings inside each zone. They are simulations, never forecasts.')}</p>
          <div className="card rv">
            <div className="btns">
              {DISASTERS.map((d) => <button key={d.id} className={`btn ${dis === d.id ? 'on' : ''}`} onClick={pick(() => setDis(d.id))}>{t(d.name)}</button>)}
            </div>
            {dis && <div className="fb">{t(DISASTERS.find((d) => d.id === dis)!.text)}</div>}
          </div>
        </section>

        <section id="s8" style={{ borderBottom: 0 }}>
          <div className="tag rv">{t('The honest ending')}</div>
          <h2 className="rv">{t('What we say, and what we don’t')}</h2>
          <div className="two">
            <div className="card ok rv"><b>{t('We say')}</b><p>{t('“A change in the radar response.”')}<br />{t('“A forecast with an 80 % band.”')}<br />{t('“A simulated scenario, with uncertainty.”')}</p></div>
            <div className="card no rv"><b>{t('We avoid')}</b><p>{t('“NISAR detected deforestation.”')}<br />{t('“This place will flood in 2028.”')}<br />{t('“The model is always right.”')}</p></div>
          </div>
        </section>

        <div className="next rv">
          <div className="tag">{t('Next')}</div>
          <h2>{t('Meet the satellite')}</h2>
          <p className="cap">{t('One minute to understand what the radar hears.')}</p>
          <Link to="/satelite" className="go" onClick={sound.success}>{t('Open the satellite story →')}</Link>
          <p className="cap"><Link to="/mapa">{t('or go straight to the map')}</Link></p>
        </div>
      </main>
    </div>
  )
}
