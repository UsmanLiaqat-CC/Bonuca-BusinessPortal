import { useT } from '@/i18n'

export function OnboardingSteps({ current }: { current: 1 | 2 | 3 }) {
  const t = useT()
  return (
    <div className="mb-4 flex items-center gap-2" aria-label={t('onb.step', { current, total: 3 })}>
      {[1, 2, 3].map((n) => (
        <span key={n} className={n <= current ? 'h-1.5 flex-1 rounded-full bg-accent' : 'h-1.5 flex-1 rounded-full bg-line'} />
      ))}
      <span className="ml-2 text-xs text-muted whitespace-nowrap">{t('onb.step', { current, total: 3 })}</span>
    </div>
  )
}
