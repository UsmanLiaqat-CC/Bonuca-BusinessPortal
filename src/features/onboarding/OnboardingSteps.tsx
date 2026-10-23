import { Check } from 'lucide-react'
import { Fragment } from 'react'
import { useT } from '@/i18n'
import { cn } from '@/lib/cn'

/** Redesign onboarding stepper (Business → Plan → First program) shown above the page title. */
export function OnboardingSteps({ current }: { current: 1 | 2 | 3 }) {
  const t = useT()
  const steps = [t('onb.stepBusiness'), t('onb.stepPlan'), t('onb.stepFirst')]
  return (
    <div className="stepper reveal-up flex-wrap" aria-label={t('onb.step', { current, total: 3 })}>
      {steps.map((label, i) => {
        const n = i + 1
        return (
          <Fragment key={label}>
            <div className={cn('s', n < current && 'done', n === current && 'cur')} aria-current={n === current ? 'step' : undefined}>
              <span className="n">{n < current ? <Check className="size-[13px]" aria-hidden /> : n}</span>
              <span className="hidden sm:inline">{label}</span>
            </div>
            {i < steps.length - 1 && <span className="sep" aria-hidden />}
          </Fragment>
        )
      })}
      <span className="ml-auto text-[13px] font-semibold text-faint">{t('onb.step', { current, total: 3 })}</span>
    </div>
  )
}

/** Progress bars at the top of each onboarding card. */
export function OnboardingBars({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div className="prog-steps mb-[22px]" aria-hidden>
      {[1, 2, 3].map((i) => (
        <span key={i} className={cn('st', i <= current && 'done')}>
          <i style={{ animationDelay: `${i * 120}ms` }} />
        </span>
      ))}
    </div>
  )
}
