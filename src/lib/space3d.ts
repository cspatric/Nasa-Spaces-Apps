import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

/**
 * Shared pieces of the 3D figures in the decks: a real Earth (NASA Blue Marble from GIBS), the NISAR satellite built
 * from primitives, a star field, an atmosphere, and a small render loop that handles size, pointer and clean-up.
 */

const BLUE_MARBLE = 'https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/BlueMarble_ShadedRelief_Bathymetry/default/500m/2'
let earthMap: Promise<THREE.CanvasTexture> | null = null

/** 15 GIBS tiles (5 x 3, 512 px) stitched into one equirectangular 2560 x 1280 map. Falls back to a dark ocean if offline. */
export function earthTexture(): Promise<THREE.CanvasTexture> {
  earthMap ??= (async () => {
    const c = document.createElement('canvas')
    c.width = 2560; c.height = 1280
    const g = c.getContext('2d')!
    g.fillStyle = '#06182c'; g.fillRect(0, 0, 2560, 1280)
    const load = (r: number, col: number) => new Promise<void>((done) => {
      const im = new Image()
      im.crossOrigin = 'anonymous'
      im.onload = () => { g.drawImage(im, col * 512, r * 512); done() }
      im.onerror = () => done()
      im.src = `${BLUE_MARBLE}/${r}/${col}.jpeg`
    })
    await Promise.all([0, 1, 2].flatMap((r) => [0, 1, 2, 3, 4].map((col) => load(r, col))))
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    return t
  })()
  return earthMap
}

/** Where a latitude/longitude sits on a three.js sphere (matches SphereGeometry's own mapping). */
export function onSphere(lat: number, lon: number, r = 1) {
  const th = ((90 - lat) * Math.PI) / 180, ph = ((lon + 180) * Math.PI) / 180
  return new THREE.Vector3(-r * Math.cos(ph) * Math.sin(th), r * Math.cos(th), r * Math.sin(ph) * Math.sin(th))
}

/** A sphere with the Earth on it, turned so that (lat, lon) is on top. Spin the returned `pivot` around Y. */
export function makeEarth(radius: number, lat: number, lon: number, to = new THREE.Vector3(0, 1, 0)) {
  const pivot = new THREE.Group()
  const mat = new THREE.MeshStandardMaterial({ color: 0x9fb4cc, roughness: 0.95, metalness: 0 })
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 96, 64), mat)
  mesh.quaternion.setFromUnitVectors(onSphere(lat, lon).normalize(), to.clone().normalize())
  pivot.add(mesh)
  earthTexture().then((t) => { mat.map = t; mat.color.set(0xffffff); mat.needsUpdate = true })
  const air = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.035, 64, 48), new THREE.ShaderMaterial({
    transparent: true, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: 'varying vec3 n; varying vec3 v; void main(){ n = normalize(normalMatrix*normal); vec4 p = modelViewMatrix*vec4(position,1.); v = normalize(-p.xyz); gl_Position = projectionMatrix*p; }',
    fragmentShader: 'varying vec3 n; varying vec3 v; void main(){ float f = pow(1.0 - abs(dot(n, v)), 2.6); gl_FragColor = vec4(vec3(.25,.75,1.0)*f*1.5, f); }',
  }))
  return { pivot, mesh, air }
}

export function makeStars(count = 1600, radius = 90, px = 0) {
  const pos = new Float32Array(count * 3), col = new Float32Array(count * 3)
  let a = 99
  const rnd = () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296 }
  for (let i = 0; i < count; i++) {
    const u = rnd() * 2 - 1, p = rnd() * Math.PI * 2, s = Math.sqrt(1 - u * u), r = radius * (0.8 + rnd() * 0.2)
    pos.set([r * s * Math.cos(p), r * u, r * s * Math.sin(p)], i * 3)
    const k = 0.45 + rnd() * 0.55, warm = rnd()
    col.set([k * (warm > 0.8 ? 1 : 0.85), k * 0.92, k * (warm < 0.2 ? 0.8 : 1)], i * 3)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3))
  return new THREE.Points(g, new THREE.PointsMaterial({ size: px || 0.35, vertexColors: true, sizeAttenuation: !px, transparent: true, opacity: 0.95, depthWrite: false }))
}

function panelTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128
  const g = c.getContext('2d')!
  const gr = g.createLinearGradient(0, 0, 256, 128); gr.addColorStop(0, '#16358f'); gr.addColorStop(1, '#0b1d57')
  g.fillStyle = gr; g.fillRect(0, 0, 256, 128)
  g.strokeStyle = 'rgba(150,185,255,.55)'; g.lineWidth = 1
  for (let x = 0; x <= 256; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 128); g.stroke() }
  for (let y = 0; y <= 128; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke() }
  g.strokeStyle = 'rgba(255,255,255,.12)'
  for (let x = 16; x < 256; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 128); g.stroke() }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8
  return t
}

/**
 * NISAR from primitives: a gold-foil bus, a 12 m mesh reflector on a boom with its feed, and two solar wings. The dish
 * axis (local -Y of `dish`) is the radar's look direction, tilted to the side, because NISAR looks sideways.
 */
export function makeNisar() {
  const g = new THREE.Group()
  const gold = new THREE.MeshStandardMaterial({ color: 0xd9ae4c, metalness: 1, roughness: 0.32 })
  const white = new THREE.MeshStandardMaterial({ color: 0xdfe6f2, metalness: 0.35, roughness: 0.5 })
  const dark = new THREE.MeshStandardMaterial({ color: 0x2a3140, metalness: 0.7, roughness: 0.45 })

  const bus = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.3, 1.15), gold)
  g.add(bus)
  const rad = new THREE.Mesh(new THREE.BoxGeometry(1.17, 0.4, 1.17), white); rad.position.y = -0.45; g.add(rad)
  const strip = new THREE.Mesh(new THREE.BoxGeometry(1.19, 0.06, 1.19), new THREE.MeshBasicMaterial({ color: 0x3be0c5 })); strip.position.y = -0.18; g.add(strip)
  const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 0.18, 24), dark); nozzle.position.y = -0.78; g.add(nozzle)

  // solar wings: three sections on each side, with a thin arm
  const panelMat = new THREE.MeshStandardMaterial({ map: panelTexture(), color: 0xaec3ff, metalness: 0.2, roughness: 0.6, envMapIntensity: 0.5 })
  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.55, 8), dark)
    arm.rotation.z = Math.PI / 2; arm.position.set(side * 0.85, -0.05, 0); g.add(arm)
    for (let k = 0; k < 3; k++) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.025, 1.7), panelMat)
      p.position.set(side * (1.75 + k * 1.58), -0.05, 0)
      p.rotation.z = side * 0.04 * (k + 1)
      g.add(p)
    }
  }

  // the dish: a paraboloid shell with a wire mesh look, a boom, and a feed on three struts
  const dish = new THREE.Group()
  const R = 1.9, f = 1.5
  const prof: THREE.Vector2[] = []
  for (let i = 0; i <= 28; i++) { const r = (i / 28) * R; prof.push(new THREE.Vector2(r, (r * r) / (4 * f))) }
  const shellGeo = new THREE.LatheGeometry(prof, 64)
  const shell = new THREE.Mesh(shellGeo, new THREE.MeshStandardMaterial({ color: 0xe0b556, metalness: 1, roughness: 0.28, side: THREE.DoubleSide }))
  const wire = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.LatheGeometry(prof.filter((_, i) => i % 4 === 0), 40)), new THREE.LineBasicMaterial({ color: 0x6b4a10, transparent: true, opacity: 0.45 }))
  const rim = new THREE.Mesh(new THREE.TorusGeometry(R, 0.022, 8, 96), gold); rim.rotation.x = Math.PI / 2; rim.position.y = (R * R) / (4 * f)
  dish.add(shell, wire, rim)
  // opening faces +Y in local space; flip it so it opens along local -Y, the look direction
  shell.rotation.x = wire.rotation.x = Math.PI; shell.position.y = wire.position.y = (R * R) / (4 * f)
  rim.position.y = 0
  const feedPos = new THREE.Vector3(0, -f * 0.62 - (R * R) / (4 * f) + (R * R) / (4 * f), 0)
  const feed = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.34, 20), dark); feed.position.copy(feedPos).setY(-0.9); feed.rotation.x = Math.PI
  dish.add(feed)
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2
    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.15, 6), dark)
    strut.position.set(Math.cos(a) * 0.62, -0.5, Math.sin(a) * 0.62)
    strut.lookAt(0, -0.9, 0); strut.rotateX(Math.PI / 2)
    dish.add(strut)
  }
  const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.9, 10), dark)
  boom.position.set(0.55, 0.95, 0); boom.rotation.z = -0.5
  g.add(boom)
  dish.position.set(1.15, 1.95, 0)
  dish.rotation.z = -0.62 // tilt the look direction to the side (+X), like the real side-looking geometry
  g.add(dish)

  // beam origin (feed) and direction in the group's space
  const dir = new THREE.Vector3(0, -1, 0).applyEuler(dish.rotation).normalize()
  const origin = new THREE.Vector3().copy(dish.position)
  return { group: g, dish, dir, origin }
}

/** A soft round glow (for footprints and pulses). */
export function glowTexture(color = '59,224,197') {
  const c = document.createElement('canvas'); c.width = c.height = 128
  const g = c.getContext('2d')!
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  gr.addColorStop(0, `rgba(${color},.95)`); gr.addColorStop(0.35, `rgba(${color},.35)`); gr.addColorStop(1, `rgba(${color},0)`)
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(c)
}

export interface Stage {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  pointer: { x: number; y: number }
  /** Called every frame with seconds since start and since the last frame. */
  frame: (fn: (t: number, dt: number) => void) => void
  dispose: () => void
}

/** Renderer, camera, lighting, resize and pointer for one figure. The caller adds objects and a frame callback. */
export interface StageOptions { fov?: number; near?: number; far?: number; logDepth?: boolean; lights?: boolean; background?: number; maxDpr?: number }

export function createStage(el: HTMLElement, o: StageOptions = {}): Stage {
  const { fov = 34, near = 0.1, far = 400, logDepth = false, lights = true, background, maxDpr = 1.5 } = o
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: background === undefined, powerPreference: 'high-performance', logarithmicDepthBuffer: logDepth })
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, maxDpr))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%'
  el.appendChild(renderer.domElement)
  const scene = new THREE.Scene()
  if (background !== undefined) scene.background = new THREE.Color(background)
  const pm = new THREE.PMREMGenerator(renderer)
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environmentIntensity = 0.55
  const camera = new THREE.PerspectiveCamera(fov, 1, near, far)
  if (lights) {
    const sun = new THREE.DirectionalLight(0xfff4e2, 3.2); sun.position.set(-6, 7, 8); scene.add(sun)
    scene.add(new THREE.AmbientLight(0x4a6a9a, 0.35))
    const rim = new THREE.DirectionalLight(0x4fb6ff, 1.2); rim.position.set(7, 2, -6); scene.add(rim)
  }

  const pointer = { x: 0, y: 0 }, target = { x: 0, y: 0 }
  const onMove = (e: PointerEvent) => { const r = el.getBoundingClientRect(); target.x = ((e.clientX - r.left) / r.width - 0.5) * 2; target.y = ((e.clientY - r.top) / r.height - 0.5) * 2 }
  const onLeave = () => { target.x = 0; target.y = 0 }
  window.addEventListener('pointermove', onMove)
  el.addEventListener('pointerleave', onLeave)

  const size = () => { const w = el.clientWidth || 1, h = el.clientHeight || 1; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix() }
  const ro = new ResizeObserver(size); ro.observe(el); size()

  let fn: (t: number, dt: number) => void = () => {}
  let raf = 0, last = performance.now(); const t0 = last
  // Dynamic resolution: if frames take too long the picture is drawn with fewer pixels (down to 0.75) until it keeps up,
  // and it climbs back when there is room. A slow computer gets a softer picture instead of a stuttering one.
  const maxRatio = Math.min(devicePixelRatio || 1, maxDpr)
  let ratio = maxRatio, slow = 0, fast = 0
  let visible = true
  const loop = (now: number) => {
    raf = requestAnimationFrame(loop)
    if (!visible) { last = now; return }
    const raw = (now - last) / 1000
    const dt = Math.min(raw, 0.05); last = now
    if (raw > 0.026) { slow++; fast = 0 } else if (raw < 0.019) { fast++; slow = 0 } else { slow = 0; fast = 0 }
    if (slow >= 8 && ratio > 0.75) { ratio = Math.max(0.75, ratio - 0.25); renderer.setPixelRatio(ratio); size(); slow = 0 }
    else if (fast >= 240 && ratio < maxRatio) { ratio = Math.min(maxRatio, ratio + 0.25); renderer.setPixelRatio(ratio); size(); fast = 0 }
    pointer.x += (target.x - pointer.x) * Math.min(1, dt * 3); pointer.y += (target.y - pointer.y) * Math.min(1, dt * 3)
    fn((now - t0) / 1000, dt)
    renderer.render(scene, camera)
  }
  raf = requestAnimationFrame(loop)
  // nothing to draw while the figure is scrolled away or the tab is hidden
  const io = new IntersectionObserver((e) => { visible = e[e.length - 1].isIntersecting }); io.observe(el)

  return {
    scene, camera, pointer,
    frame: (f) => { fn = f },
    dispose() {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect()
      window.removeEventListener('pointermove', onMove); el.removeEventListener('pointerleave', onLeave)
      scene.traverse((o) => {
        const m = o as THREE.Mesh
        m.geometry?.dispose?.()
        const mat = m.material as THREE.Material | THREE.Material[] | undefined
        ;(Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((x) => x.dispose())
      })
      pm.dispose(); renderer.dispose(); renderer.domElement.remove()
    },
  }
}
