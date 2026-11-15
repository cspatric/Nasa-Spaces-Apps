import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { I18nContext, LANGS, initialLang, translate, type Lang } from '../lib/i18n'

export default function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang)
  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    try { localStorage.setItem('saris-lang', l) } catch { /* storage may be blocked */ }
  }, [])
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])
  const value = useMemo(() => ({
    lang, setLang,
    locale: LANGS.find((l) => l.id === lang)!.locale,
    t: (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars),
  }), [lang, setLang])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
