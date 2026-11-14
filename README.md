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

Requires Node 20.19+ or 22.12+. `npm run dev` and `npm run build` first copy the
CesiumJS runtime assets into `public/cesium` (generated, git-ignored).

## What is in the base

- 3D globe (CesiumJS) with NASA GIBS imagery: Blue Marble and daily MODIS true color.
- NASA overlay layers with opacity: NISAR backscatter, OPERA surface water and
  vegetation loss alerts, IMERG rain, VIIRS land surface temperature, SMAP soil moisture.
- Timeline from 2016 to 2030 with play: C-band (OPERA), L-band (NISAR, 2026) and
  scenarios. Scenarios never show real imagery and are labeled as simulation.
- Point inspector, saved pins and camera presets (Manaus, Amazon basin, Southern Brazil).
- Placeholders for SARIS analysis layers (change map, anomaly score) and for the
  per-point series (NISAR, OPERA, rain, temperature, soil moisture, water).
- Flood scenario (water plane at a chosen level). It needs 3D terrain.

No SARIS data is connected yet: the analysis layers and point series wait for the
first processed scenes.

## 3D terrain (optional)

Without a token the globe uses a flat ellipsoid. For real terrain, create a
Cesium ion token, restrict it to the site URL in the Cesium dashboard, and put it in `.env`:

```bash
cp .env.example .env
# VITE_CESIUM_TOKEN=...
```

## Structure

```
src/
  cesium-setup.ts          Cesium base URL (imported first)
  lib/catalog.ts           GIBS layers, camera presets, timeline constants
  lib/dates.ts             date helpers and C-band / L-band / scenario modes
  components/CesiumMap.tsx the globe: layers, pins, camera, flood plane
  components/*Panel.tsx    layers (left) and inspector (right)
  components/Timeline.tsx  play and date slider
  components/TopBar.tsx    brand and camera presets
```

## Stack

React 19, TypeScript, Vite, CesiumJS.

## Secrets

Tokens (Earthdata, Cesium) live in environment variables and local files that
are git-ignored. Never commit a token.
