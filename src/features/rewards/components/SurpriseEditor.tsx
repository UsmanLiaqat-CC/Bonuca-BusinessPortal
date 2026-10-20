import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import type { Program, SurpriseConfig } from '@/types/domain'
import { useToast } from '@/state/toast'
import { errorMessage } from '@/lib/errors'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Input, Toggle } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { LifecycleBadge } from '@/components/data-display/StatusBadge'
import { GuardedButton } from '@/components/feedback/GuardedButton'
import { useUpdateSurprise } from '@/features/loyalty-programs/hooks'

/** Spec §4.8 Surprise rewards: frequency/probability + reward pool; off by default. */
export function SurpriseEditor({ program }: { program: Program }) {
  const toast = useToast()
  const update = useUpdateSurprise()
  const [cfg, setCfg] = useState<SurpriseConfig>(program.surprise)
  const [item, setItem] = useState('')
  const [error, setError] = useState<string | null>(null)
  const oneIn = cfg.probabilityPercent > 0 ? Math.round(100 / cfg.probabilityPercent) : null

  const save = () => {
    setError(null)
    if (!(cfg.probabilityPercent > 0 && cfg.probabilityPercent <= 100)) return setError('Probability must be between 0.1 and 100 %.')
    if (cfg.enabled && cfg.pool.length === 0) return setError('Add at least one reward to the pool.')
    update.mutate({ id: program.id, surprise: cfg }, { onSuccess: () => toast.success('Surprise rewards saved.'), onError: (e) => toast.error(errorMessage(e)) })
  }

  return (
    <Card>
      <CardHeader title={program.name} actions={<LifecycleBadge status={program.status} />} />
      <CardBody className="flex flex-col gap-4">
        <Toggle label="Surprise rewards" description="Random, unannounced rewards after a confirmed scan. Customers never see a schedule." checked={cfg.enabled} onChange={(enabled) => setCfg({ ...cfg, enabled })} />
        <label className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium">Probability per scan</span>
          <Input type="number" min={0.1} max={100} step={0.1} className="w-24" value={cfg.probabilityPercent} onChange={(e) => setCfg({ ...cfg, probabilityPercent: Number(e.target.value) })} />
          <span className="text-muted">%{oneIn ? ` · about 1 in ${oneIn} scans` : ''}</span>
        </label>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Reward pool</p>
          <ul className="flex flex-wrap gap-2">
            {cfg.pool.map((r, i) => (
              <li key={`${r}-${i}`} className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-3 py-1 text-sm">
                {r}
                <button type="button" aria-label={`Remove ${r}`} onClick={() => setCfg({ ...cfg, pool: cfg.pool.filter((_, j) => j !== i) })} className="text-muted hover:text-danger">
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
            {cfg.pool.length === 0 && <li className="text-sm text-muted">No rewards in the pool.</li>}
          </ul>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (item.trim()) {
                setCfg({ ...cfg, pool: [...cfg.pool, item.trim()] })
                setItem('')
              }
            }}
          >
            <Input aria-label={`Add reward to ${program.name} pool`} placeholder="e.g. Free cookie" value={item} onChange={(e) => setItem(e.target.value)} />
            <Button type="submit" variant="secondary">
              <Plus className="size-4" aria-hidden /> Add
            </Button>
          </form>
        </div>
        {error && <p className="text-sm text-danger" role="alert">{error}</p>}
        <div>
          <GuardedButton permission="rewards.manage" onClick={save} loading={update.isPending}>
            Save
          </GuardedButton>
        </div>
      </CardBody>
    </Card>
  )
}
