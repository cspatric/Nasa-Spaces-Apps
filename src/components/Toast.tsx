import { useEffect, useRef } from 'react'
import { useI18n } from '../lib/i18n'

export interface ToastMessage {
  /** A new id shows the message again. */
  id: string
  level: 'success' | 'warning' | 'error' | 'info'
  /** English templates, translated here. */
  lines: { text: string; vars?: Record<string, string | number> }[]
}

interface Props {
  toast: ToastMessage
  onClose: () => void
}

/** A short message over the map (an analysis ended, a place is locked). Warnings and errors stay longer. */
export default function Toast({ toast, onClose }: Props) {
  const { t } = useI18n()
  const close = useRef(onClose)
  useEffect(() => { close.current = onClose })
  useEffect(() => {
    const timer = setTimeout(() => close.current(), toast.level === 'success' || toast.level === 'info' ? 9000 : 20000)
    return () => clearTimeout(timer)
  }, [toast.id, toast.level])
  return (
    <div className={`toast glass ${toast.level}`} role={toast.level === 'error' ? 'alert' : 'status'}>
      <i className="toast-mark" aria-hidden="true" />
      <div className="toast-text">
        {toast.lines.map((l, i) => (i === 0 ? <strong key={l.text}>{t(l.text, l.vars)}</strong> : <span key={l.text}>{t(l.text, l.vars)}</span>))}
      </div>
      <button className="toast-x" onClick={onClose} aria-label={t('Close')}>×</button>
    </div>
  )
}
