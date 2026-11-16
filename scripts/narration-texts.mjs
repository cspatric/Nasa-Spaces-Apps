// Prints every narration of both decks as JSON [{deck, id, text}] (English), loading the step files through Vite.
import { createServer } from 'vite'

const vite = await createServer({ server: { middlewareMode: true, hmr: false, watch: null }, appType: 'custom', logLevel: 'silent', optimizeDeps: { noDiscovery: true } })
try {
  const { PROJECT_STEPS } = await vite.ssrLoadModule('/src/pages/projectSteps.tsx')
  const story = await vite.ssrLoadModule('/src/pages/projectStory.tsx')
  const SATELLITE_STEPS = story.satelliteDeckSteps()
  const rows = []
  for (const [deck, steps] of [['project', PROJECT_STEPS], ['satellite', SATELLITE_STEPS]])
    for (const s of steps) rows.push({ deck, id: s.id, text: s.narration.en })
  console.log(JSON.stringify(rows, null, 1))
} finally {
  await vite.close()
}
