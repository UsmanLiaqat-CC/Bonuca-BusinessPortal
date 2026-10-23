import { useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Coffee, Coins, Crown, Eye, Layers, Stamp } from 'lucide-react'
import { useT } from '@/i18n'
import { useBackend } from '@/state/services'
import { SESSION_KEY, useSessionQuery } from '@/state/session'
import { PROGRAM_TYPES, type ProgramType } from '@/types/domain'
import { defaultProgramDraft, suggestedCurrency } from '@/lib/factories'
import { resolvePlanState } from '@/lib/plan'
import { PREVIEW_LOCK_MESSAGE } from '@/lib/access'
import { errorMessage } from '@/lib/errors'
import { Field, Input } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { AuthLayout } from '@/features/auth/components/AuthLayout'
import { OnboardingBars, OnboardingSteps } from '../OnboardingSteps'

const ICONS: Record<ProgramType, typeof Stamp> = { stamp: Stamp, membership: Crown, tier: Layers, points: Coins }
/** Type-card accent colours from the redesign (decorative only). */
const COLORS: Record<ProgramType, string> = { stamp: '#1747F8', membership: '#7C3AED', tier: '#0F9D6E', points: '#C2410C' }
const BLURB: Record<ProgramType, string> = {
  stamp: 'Collect stamps, earn a reward',
  membership: 'A standing perk for members',
  tier: 'Levels unlocked by visits',
  points: 'Earn points per purchase',
}

/** Live preview of the quick-create values in the default Bonuca pass look. Illustration only. */
function QuickPassPreview({ type, name, reward, rule }: { type: ProgramType; name: string; reward: string; rule: number }) {
  const stamps = Math.min(Math.max(rule || 0, 1), 12)
  return (
    <div className="pass" aria-hidden>
      <div className="pass-top">
        <div className="pass-logo ph">{(name || 'P').slice(0, 1).toUpperCase()}</div>
        <div className="pass-name">{name || 'Coffee Card'}</div>
      </div>
      {type === 'stamp' && (
        <>
          <div className="pass-lbl">Reward</div>
          <div className="pass-val">{reward || '1 Free Coffee'}</div>
          <div className="stamps">
            {Array.from({ length: stamps }, (_, i) => (
              <span key={i} className={i < Math.min(3, stamps) ? 'stamp on' : 'stamp'}>
                <Coffee />
              </span>
            ))}
          </div>
        </>
      )}
      {type === 'membership' && (
        <>
          <div className="pass-lbl">Benefit</div>
          <div className="pass-val">{reward || '—'}</div>
        </>
      )}
      {type === 'tier' && (
        <>
          <div className="pass-lbl">Current tier</div>
          <div className="pass-val">Member</div>
          <div className="prog">
            <i style={{ '--w': '40%' } as CSSProperties} />
          </div>
          <div className="pass-lbl">Top tier reward</div>
          <div className="pass-val sm">{reward || '—'}</div>
        </>
      )}
      {type === 'points' && (
        <>
          <div className="pass-lbl">Balance</div>
          <div className="pass-val">0 pts</div>
          <div className="pass-lbl">First reward</div>
          <div className="pass-val sm">{reward || '—'}</div>
        </>
      )}
    </div>
  )
}

/** Spec §1.6 — optional quick-create with essential fields (name, reward, key rule). Always skippable. */
export default function FirstProgramPage() {
  const t = useT()
  const backend = useBackend()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const session = useSessionQuery()
  const [type, setType] = useState<ProgramType>('stamp')
  const [name, setName] = useState('')
  const [reward, setReward] = useState('')
  const [rule, setRule] = useState('10')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState(false)

  const data = session.data
  if (!data?.subscription || !data.business) return null
  const isPreview = resolvePlanState(data.subscription, data.catalog).mode === 'preview'

  const finish = async () => {
    await backend.finishOnboarding()
    await qc.invalidateQueries({ queryKey: SESSION_KEY })
    navigate('/app/dashboard', { replace: true })
  }

  const rewardLabel = { stamp: 'Reward', membership: 'Benefit', tier: 'Top tier reward', points: 'First reward' }[type]
  const ruleLabel = { stamp: 'Number of stamps required', membership: '', tier: 'Visits needed for the second tier', points: 'Points earned per 1 unit spent' }[type]

  const create = async () => {
    setError(null)
    const n = Number(rule)
    if (!name.trim()) return setError('Program name is required.')
    if (!reward.trim()) return setError(`${rewardLabel} is required.`)
    if (type !== 'membership' && !(n > 0)) return setError(`${ruleLabel} must be greater than 0.`)
    const draft = defaultProgramDraft(type, suggestedCurrency(data.business!.country))
    draft.name = name.trim()
    if (draft.type === 'stamp') Object.assign(draft.config, { rewardDescription: reward.trim(), stampsRequired: n })
    if (draft.type === 'membership') Object.assign(draft.config, { benefitDescription: reward.trim(), benefitType: 'perk' })
    if (draft.type === 'tier') {
      draft.config.tiers = draft.config.tiers.map((tier, i) => ({ ...tier, requiredValue: i * n, rewards: i === draft.config.tiers.length - 1 ? reward.trim() : '' }))
    }
    if (draft.type === 'points') {
      draft.config.ratio = { spend: 1, points: n }
      draft.config.rewards = [{ ...draft.config.rewards[0]!, name: reward.trim(), pointsRequired: 100 }]
    }
    setBusy(true)
    try {
      if (!created) {
        await backend.createProgram(draft)
        setCreated(true)
      }
      await finish()
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      title={t('onb.first.title')}
      subtitle="Saved as a Draft. Finish the full setup (logo, design, publishing) in Loyalty Programs."
      size="xl"
      top={<OnboardingSteps current={3} />}
      eyebrow={
        <>
          <Stamp className="size-[13px]" aria-hidden /> {t('onb.eyebrow')}
        </>
      }
    >
      <OnboardingBars current={3} />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="flex flex-col gap-[18px]">
          <div role="radiogroup" aria-label="Program type" className="type-grid">
            {PROGRAM_TYPES.map((p) => {
              const Icon = ICONS[p]
              return (
                <div key={p} className={cn('type-card relative', type === p && 'on')} style={{ '--c': COLORS[p] } as CSSProperties}>
                  <span className="ti" aria-hidden>
                    <Icon className="size-[18px]" />
                  </span>
                  {/* The whole card is the hit area; the radio's own text stays the type name only. */}
                  <button type="button" role="radio" aria-checked={type === p} onClick={() => setType(p)} className="text-left font-display text-base font-semibold tracking-[-0.01em] after:absolute after:inset-0 after:rounded-[20px] after:content-['']">
                    {t(`type.${p}`)}
                  </button>
                  <small>{BLURB[p]}</small>
                </div>
              )
            })}
          </div>
          <div className="grid gap-[18px] sm:grid-cols-3">
            <Field label="Program name" required>
              {(p) => <Input {...p} value={name} onChange={(e) => setName(e.target.value)} placeholder={type === 'stamp' ? 'Coffee Card' : undefined} />}
            </Field>
            <Field label={rewardLabel} required>
              {(p) => <Input {...p} value={reward} onChange={(e) => setReward(e.target.value)} placeholder={type === 'stamp' ? '1 Free Coffee' : undefined} />}
            </Field>
            {type !== 'membership' && (
              <Field label={ruleLabel} required>
                {(p) => <Input {...p} type="number" min={1} value={rule} onChange={(e) => setRule(e.target.value)} />}
              </Field>
            )}
          </div>
          {isPreview && (
            <p className="callout warn" role="note">
              {PREVIEW_LOCK_MESSAGE}
            </p>
          )}
          {error && (
            <p className="callout border-transparent bg-danger-soft text-danger" role="alert">
              {error}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <Button size="lg" onClick={create} loading={busy} disabled={isPreview} aria-disabled={isPreview}>
              Create program
              <ArrowRight className="size-[15px]" aria-hidden />
            </Button>
            <Button variant="ghost" onClick={() => void finish()}>
              {t('onb.first.later')}
            </Button>
          </div>
        </div>
        <div>
          <div className="eyebrow w-full justify-center">
            <Eye className="size-[13px]" aria-hidden /> {t('onb.livePreview')}
          </div>
          <QuickPassPreview type={type} name={name} reward={reward} rule={Number(rule)} />
        </div>
      </div>
    </AuthLayout>
  )
}
