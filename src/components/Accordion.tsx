import { useState, type ReactNode } from 'react'

interface Props {
  title: string
  /** Short state shown on the right of the header, so a closed group still says what is inside. */
  summary?: string
  defaultOpen?: boolean
  children: ReactNode
}

/** A group of controls that can be folded: only the title and a one-line summary show when it is closed. */
export default function Accordion({ title, summary, defaultOpen = false, children }: Props) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className={`acc ${open ? 'open' : ''}`}>
      <button className="acc-head" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span className="acc-title">{title}</span>
        {summary && <span className="acc-summary">{summary}</span>}
        <svg className="acc-chev" viewBox="0 0 12 12" width="10" height="10" aria-hidden="true"><path d="m2 4 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>
      </button>
      {open && <div className="acc-body">{children}</div>}
    </section>
  )
}
