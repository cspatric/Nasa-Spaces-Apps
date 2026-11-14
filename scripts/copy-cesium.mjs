// Copies the static assets CesiumJS needs at runtime (workers, widgets, images) into public/cesium.
import { cpSync, mkdirSync } from 'node:fs'

const src = 'node_modules/cesium/Build/Cesium'
const dst = 'public/cesium'
mkdirSync(dst, { recursive: true })
for (const dir of ['Workers', 'ThirdParty', 'Assets', 'Widgets']) {
  cpSync(`${src}/${dir}`, `${dst}/${dir}`, { recursive: true })
}
console.log('Cesium assets copied to', dst)
