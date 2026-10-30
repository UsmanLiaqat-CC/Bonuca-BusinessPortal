import { useState } from 'react'
import { Archive, Send } from 'lucide-react'
import type { LifecycleStatus } from '@/types/domain'
import type { LifecycleAction } from '@/lib/lifecycle'
import { useAccess } from '@/state/session'
import { Toggle } from '@/components/ui/Field'
import { ConfirmDialog } from '@/components/ui/Dialog'
import { GuardedButton } from '@/components/feedback/GuardedButton'
import { LifecycleBadge } from '@/components/data-display/StatusBadge'

/**
 * Spec §4.2: every program screen has an Enable/Disable toggle (Active ⇄ Paused) plus a separate
 * Archive action. Draft → Active happens on the first "Publish".
 */
export function LifecycleControls({ status, onAction, pending, noun = 'program' }: { status: LifecycleStatus; onAction: (a: LifecycleAction) => void; pending: boolean; noun?: string }) {
  const access = useAccess()
  const [confirm, setConfirm] = useState<'archive' | 'publish' | null>(null)
  const manage = access.evaluate('programs.manage')

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-sm text-muted">
        Status: <LifecycleBadge status={status} />
      </div>
      {status === 'draft' && (
        <GuardedButton permission="programs.manage" onClick={() => setConfirm('publish')} loading={pending}>
          <Send className="size-[15px]" aria-hidden /> Publish
        </GuardedButton>
      )}
      {(status === 'active' || status === 'paused') && (
        <div className="flex flex-col gap-2">
          <Toggle
            label={status === 'active' ? 'Enabled' : 'Disabled (paused)'}
            description={status === 'active' ? 'Turn off to pause temporarily. Customers keep their cards; scans show "temporarily unavailable".' : 'Turn on to resume enrolment and earning.'}
            checked={status === 'active'}
            disabled={!manage.allowed || pending}
            onChange={(on) => onAction(on ? 'enable' : 'disable')}
          />
          {!manage.allowed && <p className="lock-note inline-flex text-xs text-warning">{manage.message}</p>}
        </div>
      )}
      {status !== 'archived' && (
        <GuardedButton permission="programs.manage" variant="secondary" onClick={() => setConfirm('archive')}>
          <Archive className="size-[15px]" aria-hidden /> Archive
        </GuardedButton>
      )}
      {status === 'archived' && <p className="lock-overlay">This {noun} is permanently retired. Its data is kept.</p>}
      <ConfirmDialog
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm) onAction(confirm)
          setConfirm(null)
        }}
        title={confirm === 'archive' ? `Archive this ${noun}?` : `Publish this ${noun}?`}
        confirmLabel={confirm === 'archive' ? 'Archive' : 'Publish'}
        tone={confirm === 'archive' ? 'danger' : 'primary'}
        body={
          confirm === 'archive'
            ? `Archiving permanently retires the ${noun}. It cannot be re-enabled. No customer or transaction data is deleted.`
            : `Publishing makes the ${noun} live and generates its printable QR code.`
        }
      />
    </div>
  )
}
