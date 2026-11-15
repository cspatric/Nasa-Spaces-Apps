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

interface Answer { text: string; kind: 'done' | 'ai' | 'info'; did?: number }

/** The AI bar: opens in the middle of the screen over a blurred map; commands run on the map, open questions go to the backend. */
export default function Assistant({ onClose, ctx, context, run }: Props) {
  const { t, lang } = useI18n()
  const input = useRef<HTMLInputElement>(null)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [answer, setAnswer] = useState<Answer | null>(null)
  /** After actions run, the blur lifts so the change on the map is visible while the answer stays. */
  const [peek, setPeek] = useState(false)
  const history = useRef<{ role: 'user' | 'assistant'; text: string }[]>([])

  useEffect(() => {
    input.current?.focus()
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])

  const submit = async (raw: string) => {
    const q = raw.trim()
    if (!q || busy) return
    setBusy(true)
    setAnswer(null)
    setPeek(false)
    setText('')
    // the real assistant first (it understands questions and free wording); the built-in commands when it is not there
    try {
      const res = await fetch(`${API_URL}/assistant`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, lang, context, history: history.current.slice(-6) }),
      })
      const body = (await res.json()) as { configured?: boolean; answer?: string; actions?: Action[]; detail?: string }
      if (res.ok && body.configured && body.answer) {
        const acts = Array.isArray(body.actions) ? body.actions : []
        history.current.push({ role: 'user', text: q }, { role: 'assistant', text: body.answer })
        sound.success()
        setAnswer({ text: body.answer, kind: 'ai', did: acts.length })
        if (acts.length) { run(acts); setPeek(true) }
      } else if (res.ok && body.configured === false) {
        offline(q)
      } else {
        setAnswer({ text: body.detail ?? t('The assistant could not answer now.'), kind: 'info' })
      }
    } catch {
      offline(q, true)
    } finally {
      setBusy(false)
    }
  }

  /** No AI on the backend (or no backend): the commands the page understands on its own. */
  const offline = (q: string, down = false) => {
    const r = interpret(q, { ...ctx, lang })
    if (r.matched) {
      sound.success()
      setAnswer({ text: r.text, kind: 'done', did: r.actions.length })
      if (r.actions.length) { run(r.actions); setPeek(true) }
    } else {
      setAnswer({ text: down ? t('The backend is not reachable, so only commands work now.') : t('I did not understand that as a command. Open questions need the AI key on the backend (BEDROCK_API_KEY); commands like the examples below work without it.'), kind: 'info' })
    }
  }

  return (
    <div className={`ai-overlay ${peek ? 'peek' : ''}`} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }} role="dialog" aria-modal="true" aria-label={t('Assistant')}>
      <div className="ai-panel">
        <div className="ai-bar">
          <span className="ai-spark" aria-hidden="true">✦</span>
          <input
            ref={input} value={text} onChange={(e) => setText(e.target.value)} disabled={busy}
            placeholder={t('Ask, or tell the map what to do…')} aria-label={t('Assistant')}
            onKeyDown={(e) => { if (e.key === 'Enter') void submit(text) }} />
          {busy ? <span className="spin" /> : <kbd>Enter ↵</kbd>}
        </div>
        {busy && <div className="ai-answer thinking" aria-live="polite"><span className="dots"><i /><i /><i /></span> {t('Thinking…')}</div>}
        {answer && <div className={`ai-answer ${answer.kind}`} role="status">{answer.text}{answer.did ? <span className="ai-did mono">{t('{n} change(s) on the map', { n: answer.did })}</span> : null}</div>}
        {!answer && !busy && (
          <div className="ai-chips">
            {SUGGESTIONS[lang].map((s) => <button key={s} onClick={() => { setText(s); void submit(s) }}>{s}</button>)}
          </div>
        )}
        <div className="ai-foot mono"><span>{t('Esc closes')}</span><span>{t('Understands English, Portuguese and Spanish')}</span></div>
      </div>
    </div>
  )
}
