import { Monitor, Moon, Sun } from 'lucide-react'
import { LANGUAGES, useI18n } from '@/i18n'
import { useTheme, type ThemePreference } from '@/state/theme'
import type { LanguageCode } from '@/types/domain'
import { Segmented } from '@/components/ui/Tabs'

export function LanguageSelect({ onChange, compact }: { onChange?: (l: LanguageCode) => void; compact?: boolean }) {
  const { language, setLanguage, t } = useI18n()
  return (
    <label className={compact ? 'inline-flex items-center' : 'field'}>
      <span className={compact ? 'sr-only' : 'label'}>{t('language.label')}</span>
      <select
        value={language}
        onChange={(e) => {
          const l = e.target.value as LanguageCode
          setLanguage(l)
          onChange?.(l)
        }}
        className={compact ? 'lang' : 'select max-w-xs'}
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

/** Light / Dark / System switch (redesign icon segmented control with sliding thumb). */
export function ThemeToggle() {
  const { preference, setPreference } = useTheme()
  const { t } = useI18n()
  return (
    <Segmented
      role="radiogroup"
      icons
      label={t('theme.label')}
      value={preference}
      onChange={setPreference}
      items={OPTIONS.map(({ value, icon: Icon, key }) => ({ value, ariaLabel: t(key), title: t(key), label: <Icon className="size-[15px]" aria-hidden /> }))}
    />
  )
}
