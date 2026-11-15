# SARIS

NASA Space Apps Challenge 2026, challenge "Dancing with the SARs".
SARIS is an interactive 3D observatory of surface change. It uses NISAR (L-band)
radar data, OPERA RTC-S1 (C-band, 2016 to 2026) and NASA climate data.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check and production build
npm run lint
```

Requires Node 20.19+ or 22.12+. No API keys are needed for the map.

## Pages

Both presentation pages are **decks**: one page at a time, no scrolling, a Continue button (also the right arrow, Space or
Page Down; the left arrow goes back), progress ticks you can click, and a narrator's text on every page.

| Route | What it is |
|---|---|
| `/` | Presentation of the project (15 pages, short narrations): the problem, NISAR, pixels and dates, the machine learning and its proof, the observatory (map, layers, time, risks, ready-made regions), the Amazon's impact on the rest of South America, the honest wording. It ends at the map. |
| `/satelite` | The satellite deck "Dancing with the SARs" (11 pages): NISAR, its history, the radar echo, pixels, two dates and a change threshold, what to write on the map, rain and its lag, the model, the honest wording. It ends by leading to the map. |
| `/tecnico` | Data and methods: the technical record. Headline numbers, every data product and how it is read, the cleaning pipeline, the forecast and risk models, the land-cover test, the limits we state ourselves, and sources. Linked from the map's footer. |
| `/mapa` | The observatory (3D map, layers, forecast, risks, simulations, air currents, AI bar). Both decks end with an "Open the map" button that lands here. |

### On the map

- **Air currents**: animated streamlines of the 850 hPa wind (live from Open-Meteo, a typical Amazon pattern if it is offline), a layer toggle in the left panel; the trade winds crossing the Amazon are easiest to see at continental zoom.
- **AI bar** (the `AI` button or Ctrl/Cmd+K): a centered bar over a blurred map. Commands in English, Portuguese or Spanish ("fly to Manaus", "show rain", "open the Amazon forecast", "simulate a magnitude 7 earthquake here") run offline in the page; open questions go to the backend `POST /assistant` and are answered from what the map shows, never invented numbers.
- **Charts**: smooth areas and lines with hover read-outs, forecast bands and a today marker.

The decks tell one argument, **a problem and how it is solved**: seven chapters in the top bar (Problem, Instrument, Engine,
Observatory, Impact, Trust, Act), and every page states the problem it answers and the solution in two short lines.
The **Engine** chapter shows the machine learning, the core of the project: a radar pixel becomes decibels (`dB = 10·log10(x)`),
the model learns what is *normal* for a place (yearly rhythm of radar and rain), expects the coming months with a widening band, and
flags months that leave it; then the proof (it must beat a simple same-month rule on places and years it never saw: 54 % rule,
73 % radar, 85 % radar + ground color) and the three outputs (anomaly layer, chart with the expected range, scorecard). The
**Impact** page shows the Amazon's moisture reaching the Andes, São Paulo, Rio Grande do Sul and the Plata basin (3D arcs).

The backdrop is a **3D space scene** (`src/lib/spaceScene.ts`, three.js, loaded only by the decks): the Sun, the Moon, the Earth
with NASA Blue Marble from GIBS, clouds, and NISAR and the satellites that feed the map (Sentinel-1, GPM, SMAP, NOAA-21) on
their real orbit shapes (exaggerated heights). The camera flies from page to page (`FOCUS` and `WAYPOINTS`), follows the
satellites, and reacts to the pointer. The narrator appears as subtitles, one sentence at a time, in sync with the recording.
If WebGL is missing the page keeps the 2D star field.

English, Portuguese and Spanish everywhere. The look is a mission-control screen: dark, thin lines, the Earth's limb,
monospace labels, a clock in UTC, a figure on an "instrument screen" next to the narration.

### Narration and voice
Every step has a `narration` text written as if someone were explaining the problem (`src/pages/ProjectDeck.tsx` and
`src/pages/SatelliteDeck.tsx`, one text per language). It is shown as if it were being spoken. To add a voice, register one
handler (`src/lib/narration.ts`):

```ts
import { onNarration } from './lib/narration'
onNarration(({ deck, step, index, lang, text }) => { /* speak `text` in `lang`, stop the previous audio */ })
```

The deck calls it whenever a step appears or the language changes; nothing speaks until a handler is registered. The text is
also in the `data-narration` attribute of the narrator box.

The site is a single-page app: a static host needs a rewrite of unknown paths to `index.html` (the Vite dev server and
`vite preview` already do it).


**English voice (generated).** Every narration has an English recording in `public/audio/en/<deck>-<step>.mp3`, made with Cartesia text to speech (voice Clive, model `sonic-3`). The decks play it through `lib/voice.ts` (registered on `onNarration`): it starts with each page, stops when you leave it, a `♪ voice` button mutes it (remembered), and the first click starts it if the browser blocked autoplay. Portuguese and Spanish keep the text only. To regenerate after editing a narration (only changed texts are synthesised again, tracked in `manifest.json`):

    CARTESIA_API_KEY=... node scripts/narrate.mjs          # --force redoes all

The key is read from the environment and never stored in the repository.

## What is in the base

- Realistic 3D relief of South America and part of Central America (the Amazon is the focus), drawn by
  MapLibre GL: terrain from free AWS Terrarium tiles, sky and horizon fog, Sentinel-2
  cloudless imagery (10 m). The opening shot dives from the basin into a tilted view of Manaus.
- Only the region is loaded: every tile source is limited to `REGION_BOUNDS`, the camera cannot leave it, and
  the map fades to dark toward its border. Zoom is limited to 3 to 16 and pitch to 75 degrees.
- 3D cities: OpenStreetMap buildings (extruded by height, from zoom 13) and streets draped on the terrain, from
  OpenFreeMap vector tiles. Presets for São Paulo and Rio Grande do Sul, a Capitals menu with an oblique 3D view of
  each state capital and the main South American capitals, and the search opens the same view.
- NASA layers (GIBS) work in 2D and in 3D. Close up, where the flat raster is only a few huge pixels, every active
  layer also stands on the terrain as light pillars over a ground glow (`src/lib/lights.ts`). Pillar height is the
  relative intensity inside the current view, not a calibrated value.
- A fixed flat overview map (bottom right) shows the same NASA layers and date, where the 3D view is looking, and
  jumps the 3D view where you click.
- Point inspector (click the map or search a place; there is no area measuring) and **analysis period**: pick a place, choose a period (dates or 30 days / 6 months / 1 year / 5 years) and press
  *Analyze*. The **backend chooses the sensor** from the period (NISAR when all of it is from October 2025 on, otherwise OPERA) and says
  so. Radar series and daily rain (GPM IMERG) stream in live (`src/lib/analysis.ts`, `src/components/AnalysisBox.tsx`).
  - **What the backend has to say is shown, not just logged**: the `notice` events of the backend (the sensor chosen, a period cut short,
    scenes that failed, too little time for a confident reading) are listed under the period, errors first, and failures arrive in plain
    words. The backend's verdict (`done.assessment`: high, limited or insufficient confidence) decides the tone of the final message.
  - **The place is locked while data is processed** (analysis or forecast): map clicks, search, regions and *Clear* do
    nothing and say why. *Cancel* releases it.
  - **A message says when it ends** (a toast over the map and a summary in the panel): scenes and days read, the confidence, or what went
    wrong. The forecast also says when it is ready, cancelled or failed.
- Forecast to 2030: the `Run forecast` button asks the backend (`/forecast/stream`) to learn from the point's history
  since 2016 and project radar backscatter and rain with an 80 % band, shown with its backtest error and whether it
  beats "same as last year". The first run for a point reads years of scenes (a few minutes, with progress).
- Daily NASA layers are stacked over several days (`composite` in `catalog.ts`, `mosaic://` protocol): one day alone
  only holds that day's satellite swaths, which look like stripes.
- Risks: after a forecast, the inspector lists four risks (vegetation loss, flood, drought and fire, unusual change)
  with level, evidence and the land cover recognised by the pre-trained backend model, and the point's marker on the map
  takes the color of the overall level.
- Natural disaster simulations (earthquake, flood, wildfire, storm): pick a point, set a few parameters and the damage
  zones grow on the map with their area in km² and, when zoomed in, the buildings inside each zone (`src/lib/disasters.ts`
  documents the models). They are what-ifs, labeled as simulations. Each plays its own sound.
- Sound effects, all synthesized with the Web Audio API (no audio files): interface ticks, a whoosh when the camera flies,
  a ping when a point is picked, and one sound per disaster. The speaker button mutes them and is remembered.
- NASA layers are drawn in ONE color per layer at every zoom (the source palette only sets the strength, `tint.ts`), so
  a layer is always easy to recognise. Coarse layers (rain, temperature, soil moisture) turn into a smooth glow of the
  same color when zoomed in. Layers with no data for the date (not flown yet, or a scenario period) are not drawn and
  are struck through in the legend.
- NASA layers show at once and then sharpen: a soft copy of the first 4 zoom levels (a handful of tiles for the whole
  region) sits under the detailed copy that loads tile by tile, so panning never leaves the screen bare.
- The terrain has no shading layer (only the 3D shape of the relief, sky and fog).
- When the backend answers 503 (busy) the page retries by itself, and only says "not reachable" if `/health` fails
  (`src/lib/stream.ts`).
- Square corners everywhere; a spinner shows while imagery loads and play waits for it.
- Languages: English, Portuguese and Spanish (button in the top bar, remembered). Strings live in `src/lib/i18n.ts`.
- Timeline from 2016 to 2030 with play: C-band (OPERA), L-band (NISAR, 2026) and scenarios.
  Scenarios never show real imagery and are labeled as simulation.
- Flood scenario (water level computed from the elevation tiles) and a storm cell: simulations, labeled as such.

## Speed

Tile servers answer in 0.7 to 2 s each, and a tilted 3D view needs a few hundred tiles, so the work is about asking
for fewer tiles and never asking twice:

- Terrain tiles are 512 px (4x fewer requests) and use two hostnames (HTTP/1.1 allows 6 connections per host).
- Nothing outside the region is requested; imagery stops at zoom 13 and is over-zoomed after that.
- `public/sw.js` keeps every tile on the device (Cache API), so places already seen load instantly.
- City names are a GPU symbol layer, not page elements; map events are throttled to one update per frame.
- The pixel ratio is capped at 1.5, and moving an opacity slider does not reload tiles.
- Radar and rain are read for the period the person chose, only when asked (*Analyze*), because a long period holds many
  scenes; the timeline date only moves the marker on the charts.
- Backend: ASF searches and CMR lists are remembered, rain is cached per grid cell, and NISAR scenes run in one
  long-lived process pool. A repeated chunk answers in milliseconds.

## Backend data (live)

Radar series are **not** preloaded. Pressing *Analyze* for a place and a period makes the frontend call the
backend API of [asf-cleaner](https://github.com/luiz-fleal/asf-cleaner) (`asf-api`), which searches ASF,
reads only the needed pixels of each NISAR / OPERA scene and streams the cleaned rows back as Server-Sent
Events. The chart and the values at the timeline date fill in scene by scene.

```bash
# terminal 1: backend (the Earthdata token stays here, never in the frontend)
cd ../asf-cleaner
export EARTHDATA_TOKEN=...
uv run asf-api                      # http://127.0.0.1:8000

# terminal 2: frontend
npm run dev
```

`VITE_API_URL` points the frontend to another backend URL. A NISAR scene takes about a minute and a half
and an OPERA scene a few seconds, so the first request for a point is slow; the backend caches processed
scenes, so repeats are instant.

## Structure

```
src/
  lib/catalog.ts           layers, camera presets, region bounds and zoom limits, timeline constants
  lib/protocols.ts         flood and no-data-clearing tile protocols, MapLibre worker
  lib/live.ts, power.ts    live backend series (SSE) and NASA POWER climate
  components/MapView.tsx   the 3D map: terrain, layers, pins, camera, flood, storm
  components/*Panel.tsx    layers (left) and inspector (right)
  components/Timeline.tsx  play and date slider
  components/TopBar.tsx    brand, search and camera presets
```

## Stack

React 19, TypeScript, Vite, MapLibre GL JS.

## Logo

The logo lives in `public/logo.png` (color) and `public/logo-white.png` (one color). The `Logo` component shows it in the map's top bar,
the decks' header and the technical page; until the file exists it shows a drawn placeholder. To install or replace it:

    python3 scripts/install-logo.py path/to/logo.png [path/to/logo-white.png]

The script crops the empty margin, writes both files, makes the favicon (32 px), the app icons (192, 512) and the iOS icon, and
points `index.html` at them.

## Secrets

Tokens (Earthdata) live in environment variables and local files that
are git-ignored. Never commit a token.
