import { useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import type { LifecycleStatus, Program } from '@/types/domain'
import type { ProgramDraft } from '@/services/backend'
import { programSchema } from '@/schemas/program'
import { zodResolver } from '@/lib/forms'
import { errorMessage } from '@/lib/errors'
import { buildPassContent } from '@/lib/walletContent'
import { useT } from '@/i18n'
import { useAccess } from '@/state/session'
import { useToast } from '@/state/toast'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Field, Input } from '@/components/ui/Field'
import { ConfirmDialog } from '@/components/ui/Dialog'
import { GuardedButton } from '@/components/feedback/GuardedButton'
import { IntegrationNotice } from '@/components/feedback/Banners'
import { WalletPassPreview } from '@/features/wallet-cards/components/WalletPassPreview'
import { useProgramLifecycle, usePrograms, useSaveProgram } from '../hooks'
import { changedMasterFields } from '../masterFields'
import { VisualFields } from './VisualFields'
import { MembershipFields, PointsFields, StampFields, TermsField, TierFields } from './TypeFields'

/**
 * Program setup screen (spec §4.2) with Live Wallet Preview (§4.3).
 * Draft saves need only a name; Publish and edits of live programs require every required field.
 */
export function ProgramForm({ initial, programId, status, onDone }: { initial: ProgramDraft; programId: string | null; status: LifecycleStatus | null; onDone: (p: Program) => void }) {
  const t = useT()
  const toast = useToast()
  const access = useAccess()
  const programs = usePrograms()
  const save = useSaveProgram()
  const lifecycle = useProgramLifecycle()
  const form = useForm<ProgramDraft>({ resolver: zodResolver<ProgramDraft>(programSchema), defaultValues: initial, mode: 'onSubmit' })
  const values = useWatch({ control: form.control }) as ProgramDraft
  // Holds the id after a first successful save so a failed publish retry does not create a duplicate.
  const [savedId, setSavedId] = useState<string | null>(programId)
  const [pendingMaster, setPendingMaster] = useState<{ draft: ProgramDraft; fields: string[] } | null>(null)
  const isDraft = status === null || status === 'draft'
  const type = initial.type

  const preview = useMemo(
    () => buildPassContent({ ...values, id: 'preview', businessId: '', status: 'draft', joinQrToken: null, createdAt: '', publishedAt: null, updatedAt: '' } as Program),
    [values],
  )

  const activeCount = (programs.data ?? []).filter((p) => p.status !== 'archived').length
  const limit = programId ? undefined : access.limit('programs', activeCount)

  const persist = async (draft: ProgramDraft, publish: boolean) => {
    try {
      let program = await save.mutateAsync({ id: savedId, draft })
      setSavedId(program.id)
      if (publish) program = await lifecycle.mutateAsync({ id: program.id, action: 'publish' })
      toast.success(publish ? 'Program published. The join QR code is ready.' : isDraft ? 'Draft saved.' : 'Changes saved.')
      onDone(program)
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  const saveDraft = async () => {
    if (await form.trigger('name')) await persist(form.getValues(), false)
  }
  const publish = form.handleSubmit((draft) => persist(draft, true))
  const saveLive = form.handleSubmit((draft) => {
    const fields = changedMasterFields(initial, draft)
    if (fields.length) setPendingMaster({ draft, fields })
    else void persist(draft, false)
  })

  const showBackground = type !== 'tier'
  return (
    <div className="layout-preview">
      <form className="flex min-w-0 flex-col gap-[18px]" noValidate onSubmit={(e) => e.preventDefault()}>
        <Card>
          <CardHeader step={1} title="Basics" description={`${t(`type.${type}`)} · program type cannot be changed after creation`} />
          <CardBody>
            <Field label="Program Name" required error={form.formState.errors.name?.message} hint="Internal name and the header text on the wallet pass.">
              {(p) => <Input {...p} {...form.register('name')} />}
            </Field>
          </CardBody>
        </Card>
        <Card>
          <CardHeader step={2} title="Wallet design" description={type === 'tier' ? 'Shared across every tier’s pass. The background switches to each tier’s wallet colour.' : 'These master fields render on the wallet pass.'} />
          <CardBody>
            <VisualFields form={form} show={{ background: showBackground, textColor: type !== 'tier' }} logoRequired={initial.designMode === 'template'} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader step={3} title="Program rules" />
          <CardBody>
            {type === 'stamp' && <StampFields form={form} />}
            {type === 'membership' && <MembershipFields form={form} />}
            {type === 'tier' && <TierFields form={form} />}
            {type === 'points' && <PointsFields form={form} />}
          </CardBody>
        </Card>
        <Card>
          <CardHeader step={4} title="Terms" />
          <CardBody>
            <TermsField form={form} />
          </CardBody>
        </Card>
        <div className="card reveal-up flex flex-wrap items-center gap-2.5 p-4">
          {isDraft ? (
            <>
              <GuardedButton permission="programs.manage" extra={limit} onClick={publish} loading={lifecycle.isPending}>
                Publish
              </GuardedButton>
              <GuardedButton permission="programs.manage" extra={limit} variant="secondary" onClick={saveDraft} loading={save.isPending && !lifecycle.isPending}>
                Save as draft
              </GuardedButton>
            </>
          ) : (
            <GuardedButton permission="programs.manage" onClick={saveLive} loading={save.isPending}>
              {t('common.save')}
            </GuardedButton>
          )}
          {Object.keys(form.formState.errors).length > 0 && <p className="error-msg ml-auto" role="alert">Some fields need attention.</p>}
        </div>
      </form>
      <aside className="xl:sticky xl:top-24 xl:self-start">
        <WalletPassPreview content={preview} />
      </aside>
      <ConfirmDialog
        open={!!pendingMaster}
        onClose={() => setPendingMaster(null)}
        onConfirm={() => {
          const p = pendingMaster
          setPendingMaster(null)
          if (p) void persist(p.draft, false)
        }}
        title="Update every issued wallet pass?"
        confirmLabel="Save (applies to all issued passes)"
        body={
          <div className="flex flex-col gap-3">
            <p>
              You changed <strong className="text-fg">{pendingMaster?.fields.join(', ')}</strong>. This program is live, so the change applies retroactively to every wallet pass already issued.
            </p>
            <IntegrationNotice title="Wallet integration not connected">Pass updates are pushed by the Apple/Google Wallet backend integration, which is not available in this environment.</IntegrationNotice>
          </div>
        }
      />
    </div>
  )
}
