import { useState } from 'react'

/** The old drawn mark, only shown until the real logo file is in `public/`. */
function Fallback({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="0" fill="rgba(255,255,255,.06)" />
      <g fill="none" stroke="#5eead4" strokeLinecap="round" strokeWidth="2.2">
        <path d="M16 5.5a10.5 10.5 0 0 1 10.5 10.5" />
        <path d="M16 10a6 6 0 0 1 6 6" opacity=".75" />
        <path d="M16 14a2 2 0 0 1 2 2" opacity=".5" />
      </g>
      <circle cx="9.5" cy="22.5" r="2.4" fill="#5eead4" />
    </svg>
  )
}

/**
 * The project's logo: `public/logo.png` (the blue-violet globe) or `public/logo-white.png` (the one-color version, for
 * busy backgrounds). If the file is missing the drawn mark stays, so nothing breaks while the file is being added.
 */
export default function Logo({ size = 30, white = false }: { size?: number; white?: boolean }) {
  const [missing, setMissing] = useState(false)
  if (missing) return <Fallback size={size} />
  return <img className="logo" src={`${import.meta.env.BASE_URL}${white ? 'logo-white' : 'logo'}.png`} width={size} height={size} alt="" aria-hidden="true" draggable={false} onError={() => setMissing(true)} />
}
