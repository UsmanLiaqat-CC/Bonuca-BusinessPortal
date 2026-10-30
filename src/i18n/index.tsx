import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { LanguageCode } from '@/types/domain'
import { en, type Dictionary, type MessageKey } from './locales/en'
import { de } from './locales/de'
import { tr } from './locales/tr'
import { fr } from './locales/fr'
import { it } from './locales/it'
import { ru } from './locales/ru'
import { kk } from './locales/kk'

/**
 * Interface languages supported at launch (spec §4.12). To add a language: add a locale file,
 * register it here, and extend LanguageCode. Missing keys fall back to English.
 */
export const LANGUAGES: { code: LanguageCode; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'tr', label: 'Türkçe' },
  { code: 'fr', label: 'Français' },
  { code: 'it', label: 'Italiano' },
  { code: 'ru', label: 'Русский' },
  { code: 'kk', label: 'Қазақша' },
]

const DICTIONARIES: Record<LanguageCode, Dictionary> = { en, de, tr, fr, it, ru, kk }
const KEY = 'bonuca.ui.language'

export type TranslateFn = (key: MessageKey, vars?: Record<string, string | number>) => string

export function translate(language: LanguageCode, key: MessageKey, vars?: Record<string, string | number>): string {
  const template = DICTIONARIES[language][key] ?? en[key]
  return vars ? template.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? `{${name}}`)) : template
}

/** Device/browser language when supported, else English (spec §1.1). */
export function detectLanguage(): LanguageCode {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved && saved in DICTIONARIES) return saved as LanguageCode
  } catch {
    /* ignore */
  }
  const nav = typeof navigator !== 'undefined' ? navigator.language.slice(0, 2) : 'en'
  return nav in DICTIONARIES ? (nav as LanguageCode) : 'en'
}

interface I18nValue {
  language: LanguageCode
  setLanguage: (l: LanguageCode) => void
  t: TranslateFn
}

const I18nContext = createContext<I18nValue | null>(null)

export function I18nProvider({ children, initial }: { children: ReactNode; initial?: LanguageCode }) {
  const [language, setLanguageState] = useState<LanguageCode>(() => initial ?? detectLanguage())
  const setLanguage = useCallback((l: LanguageCode) => {
    setLanguageState(l)
    document.documentElement.lang = l
    try {
      localStorage.setItem(KEY, l)
    } catch {
      /* ignore */
    }
  }, [])
  const value = useMemo<I18nValue>(
    () => ({ language, setLanguage, t: (key, vars) => translate(language, key, vars) }),
    [language, setLanguage],
  )
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const v = useContext(I18nContext)
  if (!v) throw new Error('useI18n must be used inside <I18nProvider>')
  return v
}

export function useT(): TranslateFn {
  return useI18n().t
}

export type { MessageKey }
