# TerraPulse AI

NASA Space Apps Challenge 2026, challenge "Dancing with the SARs".
An interactive 3D observatory of surface change that uses NISAR (L-band) radar
data, OPERA RTC-S1 (C-band, 2016 to 2026) and NASA climate data.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check and production build
npm run lint
```

Requires Node 20.19+ or 22.12+.

## Stack

React 19, TypeScript, Vite.

## Secrets

Tokens (Earthdata, Cesium) live in environment variables and local files that
are git-ignored. Copy `.env.example` to `.env` for local use. Never commit a
token.
