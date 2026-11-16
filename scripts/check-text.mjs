// Fails when a travessão (em dash or en dash) sneaks into the page's source: the texts are meant to read like a person wrote them.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const bad = []
const walk = (dir) => {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f)
    if (statSync(p).isDirectory()) walk(p)
    else if (/\.(tsx?|css|html|md)$/.test(f)) {
      readFileSync(p, 'utf8').split('\n').forEach((line, i) => { if (/[\u2013\u2014]/.test(line)) bad.push(`${p}:${i + 1}`) })
    }
  }
}
walk('src'); walk('public'); bad.push(...readFileSync('index.html', 'utf8').split('\n').flatMap((l, i) => (/[\u2013\u2014]/.test(l) ? [`index.html:${i + 1}`] : [])))
if (bad.length) { console.error('Travessão found (use a comma, a period or rewrite the sentence):\n' + bad.join('\n')); process.exit(1) }
console.log('no travessões')
