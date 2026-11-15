import * as THREE from 'three'
import { createStage, glowTexture, makeEarth, makeNisar, makeStars, onSphere } from './space3d'

/**
 * The deck's backdrop is a small solar-system view you fly through, like a space explorer: the camera goes from the Sun
 * and the Moon down to the Earth, to NISAR and the other satellites that feed the map (each with its real orbit shape),
 * to the footprint of the radar beam on the Amazon, and out again. Every page of a deck is a waypoint.
 * Distances are exaggerated (a satellite 700 km up would be a speck) but orbits, inclinations and sensors are real.
 */

type V3 = THREE.Vector3
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z)
const Y = V(0, 1, 0)

export interface Waypoint { target: string; dist: number; az: number; el: number; shift?: number; down?: number }
const deg = (d: number) => (d * Math.PI) / 180

/** Camera positions. `az` 0 is in front of the target, 180 behind it; `el` is above its local horizon. `shift` moves the subject right (fraction of width). */
export const WAYPOINTS: Record<string, Waypoint> = {
  system: { target: 'earth', dist: 3.1, az: deg(58), el: deg(10), shift: 0.1, down: 0.4 },
  earth: { target: 'earth', dist: 3.6, az: deg(25), el: deg(18), shift: 0.12 },
  earthFar: { target: 'earth', dist: 5.4, az: deg(-40), el: deg(24), shift: 0.12 },
  amazon: { target: 'amazon', dist: 1.5, az: deg(0), el: deg(52), shift: 0.1 },
  southAmerica: { target: 'sa', dist: 1.9, az: deg(8), el: deg(62), shift: 0.02 },
  amazonLow: { target: 'amazon', dist: 0.9, az: deg(35), el: deg(30), shift: 0.1 },
  nisar: { target: 'nisar', dist: 0.46, az: deg(38), el: deg(12), shift: 0.05 },
  nisarWide: { target: 'nisar', dist: 1.7, az: deg(-55), el: deg(28), shift: 0.06 },
  beam: { target: 'beam', dist: 0.5, az: deg(-62), el: deg(10), shift: 0.05 },
  footprint: { target: 'footprint', dist: 0.2, az: deg(20), el: deg(48), shift: 0.1 },
  sentinel: { target: 'sentinel', dist: 0.42, az: deg(140), el: deg(16), shift: 0.1 },
  gpm: { target: 'gpm', dist: 0.38, az: deg(-30), el: deg(14), shift: 0.1 },
  smap: { target: 'smap', dist: 0.42, az: deg(60), el: deg(20), shift: 0.1 },
  viirs: { target: 'viirs', dist: 0.42, az: deg(-120), el: deg(16), shift: 0.1 },
}

/** Which waypoint each page flies to (by step id); a page not listed stays at the Earth. */
export const FOCUS: Record<string, string> = {
  cover: 'system', problem: 'amazon', meet: 'nisar', history: 'nisarWide', echo: 'beam', numbers: 'footprint', dates: 'amazonLow',
  claims: 'sentinel', rain: 'gpm', model: 'earthFar', honest: 'nisarWide', next: 'system',
  built: 'earth', layers: 'smap', wind: 'amazon', time: 'viirs', forecast: 'earthFar', risks: 'amazonLow', regions: 'amazon',
  assistant: 'earth', whatif: 'footprint', pixels: 'amazonLow', ml: 'amazonLow', validate: 'amazon', impact: 'southAmerica',
}
/** Pages where the 3D scene is the figure; the others keep a large instrument panel on the right. */
export const IMMERSIVE = new Set(['meet', 'history', 'built', 'time', 'honest', 'layers', 'impact'])

const LABELS: Record<string, { name: Record<string, string>; sub: string }> = {
  earth: { name: { en: 'Earth', pt: 'Terra', es: 'Tierra' }, sub: '' },
  amazon: { name: { en: 'Manaus · Amazon', pt: 'Manaus · Amazônia', es: 'Manaos · Amazonas' }, sub: '3.1°S 60°W' },
  nisar: { name: { en: 'NISAR · L-band radar', pt: 'NISAR · radar banda L', es: 'NISAR · radar banda L' }, sub: '747 km · 98.4°' },
  sentinel: { name: { en: 'Sentinel-1 · C-band radar', pt: 'Sentinel-1 · radar banda C', es: 'Sentinel-1 · radar banda C' }, sub: '693 km · OPERA' },
  gpm: { name: { en: 'GPM · rain', pt: 'GPM · chuva', es: 'GPM · lluvia' }, sub: '407 km · IMERG' },
  smap: { name: { en: 'SMAP · soil moisture', pt: 'SMAP · umidade do solo', es: 'SMAP · humedad del suelo' }, sub: '685 km' },
  viirs: { name: { en: 'NOAA-21 · VIIRS', pt: 'NOAA-21 · VIIRS', es: 'NOAA-21 · VIIRS' }, sub: '824 km · temp.' },
  andes: { name: { en: 'Andes', pt: 'Andes', es: 'Andes' }, sub: 'headwaters' },
  saopaulo: { name: { en: 'São Paulo', pt: 'São Paulo', es: 'São Paulo' }, sub: 'forecast ready' },
  riogrande: { name: { en: 'Rio Grande do Sul', pt: 'Rio Grande do Sul', es: 'Rio Grande do Sul' }, sub: 'forecast ready' },
  plata: { name: { en: 'Plata basin', pt: 'Bacia do Prata', es: 'Cuenca del Plata' }, sub: 'Paraguay · Uruguay · Argentina' },
  moon: { name: { en: 'Moon', pt: 'Lua', es: 'Luna' }, sub: '' },
  sun: { name: { en: 'Sun', pt: 'Sol', es: 'Sol' }, sub: '' },
}

// ---- geometry of the Earth in the scene -----------------------------------------------------------------------
const MANAUS = onSphere(-3.12, -60.02).normalize() // sphere-space direction of Manaus
const M = V(0.3, 0.3, 0.905).normalize() // where Manaus sits in the scene
const SUN = V(-0.55, 0.35, 0.76).normalize()

function noiseTexture(kind: 'moon' | 'milky') {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512
  const g = c.getContext('2d')!
  let a = kind === 'moon' ? 5 : 11
  const rnd = () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296 }
  if (kind === 'moon') {
    g.fillStyle = '#8d8a85'; g.fillRect(0, 0, 1024, 512)
    for (let i = 0; i < 520; i++) {
      const x = rnd() * 1024, y = rnd() * 512, r = 3 + rnd() * rnd() * 46, dark = rnd() > 0.55
      const gr = g.createRadialGradient(x, y, 0, x, y, r)
      gr.addColorStop(0, dark ? 'rgba(40,40,44,.55)' : 'rgba(230,228,222,.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)')
      g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2)
    }
  } else {
    g.clearRect(0, 0, 1024, 512)
    for (let i = 0; i < 1400; i++) {
      const x = rnd() * 1024, y = 256 + (rnd() + rnd() + rnd() - 1.5) * 90, r = 8 + rnd() * 46
      const warm = rnd() > 0.65
      const gr = g.createRadialGradient(x, y, 0, x, y, r)
      gr.addColorStop(0, warm ? 'rgba(255,190,140,.05)' : 'rgba(140,170,255,.06)'); gr.addColorStop(1, 'rgba(0,0,0,0)')
      g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2)
    }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace
  return t
}

function cloudMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { t: { value: 0 }, sun: { value: SUN.clone() } },
    vertexShader: 'varying vec3 p; varying vec3 n; void main(){ p = position; n = normalize(mat3(modelMatrix)*normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `varying vec3 p; varying vec3 n; uniform float t; uniform vec3 sun;
      float h(vec3 q){ return fract(sin(dot(q, vec3(127.1,311.7,74.7)))*43758.5453); }
      float vn(vec3 q){ vec3 i=floor(q), f=fract(q); f=f*f*(3.-2.*f);
        return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),
                   mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z); }
      float fbm(vec3 q){ float s=0., a=.5; for(int i=0;i<5;i++){ s+=a*vn(q); q*=2.03; a*=.5; } return s; }
      void main(){
        vec3 q = normalize(p)*3.2 + vec3(t*.012, 0., t*.006);
        float c = smoothstep(.5, .78, fbm(q));
        float lit = clamp(dot(normalize(n), sun)*1.1+.18, 0., 1.);
        gl_FragColor = vec4(vec3(.96,.98,1.)*lit, c*.82*lit + c*.06);
      }`,
  })
}

/** A generic small satellite (bus, two wings), colored; `dish` adds a big reflector (SMAP) that spins. */
function makeSat(color: number, opts: { wing?: number; dish?: boolean; tall?: boolean } = {}) {
  const g = new THREE.Group()
  const bus = new THREE.Mesh(new THREE.BoxGeometry(1, opts.tall ? 2 : 1.2, 1), new THREE.MeshStandardMaterial({ color, metalness: 0.85, roughness: 0.38 }))
  g.add(bus)
  const wing = opts.wing ?? 2.2
  for (const s of [-1, 1]) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(wing, 0.03, 1.2), new THREE.MeshStandardMaterial({ color: 0x1a3a9a, metalness: 0.8, roughness: 0.25 }))
    p.position.set(s * (0.5 + wing / 2), 0, 0); g.add(p)
  }
  let spin: THREE.Object3D | null = null
  if (opts.dish) {
    const prof: THREE.Vector2[] = []
    for (let i = 0; i <= 14; i++) { const r = (i / 14) * 1.5; prof.push(new THREE.Vector2(r, (r * r) / 5)) }
    const d = new THREE.Mesh(new THREE.LatheGeometry(prof, 36), new THREE.MeshStandardMaterial({ color: 0xe0b556, metalness: 1, roughness: 0.3, side: THREE.DoubleSide }))
    d.rotation.x = Math.PI; d.position.y = 1.7
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 8), new THREE.MeshStandardMaterial({ color: 0x333a48 })); arm.position.y = 0.9
    spin = new THREE.Group(); spin.add(d, arm); g.add(spin)
  }
  return { group: g, spin }
}

class Sat {
  pos = V(); quat = new THREE.Quaternion(); up = V(0, 1, 0)
  key: string; group: THREE.Object3D; r: number; u: V3; v: V3; omega: number; theta0: number
  constructor(key: string, group: THREE.Object3D, r: number, u: V3, v: V3, omega: number, theta0: number) {
    this.key = key; this.group = group; this.r = r; this.u = u; this.v = v; this.omega = omega; this.theta0 = theta0
  }
  update(t: number) {
    const th = this.theta0 + this.omega * t
    this.pos.copy(this.u).multiplyScalar(Math.cos(th) * this.r).addScaledVector(this.v, Math.sin(th) * this.r)
    const vel = V().copy(this.u).multiplyScalar(-Math.sin(th)).addScaledVector(this.v, Math.cos(th)).normalize()
    this.up.copy(this.pos).normalize()
    const x = V().crossVectors(this.up, vel).normalize()
    this.quat.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, this.up, vel))
    this.group.position.copy(this.pos); this.group.quaternion.copy(this.quat)
  }
}

function rayHitsEarth(o: V3, d: V3): number | null {
  const b = o.dot(d), c = o.dot(o) - 1, disc = b * b - c
  if (disc < 0) return null
  const t = -b - Math.sqrt(disc)
  return t > 0 ? t : null
}

export interface SpaceApi {
  fly: (key: string, immersive: boolean) => void
  setLang: (lang: string) => void
  dispose: () => void
}

export function createSpace(host: HTMLElement): SpaceApi {
  const stage = createStage(host, { fov: 40, near: 0.002, far: 3000, logDepth: true, lights: false, background: 0x000000, maxDpr: 1.75 })
  const { scene, camera, pointer } = stage

  // light and sky
  const sunLight = new THREE.DirectionalLight(0xfff1dc, 3.4); sunLight.position.copy(SUN).multiplyScalar(50); scene.add(sunLight)
  scene.add(new THREE.AmbientLight(0x3a5688, 0.28))
  scene.add(makeStars(3200, 700, 1.7))
  const band = new THREE.Mesh(new THREE.SphereGeometry(900, 48, 24), new THREE.MeshBasicMaterial({ map: noiseTexture('milky'), side: THREE.BackSide, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending }))
  band.rotation.set(0.9, 0.4, 0.6); scene.add(band)
  const sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('255,238,210'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }))
  sunSprite.position.copy(SUN).multiplyScalar(160); sunSprite.scale.setScalar(70); scene.add(sunSprite)
  const sunCore = sunSprite.clone(); sunCore.material = new THREE.SpriteMaterial({ map: glowTexture('255,255,255'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }); sunCore.scale.setScalar(16); scene.add(sunCore)

  // Earth (fixed in this frame), its clouds, the Moon
  const earth = makeEarth(1, -3.12, -60.02, M)
  scene.add(earth.pivot, earth.air)
  const northN = V(0, 1, 0).applyQuaternion(new THREE.Quaternion().setFromUnitVectors(MANAUS, M))
  const clouds = new THREE.Mesh(new THREE.SphereGeometry(1.012, 96, 64), cloudMaterial()); scene.add(clouds)
  const moon = new THREE.Mesh(new THREE.SphereGeometry(0.2727, 48, 32), new THREE.MeshStandardMaterial({ map: noiseTexture('moon'), roughness: 1, metalness: 0 }))
  moon.position.set(-6.4, 1.6, -3.2); scene.add(moon)

  // orbits: a plane through Manaus for NISAR (98.4 degrees), the others by inclination and node
  const planeBy = (incl: number, node: number) => {
    const e1 = V(1, 0, 0).addScaledVector(northN, -northN.x).normalize()
    const e2 = V().crossVectors(northN, e1)
    const u = V().copy(e1).multiplyScalar(Math.cos(node)).addScaledVector(e2, Math.sin(node)).normalize()
    const w = V().crossVectors(northN, u)
    const v = V().copy(w).multiplyScalar(Math.cos(deg(incl))).addScaledVector(northN, Math.sin(deg(incl))).normalize()
    return { u, v }
  }
  const throughManaus = (incl: number) => {
    const e1 = V().copy(northN).addScaledVector(M, -northN.dot(M)).normalize()
    const e2 = V().crossVectors(M, e1)
    const a = Math.cos(deg(incl)) / e1.dot(northN)
    const n = V().copy(e1).multiplyScalar(a).addScaledVector(e2, -Math.sqrt(Math.max(0, 1 - a * a)))
    return { u: V().copy(M), v: V().crossVectors(n, M).normalize() }
  }
  const orbitLine = (sat: Sat, color: number) => {
    const pts: V3[] = []
    for (let i = 0; i < 240; i++) { const th = (i / 240) * Math.PI * 2; pts.push(V().copy(sat.u).multiplyScalar(Math.cos(th) * sat.r).addScaledVector(sat.v, Math.sin(th) * sat.r)) }
    const l = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.28, depthWrite: false }))
    scene.add(l)
  }
  const omega = (r: number) => 0.075 * Math.pow(1.34 / r, 1.5)

  const nisarModel = makeNisar()
  const NS = 0.021
  nisarModel.group.scale.setScalar(NS)
  const pn = throughManaus(98.4)
  const nisar = new Sat('nisar', nisarModel.group, 1.34, pn.u, pn.v, omega(1.34), -0.5)
  const mk = (key: string, r: number, incl: number, node: number, th0: number, color: number, scale: number, o?: Parameters<typeof makeSat>[1]) => {
    const m = makeSat(color, o); m.group.scale.setScalar(scale)
    const p = planeBy(incl, node)
    return { sat: new Sat(key, m.group, r, p.u, p.v, omega(r), th0), spin: m.spin }
  }
  const sentinel = mk('sentinel', 1.31, 98.2, 1.2, 0.8, 0xc7cfdd, 0.016, { wing: 3 })
  const gpm = mk('gpm', 1.2, 65, 2.4, 2.0, 0xe6e9f0, 0.014, { tall: true })
  const smap = mk('smap', 1.33, 98.1, -1.1, 3.4, 0xcfd6e2, 0.015, { dish: true })
  const viirs = mk('viirs', 1.4, 98.7, 4.2, 1.1, 0xd7dae2, 0.017, { tall: true, wing: 1.8 })
  const sats: Sat[] = [nisar, sentinel.sat, gpm.sat, smap.sat, viirs.sat]
  const colors: Record<string, number> = { nisar: 0x3be0c5, sentinel: 0xe7b04a, gpm: 0x6fa8ff, smap: 0xa3e635, viirs: 0xfb7185 }
  for (const s of sats) { scene.add(s.group); orbitLine(s, colors[s.key]) }

  // NISAR's beam: a translucent cone, pulses running down it, a glowing footprint with rings on the ground
  const coneGeo = new THREE.ConeGeometry(1, 1, 40, 1, true); coneGeo.translate(0, -0.5, 0)
  const beam = new THREE.Mesh(coneGeo, new THREE.MeshBasicMaterial({ color: 0x3be0c5, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }))
  scene.add(beam)
  const ringGeo = new THREE.TorusGeometry(1, 0.02, 8, 64)
  const pulses = Array.from({ length: 6 }, () => { const m = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0x7bf3df, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); scene.add(m); return m })
  const foot = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('59,224,197'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); scene.add(foot)
  const groundRingGeo = new THREE.RingGeometry(0.92, 1, 64)
  const groundRings = Array.from({ length: 3 }, () => { const m = new THREE.Mesh(groundRingGeo, new THREE.MeshBasicMaterial({ color: 0x7bf3df, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); scene.add(m); return m })
  // the others only look straight down, with a faint cone and a small glow
  const nadir = [sentinel.sat, gpm.sat, smap.sat, viirs.sat].map((s) => {
    const cone = new THREE.Mesh(coneGeo, new THREE.MeshBasicMaterial({ color: colors[s.key], transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }))
    const spot = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(colors[s.key] === 0xe7b04a ? '231,176,74' : colors[s.key] === 0x6fa8ff ? '111,168,255' : colors[s.key] === 0xa3e635 ? '163,230,53' : '251,113,133'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }))
    scene.add(cone, spot); return { s, cone, spot }
  })
  // the Amazon's moisture: arcs of vapour from the basin to the regions it feeds (visible on the impact page)
  const align = new THREE.Quaternion().setFromUnitVectors(MANAUS, M)
  const toScene = (lat: number, lon: number, r = 1) => onSphere(lat, lon).normalize().applyQuaternion(align).multiplyScalar(r)
  const DEST: { key: string; lat: number; lon: number; color: number }[] = [
    { key: 'andes', lat: -13.5, lon: -72, color: 0x5eead4 }, { key: 'saopaulo', lat: -23.55, lon: -46.65, color: 0xfbbf24 },
    { key: 'riogrande', lat: -30.0, lon: -51.2, color: 0x60a5fa }, { key: 'plata', lat: -34.6, lon: -58.4, color: 0xc084fc },
  ]
  const flowRoot = new THREE.Group(); flowRoot.visible = false; scene.add(flowRoot)
  const flows = DEST.map((d, k) => {
    const a = M.clone().multiplyScalar(1.004), b = toScene(d.lat, d.lon, 1.004)
    const mid = a.clone().add(b).multiplyScalar(0.5).normalize().multiplyScalar(1.2 + a.distanceTo(b) * 0.28)
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b)
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(80)), new THREE.LineBasicMaterial({ color: d.color, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }))
    const n = 46, pos = new Float32Array(n * 3)
    const pts = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(pos, 3)), new THREE.PointsMaterial({ color: d.color, size: 3.2, sizeAttenuation: false, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }))
    const end = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(d.color === 0x5eead4 ? '94,234,212' : d.color === 0xfbbf24 ? '251,191,36' : d.color === 0x60a5fa ? '96,165,250' : '192,132,252'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }))
    end.position.copy(b); end.scale.setScalar(0.09)
    flowRoot.add(line, pts, end)
    return { curve, pts, pos, n, k, b }
  })

  // Manaus marker: a pin and a soft pulse
  const pin = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('255,210,120'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); pin.position.copy(M).multiplyScalar(1.004); pin.scale.setScalar(0.07); scene.add(pin)

  // labels (HTML, placed from 3D positions each frame)
  const labelRoot = document.createElement('div'); labelRoot.className = 'sp-labels'; host.appendChild(labelRoot)
  const labelEls: Record<string, { el: HTMLDivElement; get: () => V3 }> = {}
  const labelPos: Record<string, () => V3> = {
    andes: () => toScene(-13.5, -72, 1.01), saopaulo: () => toScene(-23.55, -46.65, 1.01), riogrande: () => toScene(-30.0, -51.2, 1.01), plata: () => toScene(-34.6, -58.4, 1.01),
    earth: () => V(0, 1.05, 0), amazon: () => M.clone().multiplyScalar(1.01), moon: () => moon.position.clone().add(V(0, 0.4, 0)), sun: () => sunSprite.position,
    nisar: () => nisar.pos, sentinel: () => sentinel.sat.pos, gpm: () => gpm.sat.pos, smap: () => smap.sat.pos, viirs: () => viirs.sat.pos,
  }
  let lang = 'en'
  for (const k of Object.keys(LABELS)) {
    const el = document.createElement('div'); el.className = 'sp-label'; el.innerHTML = '<i></i><b></b><span></span>'
    labelRoot.appendChild(el); labelEls[k] = { el, get: labelPos[k] }
  }
  const writeLabels = () => { for (const [k, l] of Object.entries(LABELS)) { const e = labelEls[k].el; e.querySelector('b')!.textContent = l.name[lang] ?? l.name.en; e.querySelector('span')!.textContent = l.sub } }
  writeLabels()

  // camera state: a direction and a distance from the Earth's centre (so flights arc around the planet), and a look-at point
  const tmp = V()
  let wp = WAYPOINTS.system, focusTarget = 'earth', tShift = 0.1, shift = 0.1, vshift = 0, tV = 0, snapNow = false, snapHold = false
  const camDir = V(0.6, 0.2, 0.8).normalize(); let camDist = 22
  const lookAt = V(); const up = V(0, 1, 0)
  const frameOf = (key: string): { pos: V3; quat: THREE.Quaternion } => {
    const q = new THREE.Quaternion()
    switch (key) {
      case 'amazon': return { pos: M.clone(), quat: q.setFromUnitVectors(Y, M) }
      case 'sa': { const c = toScene(-17, -58, 1); return { pos: c, quat: q.setFromUnitVectors(Y, c.clone().normalize()) } }
      case 'footprint': return { pos: footPos.clone(), quat: q.setFromUnitVectors(Y, footPos.clone().normalize()) }
      case 'beam': return { pos: beamMid.clone(), quat: nisar.quat.clone() }
      case 'nisar': return { pos: nisar.pos.clone(), quat: nisar.quat.clone() }
      case 'sentinel': return { pos: sentinel.sat.pos.clone(), quat: sentinel.sat.quat.clone() }
      case 'gpm': return { pos: gpm.sat.pos.clone(), quat: gpm.sat.quat.clone() }
      case 'smap': return { pos: smap.sat.pos.clone(), quat: smap.sat.quat.clone() }
      case 'viirs': return { pos: viirs.sat.pos.clone(), quat: viirs.sat.quat.clone() }
      default: return { pos: V(), quat: q }
    }
  }
  const footPos = V(M.x, M.y, M.z); const beamMid = V()

  stage.frame((t, dt) => {
    for (const s of sats) s.update(t)
    if (smap.spin) smap.spin.rotation.y = t * 1.6
    ;(clouds.material as THREE.ShaderMaterial).uniforms.t.value = t
    moon.rotation.y = t * 0.02

    // NISAR's look: from the dish feed, along the tilted axis, to the ground
    const o = nisarModel.origin.clone().multiplyScalar(NS).applyQuaternion(nisar.quat).add(nisar.pos)
    const d = nisarModel.dir.clone().applyQuaternion(nisar.quat)
    const hit = rayHitsEarth(o, d) ?? 0.4
    footPos.copy(o).addScaledVector(d, hit)
    beamMid.copy(o).addScaledVector(d, hit * 0.5)
    beam.position.copy(o); beam.quaternion.setFromUnitVectors(V(0, -1, 0), d); beam.scale.set(hit * 0.16, hit, hit * 0.16)
    pulses.forEach((p, k) => {
      const ph = ((t * 0.55 + k / pulses.length) % 1)
      p.position.copy(o).addScaledVector(d, hit * ph); p.quaternion.setFromUnitVectors(V(0, 0, 1), d)
      p.scale.setScalar(Math.max(0.001, hit * ph * 0.16)); (p.material as THREE.MeshBasicMaterial).opacity = Math.sin(ph * Math.PI) * 0.9
    })
    const n = footPos.clone().normalize()
    foot.position.copy(footPos).addScaledVector(n, 0.002); foot.scale.setScalar(0.07 + Math.sin(t * 5) * 0.012)
    groundRings.forEach((r, k) => {
      const ph = ((t * 0.7 + k / 3) % 1)
      r.position.copy(footPos).addScaledVector(n, 0.003); r.quaternion.setFromUnitVectors(V(0, 0, 1), n)
      r.scale.setScalar(0.01 + ph * 0.07); (r.material as THREE.MeshBasicMaterial).opacity = (1 - ph) * 0.8
    })
    for (const { s, cone, spot } of nadir) {
      const dn = s.up.clone().negate(), h = rayHitsEarth(s.pos, dn) ?? 0.2
      cone.position.copy(s.pos); cone.quaternion.setFromUnitVectors(V(0, -1, 0), dn); cone.scale.set(h * 0.2, h, h * 0.2)
      spot.position.copy(s.pos).addScaledVector(dn, h - 0.002); spot.scale.setScalar(0.045)
    }
    pin.scale.setScalar(0.055 + Math.sin(t * 3) * 0.012)
    flowRoot.visible = focusTarget === 'sa'
    if (flowRoot.visible) for (const fl of flows) {
      for (let j = 0; j < fl.n; j++) { const u = (t * 0.16 + j / fl.n + fl.k * 0.13) % 1; fl.curve.getPoint(u, tmp); fl.pos.set([tmp.x, tmp.y, tmp.z], j * 3) }
      fl.pts.geometry.attributes.position.needsUpdate = true
    }

    // fly
    const f = frameOf(focusTarget)
    const az = wp.az + Math.sin(t * 0.17) * 0.07 + pointer.x * 0.28
    const el = wp.el + Math.cos(t * 0.13) * 0.025 - pointer.y * 0.14
    const off = V(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az)).multiplyScalar(wp.dist).applyQuaternion(f.quat)
    const want = f.pos.clone().add(off)
    const wantD = Math.max(want.length(), 1.02)
    const wantDir = want.clone().normalize()
    const wantUp = focusTarget === 'earth' ? Y : V(0, 1, 0).applyQuaternion(f.quat)
    if (snapNow) { camDir.copy(wantDir); camDist = wantD; lookAt.copy(f.pos); up.copy(wantUp); shift = tShift; vshift = tV; snapNow = snapHold }
    const k = 1 - Math.exp(-dt * 1.7)
    camDir.lerp(wantDir, k).normalize()
    camDist = Math.exp(Math.log(camDist) + (Math.log(wantD) - Math.log(camDist)) * k)
    lookAt.lerp(f.pos, 1 - Math.exp(-dt * 2.6))
    up.lerp(wantUp, 1 - Math.exp(-dt * 2)).normalize()
    camera.position.copy(camDir).multiplyScalar(camDist)
    camera.up.copy(up)
    camera.lookAt(lookAt)
    shift += (tShift - shift) * (1 - Math.exp(-dt * 2)); vshift += (tV - vshift) * (1 - Math.exp(-dt * 2))
    const W = host.clientWidth || 1, H = host.clientHeight || 1
    if (W > 860) camera.setViewOffset(W, H, -shift * W, -vshift * H, W, H); else camera.clearViewOffset()
    camera.updateMatrixWorld()

    // labels: project, hide behind the planet and when too far to read
    const cam = camera.position
    for (const [key, l] of Object.entries(labelEls)) {
      const p = l.get().clone(), v = p.clone().project(camera)
      const dirv = p.clone().sub(cam), dist = dirv.length(); dirv.normalize()
      const eh = rayHitsEarth(cam, dirv)
      const hidden = (eh !== null && eh < dist - 0.01 && key !== 'earth') || v.z > 1 || v.z < -1
      const isDest = key === 'andes' || key === 'saopaulo' || key === 'riogrande' || key === 'plata'
      const isFocus = (isDest && focusTarget === 'sa') || key === focusTarget || (focusTarget === 'beam' && key === 'nisar') || (focusTarget === 'footprint' && key === 'amazon')
      const far = dist > (key === 'moon' || key === 'sun' ? 40 : 3.4), near = dist < 0.12 && !isFocus
      const op = hidden || near || wp === WAYPOINTS.system || (isDest && focusTarget !== 'sa') ? 0 : isFocus ? 1 : far ? 0 : Math.min(0.75, (3.4 - dist) / 3.4 + 0.15)
      const x = (v.x * 0.5 + 0.5) * W, y = (-v.y * 0.5 + 0.5) * H
      l.el.style.opacity = String(op); l.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`
      l.el.classList.toggle('focus', isFocus)
    }
  })

  if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__space = { camera, nisar, get focus() { return focusTarget }, snap: (hold = false) => { snapNow = true; snapHold = hold } } // lets tests skip the flight (headless frames are slow)
  return {
    fly(key, immersive) {
      const id = FOCUS[key] ?? 'earth'
      wp = WAYPOINTS[id]; focusTarget = wp.target
      // an instrument panel on the right: the subject moves left of it; when the scene is the figure it sits near the centre
      tShift = immersive ? 0.0 : -0.1; tV = wp.down ?? 0
    },
    setLang(l) { lang = l; writeLabels() },
    dispose() { labelRoot.remove(); stage.dispose() },
  }
}
