import { Monitor, Moon, Sun } from 'lucide-react'
import { LANGUAGES, useI18n } from '@/i18n'
import { useTheme, type ThemePreference } from '@/state/theme'
import type { LanguageCode } from '@/types/domain'

export function LanguageSelect({ onChange, compact }: { onChange?: (l: LanguageCode) => void; compact?: boolean }) {
  const { language, setLanguage, t } = useI18n()
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <span className={compact ? 'sr-only' : 'text-muted'}>{t('language.label')}</span>
      <select
        value={language}
        onChange={(e) => {
          const l = e.target.value as LanguageCode
          setLanguage(l)
          onChange?.(l)
        }}
        className="h-9 rounded-lg border border-line bg-surface px-2 text-sm"
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
    </label>
  )
}

const OPTIONS: { value: ThemePreference; icon: typeof Sun; key: 'theme.light' | 'theme.dark' | 'theme.system' }[] = [
  { value: 'light', icon: Sun, key: 'theme.light' },
  { value: 'dark', icon: Moon, key: 'theme.dark' },
  { value: 'system', icon: Monitor, key: 'theme.system' },
]

export function ThemeToggle() {
  const { preference, setPreference } = useTheme()
  const { t } = useI18n()
  return (
    <div role="radiogroup" aria-label={t('theme.label')} className="inline-flex rounded-lg border border-line bg-surface p-0.5">
      {OPTIONS.map(({ value, icon: Icon, key }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={preference === value}
          aria-label={t(key)}
          title={t(key)}
          onClick={() => setPreference(value)}
          className={preference === value ? 'rounded-md bg-accent p-1.5 text-on-accent' : 'rounded-md p-1.5 text-muted hover:text-fg'}
        >
          <Icon className="size-4" aria-hidden />
        </button>
      ))}
    </div>
  )
}
