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

| Route | What it is |
|---|---|
| `/` | Presentation of the project, as a scrolling story (what it is, NASA layers, forecast, risks, regions, disasters, honest limits). It ends by leading to the satellite page. English, Portuguese and Spanish. |
| `/satelite` | The satellite story, "Dancing with the SARs" (`public/satelite.html`, a page of its own: radar echo, pixels, two dates, rain, the model). Its back link goes to `/` and it ends by leading to the map. |
| `/mapa` | The observatory (3D map, layers, forecast, risks, simulations). |

The site is a single-page app: a static host needs a rewrite of unknown paths to `index.html` (the Vite dev server and
`vite preview` already do it). `public/satelite.html` is served as it is.

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
- Point inspector: radar series (NISAR, OPERA) and daily rain (GPM IMERG), all streamed live from the backend.
- Forecast to 2030: the `Run forecast` button asks the backend (`/forecast/stream`) to learn from the point's history
  since 2016 and project radar backscatter and rain with an 80 % band, shown with its backtest error and whether it
  beats "same as last year". The first run for a point reads years of scenes (a few minutes, with progress).
- Daily NASA layers are stacked over several days (`composite` in `catalog.ts`, `mosaic://` protocol): one day alone
  only holds that day's satellite swaths, which look like stripes.
- Risks: after a forecast, the inspector lists four risks (vegetation loss, flood, drought and fire, unusual change)
  with level, evidence and the land cover recognised by the pre-trained backend model, and the point's marker on the map
  takes the color of the overall level.
- Area selection works on the flat and on the tilted 3D map: the Area button (map controls or inspector) or Shift+drag draws a
  rectangle on the screen, its four corners are put on the ground, the box follows the mouse, Esc cancels, and releasing the
  button outside the map still finishes it.
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
- Radar and rain are read only for the days around the timeline date, in 30-day chunks (`src/lib/chunks.ts`):
  a point opens in seconds, moving the date reads only the chunks it newly needs.
- Backend: ASF searches and CMR lists are remembered, rain is cached per grid cell, and NISAR scenes run in one
  long-lived process pool. A repeated chunk answers in milliseconds.

## Backend data (live)

Radar series are **not** preloaded. Picking a point (or searching a city) makes the frontend call the
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

## Secrets

Tokens (Earthdata) live in environment variables and local files that
are git-ignored. Never commit a token.
