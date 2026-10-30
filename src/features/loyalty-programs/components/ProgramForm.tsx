import { useMemo, useState } from 'react'
import { Controller, get, useForm, useWatch, type FieldPath } from 'react-hook-form'
import { ArrowLeft, ArrowRight, Check, MapPin } from 'lucide-react'
import type { LifecycleStatus, Program, SignupPageFieldMode } from '@/types/domain'
import type { ProgramDraft } from '@/services/backend'
import { programSchema } from '@/schemas/program'
import { zodResolver } from '@/lib/forms'
import { errorMessage } from '@/lib/errors'
import { buildPassContent } from '@/lib/walletContent'
import { visualsFromBranding } from '@/lib/factories'
import { cn } from '@/lib/cn'
import { useT } from '@/i18n'
import { useAccess, useSession } from '@/state/session'
import { useToast } from '@/state/toast'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Field, Input, Select, Toggle } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/Dialog'
import { ColorField } from '@/components/forms/ColorField'
import { ImageUpload } from '@/components/forms/ImageUpload'
import { PlaceSearch } from '@/components/forms/PlaceSearch'
import { GuardedButton } from '@/components/feedback/GuardedButton'
import { IntegrationNotice } from '@/components/feedback/Banners'
import { WalletPassPreview } from '@/features/wallet-cards/components/WalletPassPreview'
import { JoinPreview } from '@/features/join/components/JoinScreens'
import { useProgramLifecycle, usePrograms, useSaveProgram } from '../hooks'
import { changedMasterFields } from '../masterFields'
import { VisualFields } from './VisualFields'
import { MembershipFields, PointsFields, StampFields, TermsField, TierFields } from './TypeFields'

/** Program creation sequence (BONUCA CHANGES doc): Basics → Rules → Wallet Design → Valid Location → Sign-Up Page. */
const STEPS: { title: string; fields: FieldPath<ProgramDraft>[] }[] = [
  { title: 'Basics', fields: ['name'] },
  { title: 'Program rules', fields: ['config', 'termsAndConditions', 'expiresOn'] },
  { title: 'Wallet design', fields: ['visuals'] },
  { title: 'Valid location', fields: ['location'] },
  { title: 'Sign-up page', fields: ['signupPage'] },
]

const FIELD_MODES: { value: SignupPageFieldMode; label: string }[] = [
  { value: 'optional', label: 'Optional' },
  { value: 'required', label: 'Required' },
  { value: 'off', label: 'Not asked' },
]

/**
 * Program setup (spec §4.2) as a step-by-step flow with the live wallet card and sign-up page preview.
 * Draft saves need only a name; Publish and edits of live programs require every required field.
 */
export function ProgramForm({ initial, programId, status, onDone }: { initial: ProgramDraft; programId: string | null; status: LifecycleStatus | null; onDone: (p: Program, published: boolean) => void }) {
  const t = useT()
  const toast = useToast()
  const access = useAccess()
  const { session } = useSession()
  const programs = usePrograms()
  const save = useSaveProgram()
  const lifecycle = useProgramLifecycle()
  const form = useForm<ProgramDraft>({ resolver: zodResolver<ProgramDraft>(programSchema), defaultValues: initial, mode: 'onSubmit' })
  const values = useWatch({ control: form.control }) as ProgramDraft
  const [step, setStep] = useState(0)
  // Holds the id after a first successful save so a failed publish retry does not create a duplicate.
  const [savedId, setSavedId] = useState<string | null>(programId)
  const [pendingMaster, setPendingMaster] = useState<{ draft: ProgramDraft; fields: string[] } | null>(null)
  const isDraft = status === null || status === 'draft'
  const type = initial.type
  const businessName = session.business.name
  const branding = session.business.branding
  const err = (path: string) => (get(form.formState.errors, path) as { message?: string } | undefined)?.message

  const previewProgram = useMemo(
    () => ({ ...values, id: 'preview', businessId: '', status: 'draft', joinQrToken: null, createdAt: '', publishedAt: null, updatedAt: '' }) as Program,
    [values],
  )
  const preview = useMemo(() => buildPassContent(previewProgram, null, businessName), [previewProgram, businessName])

  const activeCount = (programs.data ?? []).filter((p) => p.status !== 'archived').length
  const limit = programId ? undefined : access.limit('programs', activeCount)
  const last = step === STEPS.length - 1

  const persist = async (draft: ProgramDraft, publish: boolean) => {
    try {
      let program = await save.mutateAsync({ id: savedId, draft })
      setSavedId(program.id)
      if (publish) program = await lifecycle.mutateAsync({ id: program.id, action: 'publish' })
      toast.success(publish ? 'Program published. The join QR code is ready.' : isDraft ? 'Draft saved.' : 'Changes saved.')
      onDone(program, publish)
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  // Jump to the first step that still has an error.
  const showFirstError = (errors: object) => {
    const index = STEPS.findIndex((s) => s.fields.some((f) => get(errors, f)))
    if (index >= 0) setStep(index)
  }
  const next = async () => {
    if (await form.trigger(STEPS[step]!.fields)) setStep((s) => Math.min(STEPS.length - 1, s + 1))
  }
  const saveDraft = async () => {
    if (await form.trigger('name')) await persist(form.getValues(), false)
    else setStep(0)
  }
  const publish = form.handleSubmit((draft) => persist(draft, true), showFirstError)
  const saveLive = form.handleSubmit((draft) => {
    const fields = changedMasterFields(initial, draft)
    if (fields.length) setPendingMaster({ draft, fields })
    else void persist(draft, false)
  }, showFirstError)

  const location = values.location
  const address = session.business.address

  return (
    <div className="layout-preview">
      <form className="flex min-w-0 flex-col gap-[18px]" noValidate onSubmit={(e) => e.preventDefault()}>
        <ol className="card reveal-up flex flex-wrap gap-1.5 p-2" aria-label="Program setup steps">
          {STEPS.map((s, i) => {
            const hasError = s.fields.some((f) => get(form.formState.errors, f))
            return (
              <li key={s.title} className="flex-1">
                <button
                  type="button"
                  onClick={() => (i <= step || !isDraft ? setStep(i) : void next())}
                  aria-current={i === step ? 'step' : undefined}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] font-semibold whitespace-nowrap transition-colors',
                    i === step ? 'bg-accent-soft text-accent' : 'text-muted hover:bg-canvas',
                    hasError && 'text-danger',
                  )}
                >
                  <span className={cn('grid size-6 shrink-0 place-items-center rounded-full border text-[11px]', i < step ? 'border-accent bg-accent text-white' : i === step ? 'border-accent' : 'border-line')}>
                    {i < step ? <Check className="size-3.5" aria-hidden /> : i + 1}
                  </span>
                  {s.title}
                </button>
              </li>
            )
          })}
        </ol>

        {step === 0 && (
          <Card>
            <CardHeader step={1} title="Basics" description={`${t(`type.${type}`)} · program type cannot be changed after creation`} />
            <CardBody>
              <Field label="Program Name" required error={err('name')} hint="Internal name and the header text on the wallet card.">
                {(p) => <Input {...p} {...form.register('name')} />}
              </Field>
            </CardBody>
          </Card>
        )}

        {step === 1 && (
          <Card>
            <CardHeader step={2} title="Program rules" description="How customers earn and what they get. Add an expiry date if the program runs for a limited time." />
            <CardBody className="flex flex-col gap-6">
              {type === 'stamp' && <StampFields form={form} />}
              {type === 'membership' && <MembershipFields form={form} />}
              {type === 'tier' && <TierFields form={form} />}
              {type === 'points' && <PointsFields form={form} />}
              <Field label="Program expiry date" optional error={err('expiresOn')} hint="After this date the program stops awarding. Leave empty for no end date.">
                {(p) => <Input {...p} type="date" {...form.register('expiresOn', { setValueAs: (v: string | null) => (v ? v : null) })} />}
              </Field>
              <TermsField form={form} />
            </CardBody>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader
              step={3}
              title="Wallet design"
              description="Your Branding logo and colours are the defaults. Changes here apply to this program’s wallet card only."
              actions={
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    const b = visualsFromBranding(branding)
                    form.setValue('visuals.logo', b.logo, { shouldDirty: true })
                    form.setValue('visuals.background', b.background, { shouldDirty: true })
                    form.setValue('visuals.accentColor', b.accentColor, { shouldDirty: true })
                  }}
                >
                  Use Branding defaults
                </Button>
              }
            />
            <CardBody className="flex flex-col gap-5">
              <VisualFields form={form} show={{ background: type !== 'tier', textColor: type !== 'tier' }} logoRequired={initial.designMode === 'template'} />
              <Controller
                control={form.control}
                name="visuals.accentColor"
                render={({ field }) => <ColorField label="Highlight colour" value={field.value ?? '#7FB77E'} onChange={field.onChange} hint="Labels, stamp rings and the reward icon on the card." />}
              />
            </CardBody>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader step={4} title="Valid location" description="Optional. This location will be used to send nearby notifications to customers." icon={<MapPin className="size-4" />} />
            <CardBody className="flex flex-col gap-4">
              <Toggle
                label="Set a valid location"
                checked={!!location}
                onChange={(on) => form.setValue('location', on ? { address: [address.street, address.postalCode, address.city].filter(Boolean).join(', '), radiusMeters: 200 } : null, { shouldDirty: true })}
              />
              {location && (
                <div className="form-grid">
                  <Field label="Search a place" required error={err('location.address')} hint="Type to search; pick a result so the exact spot is saved.">
                    {(p) => (
                      <PlaceSearch
                        id={p.id}
                        value={location.address}
                        onPick={(pl) => {
                          form.setValue('location.address', pl.address, { shouldDirty: true })
                          form.setValue('location.lat', pl.lat, { shouldDirty: true })
                          form.setValue('location.lng', pl.lng, { shouldDirty: true })
                        }}
                      />
                    )}
                  </Field>
                  <Field label="Notification radius (metres)" required error={err('location.radiusMeters')}>
                    {(p) => <Input {...p} type="number" min={50} max={5000} step={50} {...form.register('location.radiusMeters', { valueAsNumber: true })} />}
                  </Field>
                </div>
              )}
              <IntegrationNotice title="Nearby notifications not connected">Location-based wallet notifications are sent by the Apple/Google Wallet backend, which is not available in this environment. The location is saved with the program.</IntegrationNotice>
            </CardBody>
          </Card>
        )}

        {step === 4 && (
          <Card>
            <CardHeader step={5} title="Sign-up page details" description="The page customers see after scanning the join QR for the first time." />
            <CardBody className="flex flex-col gap-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Page title" optional error={err('signupPage.headline')} hint="Big title on the page. Empty = your business name (set in Settings → Business information).">
                  {(p) => <Input {...p} placeholder={businessName} {...form.register('signupPage.headline')} />}
                </Field>
                <Field label="Subtitle" optional error={err('signupPage.tagline')} hint="Small line under the title. Empty = the program name.">
                  {(p) => <Input {...p} placeholder="e.g. Rewards membership" {...form.register('signupPage.tagline')} />}
                </Field>
                <Controller control={form.control} name="signupPage.backgroundColor" render={({ field }) => <ColorField label="Background colour" required value={field.value} onChange={field.onChange} error={err('signupPage.backgroundColor')} />} />
                <Controller control={form.control} name="signupPage.fontColor" render={({ field }) => <ColorField label="Font colour" required value={field.value} onChange={field.onChange} error={err('signupPage.fontColor')} />} />
                <Controller control={form.control} name="signupPage.heroImage" render={({ field }) => <ImageUpload label="Hero image" shape="wide" value={field.value} onChange={field.onChange} hint="Large image at the top of the page." />} />
                <Controller control={form.control} name="signupPage.logo" render={({ field }) => <ImageUpload label="Logo" value={field.value} onChange={field.onChange} hint="Defaults to your Branding logo." />} />
              </div>
              <fieldset className="flex flex-col gap-2">
                <legend className="label mb-2">Sign-up fields</legend>
                <div className="option-row">
                  <span className="text-sm font-semibold">Name</span>
                  <span className="badge">Always required</span>
                </div>
                {(['email', 'birthday'] as const).map((key) => (
                  <div key={key} className="option-row">
                    <label htmlFor={`signup-${key}`} className="text-sm font-semibold">{key === 'email' ? 'Email' : 'Birthday'}</label>
                    <Select id={`signup-${key}`} className="w-40" {...form.register(`signupPage.fields.${key}`)}>
                      {FIELD_MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </Select>
                  </div>
                ))}
              </fieldset>
            </CardBody>
          </Card>
        )}

        <div className="card reveal-up flex flex-wrap items-center gap-2.5 p-4">
          {step > 0 && (
            <Button variant="secondary" onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft className="size-[15px]" aria-hidden /> Back
            </Button>
          )}
          {!last && (
            <Button onClick={() => void next()}>
              Next: {STEPS[step + 1]!.title} <ArrowRight className="size-[15px]" aria-hidden />
            </Button>
          )}
          {isDraft ? (
            <>
              {last && (
                <GuardedButton permission="programs.manage" extra={limit} onClick={publish} loading={lifecycle.isPending}>
                  Publish
                </GuardedButton>
              )}
              <GuardedButton permission="programs.manage" extra={limit} variant="secondary" onClick={saveDraft} loading={save.isPending && !lifecycle.isPending}>
                Save as draft
              </GuardedButton>
            </>
          ) : (
            <GuardedButton permission="programs.manage" variant={last ? 'primary' : 'secondary'} onClick={saveLive} loading={save.isPending}>
              {t('common.save')}
            </GuardedButton>
          )}
          {Object.keys(form.formState.errors).length > 0 && <p className="error-msg ml-auto" role="alert">Some fields need attention.</p>}
        </div>
      </form>
      <aside className="xl:sticky xl:top-24 xl:self-start">
        <WalletPassPreview key={step === 4 ? 'signup' : 'card'} initialView={step === 4 ? 'signup' : 'ios'} content={preview} signup={<JoinPreview program={previewProgram} businessName={businessName} />} />
      </aside>
      <ConfirmDialog
        open={!!pendingMaster}
        onClose={() => setPendingMaster(null)}
        onConfirm={() => {
          const p = pendingMaster
          setPendingMaster(null)
          if (p) void persist(p.draft, false)
        }}
        title="Update every issued wallet card?"
        confirmLabel="Save (applies to all issued cards)"
        body={
          <div className="flex flex-col gap-3">
            <p>
              You changed <strong className="text-fg">{pendingMaster?.fields.join(', ')}</strong>. This program is live, so the change applies retroactively to every wallet card already issued.
            </p>
            <IntegrationNotice title="Wallet integration not connected">Card updates are pushed by the Apple/Google Wallet backend integration, which is not available in this environment.</IntegrationNotice>
          </div>
        }
      />
    </div>
  )
}
