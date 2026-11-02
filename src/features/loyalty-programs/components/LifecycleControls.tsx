import { useState } from 'react'
import { Archive, Send, Trash2 } from 'lucide-react'
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
export function LifecycleControls({ status, onAction, onDelete, pending, noun = 'program' }: { status: LifecycleStatus; onAction: (a: LifecycleAction) => void; /** Shown for Draft only: permanently deletes the draft. */ onDelete?: () => void; pending: boolean; noun?: string }) {
  const access = useAccess()
  const [confirm, setConfirm] = useState<'archive' | 'publish' | 'delete' | null>(null)
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
      {status === 'draft' && onDelete && (
        <GuardedButton permission="programs.manage" variant="danger" onClick={() => setConfirm('delete')}>
          <Trash2 className="size-[15px]" aria-hidden /> Delete draft
        </GuardedButton>
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
          if (confirm === 'delete') onDelete?.()
          else if (confirm) onAction(confirm)
          setConfirm(null)
        }}
        title={confirm === 'archive' ? `Archive this ${noun}?` : confirm === 'delete' ? `Delete this draft ${noun}?` : `Publish this ${noun}?`}
        confirmLabel={confirm === 'archive' ? 'Archive' : confirm === 'delete' ? 'Delete draft' : 'Publish'}
        tone={confirm === 'archive' || confirm === 'delete' ? 'danger' : 'primary'}
        body={
          confirm === 'delete'
            ? `This permanently deletes the draft ${noun}. It was never published, so no customers are affected. This cannot be undone.`
            : confirm === 'archive'
            ? `Archiving permanently retires the ${noun}. It cannot be re-enabled. No customer or transaction data is deleted.`
            : `Publishing makes the ${noun} live and generates its printable QR code.`
        }
      />
    </div>
  )
}
