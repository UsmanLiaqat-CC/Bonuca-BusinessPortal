import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Crown, Layers, Stamp, Coins } from 'lucide-react'
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
import { OnboardingSteps } from '../OnboardingSteps'

const ICONS: Record<ProgramType, typeof Stamp> = { stamp: Stamp, membership: Crown, tier: Layers, points: Coins }

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
    <AuthLayout title={t('onb.first.title')} subtitle="Saved as a Draft. Finish the full setup (logo, design, publishing) in Loyalty Programs." wide>
      <OnboardingSteps current={3} />
      <div className="flex flex-col gap-5">
        <div role="radiogroup" aria-label="Program type" className="grid gap-3 sm:grid-cols-4">
          {PROGRAM_TYPES.map((p) => {
            const Icon = ICONS[p]
            return (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={type === p}
                onClick={() => setType(p)}
                className={cn('flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm font-medium', type === p ? 'border-accent bg-accent-soft' : 'border-line hover:bg-surface-2')}
              >
                <Icon className="size-5 text-accent" aria-hidden />
                {t(`type.${p}`)}
              </button>
            )
          })}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
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
          <p className="rounded-lg bg-warning-soft px-3 py-2 text-sm" role="note">
            {PREVIEW_LOCK_MESSAGE}
          </p>
        )}
        {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">{error}</p>}
        <div className="flex flex-wrap items-center gap-3">
          <Button size="lg" onClick={create} loading={busy} disabled={isPreview} aria-disabled={isPreview}>
            Create program
          </Button>
          <Button variant="ghost" onClick={() => void finish()}>
            {t('onb.first.later')}
          </Button>
        </div>
      </div>
    </AuthLayout>
  )
}
