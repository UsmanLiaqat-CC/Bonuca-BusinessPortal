import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Wrench } from 'lucide-react'
import type { OverrideKind } from '@/types/domain'
import { useBackend } from '@/state/services'
import { useSession } from '@/state/session'
import { useToast } from '@/state/toast'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select } from '@/components/ui/Field'
import { errorMessage } from '@/lib/errors'

/**
 * DEVELOPMENT ONLY — not a product feature. Simulates actions that belong to the separate Bonuca
 * Super Admin portal (override, trial expiry) so plan states can be exercised locally.
 * Hidden unless VITE_ENABLE_DEV_TOOLS is enabled.
 */
export function DevToolsPanel() {
  const backend = useBackend()
  const qc = useQueryClient()
  const toast = useToast()
  const { session } = useSession()
  const [open, setOpen] = useState(false)
  const [kind, setKind] = useState<OverrideKind>('free_access')
  const [endsAt, setEndsAt] = useState('')
  const dev = backend.dev
  if (!dev) return null

  const run = async (fn: () => Promise<void>, done: string) => {
    try {
      await fn()
      await qc.invalidateQueries()
      toast.info(done)
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="no-print btn btn-ghost btn-sm fixed bottom-4 left-4 z-40 rounded-full text-xs shadow-[var(--shadow-card)] min-[901px]:left-[290px]"
      >
        <Wrench className="size-3.5" aria-hidden /> Dev tools
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Developer tools (development only)" description="Simulates Super Admin portal actions locally. Not part of the business portal product.">
        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold">Simulate Super Admin override</h3>
            <Field label="Override type">
              {(p) => (
                <Select {...p} value={kind} onChange={(e) => setKind(e.target.value as OverrideKind)}>
                  <option value="free_access">Free access granted</option>
                  <option value="billing_paused">Billing paused</option>
                  <option value="custom_duration">Custom duration</option>
                  <option value="unlimited">Unlimited access</option>
                </Select>
              )}
            </Field>
            <Field label="End date" optional>
              {(p) => <Input {...p} type="date" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />}
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => run(() => dev.setOverride({ kind, planId: 'pro', endsAt: endsAt ? new Date(`${endsAt}T23:59:59`).toISOString() : null }), 'Override applied (simulated).')}>
                Apply override
              </Button>
              <Button size="sm" variant="secondary" onClick={() => run(() => dev.setOverride(null), 'Override removed (simulated).')}>
                Remove override
              </Button>
            </div>
          </section>
          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">Trial</h3>
            <p className="text-xs text-muted">Current selection: {session.subscription.selection}</p>
            <Button size="sm" variant="secondary" onClick={() => run(() => dev.expireTrial(), 'Trial expired (simulated).')}>
              Expire free trial now
            </Button>
          </section>
          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">Local data</h3>
            <Button size="sm" variant="danger" onClick={() => run(async () => { await dev.resetAll(); window.location.assign('/login') }, 'Development data reset.')}>
              Reset all development data
            </Button>
          </section>
        </div>
      </Dialog>
    </>
  )
}
