/**
 * Sound effects, synthesized with the Web Audio API (no audio files to load). Nothing plays until the
 * person has interacted with the page (browsers require it), and the speaker button mutes everything.
 */
let ctx: AudioContext | null = null
let master: GainNode | null = null
let muted = (() => {
  try { return localStorage.getItem('saris-muted') === '1' } catch { return false }
})()

function audio(): AudioContext | null {
  if (muted) return null
  try {
    if (!ctx) {
      ctx = new AudioContext()
      master = ctx.createGain()
      master.gain.value = 0.32
      master.connect(ctx.destination)
    }
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function noise(c: AudioContext, seconds: number): AudioBufferSourceNode {
  const buf = c.createBuffer(1, Math.max(1, Math.floor(c.sampleRate * seconds)), c.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  const src = c.createBufferSource()
  src.buffer = buf
  return src
}

function tone(freq: number, dur: number, type: OscillatorType = 'sine', gain = 0.25, delay = 0, to?: number) {
  const c = audio()
  if (!c || !master) return
  const t = c.currentTime + delay
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, t)
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(gain, t + 0.008)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(master)
  o.start(t)
  o.stop(t + dur + 0.02)
}

/** Filtered noise with a volume envelope (and optionally a sweeping filter). */
function burst(opts: { dur: number; type: BiquadFilterType; from: number; to?: number; gain: number; attack?: number; delay?: number; q?: number }) {
  const c = audio()
  if (!c || !master) return
  const t = c.currentTime + (opts.delay ?? 0)
  const src = noise(c, opts.dur + 0.1)
  const f = c.createBiquadFilter()
  f.type = opts.type
  f.Q.value = opts.q ?? 1
  f.frequency.setValueAtTime(opts.from, t)
  if (opts.to) f.frequency.exponentialRampToValueAtTime(opts.to, t + opts.dur)
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(opts.gain, t + (opts.attack ?? 0.03))
  g.gain.exponentialRampToValueAtTime(0.0001, t + opts.dur)
  src.connect(f).connect(g).connect(master)
  src.start(t)
  src.stop(t + opts.dur + 0.05)
}

export const sound = {
  isMuted: () => muted,
  setMuted(v: boolean) {
    muted = v
    try { localStorage.setItem('saris-muted', v ? '1' : '0') } catch { /* storage may be blocked */ }
    if (!v) tone(660, 0.12, 'sine', 0.2) // confirms that sound is back
  },
  click: () => tone(1100, 0.04, 'square', 0.05),
  toggle(on: boolean) {
    tone(on ? 520 : 420, 0.07, 'triangle', 0.14)
    tone(on ? 780 : 300, 0.09, 'triangle', 0.14, 0.06)
  },
  ping: () => { tone(880, 0.35, 'sine', 0.2); tone(1320, 0.5, 'sine', 0.08, 0.04) },
  whoosh: () => burst({ dur: 0.9, type: 'bandpass', from: 300, to: 2400, gain: 0.22, attack: 0.25, q: 0.8 }),
  success: () => { tone(523, 0.12, 'triangle', 0.16); tone(659, 0.12, 'triangle', 0.16, 0.1); tone(784, 0.25, 'triangle', 0.16, 0.2) },
  alert() {
    for (let i = 0; i < 3; i++) tone(960, 0.16, 'square', 0.1, i * 0.28, 640)
  },
  /** Earthquake: a deep rumble that shakes and fades, scaled by magnitude (5 to 9). */
  quake(magnitude: number) {
    const s = Math.min(1, Math.max(0.3, (magnitude - 4) / 5))
    burst({ dur: 3 + 4 * s, type: 'lowpass', from: 110, to: 40, gain: 0.55 * s + 0.2, attack: 0.4, q: 4 })
    for (let i = 0; i < 6; i++) burst({ dur: 0.5, type: 'lowpass', from: 160, gain: 0.3 * s, delay: 0.5 + i * 0.55, attack: 0.05 })
    tone(48, 3, 'sine', 0.3 * s + 0.1, 0, 30)
  },
  /** Flood: flowing water, a wide band of noise that swells. */
  flood() {
    burst({ dur: 4.5, type: 'bandpass', from: 700, to: 420, gain: 0.3, attack: 1.2, q: 0.6 })
    burst({ dur: 4.5, type: 'lowpass', from: 300, gain: 0.25, attack: 1.5 })
  },
  /** Wildfire: random crackles over a low roar. */
  fire() {
    burst({ dur: 4, type: 'lowpass', from: 220, gain: 0.25, attack: 0.8 })
    for (let i = 0; i < 28; i++) burst({ dur: 0.05 + Math.random() * 0.06, type: 'highpass', from: 2200 + Math.random() * 3000, gain: 0.25 + Math.random() * 0.2, delay: Math.random() * 3.8, attack: 0.004 })
  },
  /** Storm: rain hiss with a thunder clap. */
  storm() {
    burst({ dur: 4.5, type: 'highpass', from: 3000, gain: 0.12, attack: 0.8 })
    burst({ dur: 3.2, type: 'lowpass', from: 220, to: 60, gain: 0.55, attack: 0.05, delay: 0.7, q: 2 })
    burst({ dur: 2.2, type: 'lowpass', from: 180, to: 50, gain: 0.35, attack: 0.1, delay: 2.4, q: 2 })
  },
}
