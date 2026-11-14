import { CAMERA_PRESETS, type CameraPreset } from '../lib/catalog'

interface Props {
  onFly: (p: CameraPreset) => void
}

export function BrandMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#0d1014" stroke="rgba(255,255,255,.1)" />
      <g fill="none" stroke="#5eead4" strokeLinecap="round" strokeWidth="2.2">
        <path d="M16 5.5a10.5 10.5 0 0 1 10.5 10.5" />
        <path d="M16 10a6 6 0 0 1 6 6" opacity=".75" />
        <path d="M16 14a2 2 0 0 1 2 2" opacity=".5" />
      </g>
      <circle cx="9.5" cy="22.5" r="2.4" fill="#5eead4" />
    </svg>
  )
}

export default function TopBar({ onFly }: Props) {
  return (
    <header className="topbar">
      <div className="brand glass">
        <BrandMark />
        <div>
          <div className="brand-name">SARIS</div>
          <div className="brand-tag">Surface change observatory</div>
        </div>
      </div>
      <nav className="presets glass" aria-label="Camera presets">
        {CAMERA_PRESETS.map((p) => (
          <button key={p.id} onClick={() => onFly(p)}>
            {p.label}
          </button>
        ))}
      </nav>
      <div className="status glass" title="No SARIS data is connected yet">
        <span className="dot warn" /> Base layout · data not connected
      </div>
    </header>
  )
}
