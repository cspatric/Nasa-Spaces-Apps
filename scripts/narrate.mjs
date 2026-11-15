// Generates one English mp3 per narration with Cartesia text to speech into public/audio/en/.
//   CARTESIA_API_KEY=... node scripts/narrate.mjs [--force]
// A manifest (public/audio/en/manifest.json) remembers the hash of each text, so only changed texts are synthesised again.
// The key is read from the environment only and never written anywhere.
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const KEY = process.env.CARTESIA_API_KEY
if (!KEY) { console.error('Set CARTESIA_API_KEY'); process.exit(1) }
const VOICE = process.env.CARTESIA_VOICE_ID ?? 'b24f41fd-00a3-4cd8-992a-a0c9f13f3ef1' // Clive - Measured Expert
const MODEL = process.env.CARTESIA_MODEL ?? 'sonic-3'
const force = process.argv.includes('--force')
const dir = join('public', 'audio', 'en')
mkdirSync(dir, { recursive: true })
const manifestPath = join(dir, 'manifest.json')
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {}

const rows = JSON.parse(execFileSync('node', ['scripts/narration-texts.mjs'], { encoding: 'utf8', maxBuffer: 1 << 24 }))
const hash = (t) => createHash('sha1').update(`${VOICE}|${MODEL}|${t}`).digest('hex').slice(0, 12)
const done = new Map() // hash -> file already made in this run
let chars = 0

for (const r of rows) {
  const name = `${r.deck}-${r.id}.mp3`, file = join(dir, name), h = hash(r.text)
  if (!force && manifest[name] === h && existsSync(file)) { console.log('keep ', name); done.set(h, file); continue }
  if (done.has(h)) { copyFileSync(done.get(h), file); manifest[name] = h; console.log('copy ', name); continue }
  const res = await fetch('https://api.cartesia.ai/tts/bytes', {
    method: 'POST',
    headers: { 'X-API-Key': KEY, 'Cartesia-Version': '2024-11-13', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model_id: MODEL, transcript: r.text, voice: { mode: 'id', id: VOICE }, language: 'en',
      output_format: { container: 'mp3', sample_rate: 24000, bit_rate: 64000 },
    }),
  })
  if (!res.ok) { console.error('FAIL ', name, res.status, (await res.text()).slice(0, 200)); process.exitCode = 1; continue }
  writeFileSync(file, Buffer.from(await res.arrayBuffer()))
  manifest[name] = h; done.set(h, file); chars += r.text.length
  console.log('made ', name, r.text.length, 'chars')
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 1))
}
// recordings of pages that no longer exist are removed, so the folder always matches the decks
const wanted = new Set(rows.map((r) => `${r.deck}-${r.id}.mp3`))
for (const f of readdirSync(dir)) if (f.endsWith('.mp3') && !wanted.has(f)) { unlinkSync(join(dir, f)); delete manifest[f]; console.log('prune', f) }
writeFileSync(manifestPath, JSON.stringify(manifest, null, 1))
console.log(`done; ${chars} characters synthesised`)
