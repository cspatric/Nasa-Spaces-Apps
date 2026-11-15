import { useEffect, useRef, useState } from 'react'
import { API_URL } from '../lib/api'
import { interpret, SUGGESTIONS, type Action, type Ctx } from '../lib/assistant'
import { useI18n } from '../lib/i18n'
import { sound } from '../lib/sound'

interface Props {
  onClose: () => void
  ctx: Omit<Ctx, 'lang'>
  /** What the map currently shows, sent with open questions so the answer can refer to it. */
  context: string
  run: (actions: Action[]) => void
}

interface Answer { text: string; kind: 'done' | 'ai' | 'info' }

/** The AI bar: opens in the middle of the screen over a blurred map; commands run on the map, open questions go to the backend. */
export default function Assistant({ onClose, ctx, context, run }: Props) {
  const { t, lang } = useI18n()
  const input = useRef<HTMLInputElement>(null)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [answer, setAnswer] = useState<Answer | null>(null)

  useEffect(() => {
    input.current?.focus()
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])

  const submit = async (raw: string) => {
    const q = raw.trim()
    if (!q || busy) return
    const r = interpret(q, { ...ctx, lang })
    if (r.matched) {
      sound.success()
      setAnswer({ text: r.text, kind: 'done' })
      if (r.actions.length) {
        run(r.actions)
        setTimeout(onClose, 1500) // the map is behind the blur: show it once the command is done
      }
      return
    }
    setBusy(true)
    setAnswer(null)
    try {
      const res = await fetch(`${API_URL}/assistant`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: q, lang, context }) })
      const body = (await res.json()) as { configured?: boolean; answer?: string; detail?: string }
      if (res.ok && body.configured && body.answer) setAnswer({ text: body.answer, kind: 'ai' })
      else if (res.ok && body.configured === false) setAnswer({ text: t('I did not understand that as a command. Open questions need an AI key on the backend (ANTHROPIC_API_KEY); commands like the examples below work without it.'), kind: 'info' })
      else setAnswer({ text: body.detail ?? t('The assistant could not answer now.'), kind: 'info' })
    } catch {
      setAnswer({ text: t('The backend is not reachable, so only commands work now.'), kind: 'info' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="ai-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }} role="dialog" aria-modal="true" aria-label={t('Assistant')}>
      <div className="ai-panel">
        <div className="ai-bar">
          <span className="ai-spark" aria-hidden="true">✦</span>
          <input
            ref={input} value={text} onChange={(e) => setText(e.target.value)} disabled={busy}
            placeholder={t('Ask, or tell the map what to do…')} aria-label={t('Assistant')}
            onKeyDown={(e) => { if (e.key === 'Enter') void submit(text) }} />
          {busy ? <span className="spin" /> : <kbd>Enter ↵</kbd>}
        </div>
        {answer && <div className={`ai-answer ${answer.kind}`}>{answer.text}</div>}
        {!answer && (
          <div className="ai-chips">
            {SUGGESTIONS[lang].map((s) => <button key={s} onClick={() => { setText(s); void submit(s) }}>{s}</button>)}
          </div>
        )}
        <div className="ai-foot mono"><span>{t('Esc closes')}</span><span>{t('Understands English, Portuguese and Spanish')}</span></div>
      </div>
    </div>
  )
}
