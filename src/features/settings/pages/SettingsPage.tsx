import { useState } from 'react'
import { Link, NavLink, useParams } from 'react-router-dom'
import { BUSINESS_CATEGORIES, type Address, type OpeningHours } from '@/types/domain'
import { useT } from '@/i18n'
import { useAccess, useSession } from '@/state/session'
import { useBackend } from '@/state/services'
import { useToast } from '@/state/toast'
import { errorMessage } from '@/lib/errors'
import { defaultOpeningHours } from '@/lib/factories'
import { openingHoursSchema } from '@/schemas/auth'
import type { Permission } from '@/lib/access'
import { cn } from '@/lib/cn'
import { PageHeader } from '@/components/data-display/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Field, Input, Select, Toggle } from '@/components/ui/Field'
import { buttonClass } from '@/components/ui/Button'
import { OpeningHoursField } from '@/components/forms/OpeningHoursField'
import { GuardedButton } from '@/components/feedback/GuardedButton'
import { LanguageSelect, ThemeToggle } from '@/components/layout/Preferences'
import { BrandingForm } from '@/features/branding/components/BrandingForm'
import { useUpdateBusiness } from '@/features/branding/hooks'
import { WinBackSettings } from '@/features/notifications/components/WinBackSettings'
import { useUpdatePermissions } from '@/features/employees/hooks'

/** Spec §4.12 settings sections. Manager access is "limited" (OI-15). */
const SECTIONS: { id: string; label: string; permission: Permission }[] = [
  { id: 'business', label: 'Business information', permission: 'settings.view' },
  { id: 'address', label: 'Address', permission: 'settings.view' },
  { id: 'hours', label: 'Opening hours', permission: 'settings.view' },
  { id: 'logo', label: 'Logo', permission: 'settings.view' },
  { id: 'brand-colors', label: 'Brand colors', permission: 'settings.view' },
  { id: 'employees', label: 'Employees', permission: 'employees.view' },
  { id: 'notifications', label: 'Notifications', permission: 'notifications.view' },
  { id: 'billing', label: 'Billing', permission: 'settings.billing' },
  { id: 'wallet', label: 'Wallet customization', permission: 'wallet.view' },
  { id: 'language', label: 'Language', permission: 'settings.view' },
]

function BusinessInfo() {
  const { session } = useSession()
  const toast = useToast()
  const update = useUpdateBusiness()
  const t = useT()
  const [name, setName] = useState(session.business.name)
  const [category, setCategory] = useState(session.business.category)
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label={t('onb.businessName')} required error={name.trim() ? undefined : 'Business name is required.'}>
        {(p) => <Input {...p} value={name} onChange={(e) => setName(e.target.value)} />}
      </Field>
      <Field label={t('onb.category')} required>
        {(p) => (
          <Select {...p} value={category} onChange={(e) => setCategory(e.target.value as typeof category)}>
            {BUSINESS_CATEGORIES.map((c) => <option key={c} value={c}>{t(`cat.${c}`)}</option>)}
          </Select>
        )}
      </Field>
      <div>
        <GuardedButton permission="settings.edit" loading={update.isPending} onClick={() => name.trim() && update.mutate({ name, category }, { onSuccess: () => toast.success('Saved.'), onError: (e) => toast.error(errorMessage(e)) })}>Save</GuardedButton>
      </div>
    </div>
  )
}

function AddressSection() {
  const { session } = useSession()
  const toast = useToast()
  const update = useUpdateBusiness()
  const [a, setA] = useState<Address>(session.business.address)
  const field = (k: keyof Address, label: string) => (
    <Field label={label}>{(p) => <Input {...p} value={a[k]} onChange={(e) => setA({ ...a, [k]: e.target.value })} />}</Field>
  )
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {field('street', 'Street')}
      {field('postalCode', 'Postal code')}
      {field('city', 'City')}
      {field('country', 'Country / region')}
      <div>
        <GuardedButton permission="settings.edit" loading={update.isPending} onClick={() => update.mutate({ address: a }, { onSuccess: () => toast.success('Saved.'), onError: (e) => toast.error(errorMessage(e)) })}>Save</GuardedButton>
      </div>
    </div>
  )
}

function HoursSection() {
  const { session } = useSession()
  const toast = useToast()
  const update = useUpdateBusiness()
  const [hours, setHours] = useState<OpeningHours | null>(session.business.openingHours)
  const parsed = hours ? openingHoursSchema.safeParse(hours) : null
  const errors = parsed && !parsed.success ? Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])) : undefined
  if (!hours) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm text-muted">Opening hours are not set yet.</p>
        <GuardedButton permission="settings.edit" variant="secondary" onClick={() => setHours(defaultOpeningHours())}>Add opening hours</GuardedButton>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-4">
      <OpeningHoursField value={hours} onChange={setHours} errors={errors} />
      <div>
        <GuardedButton permission="settings.edit" loading={update.isPending} onClick={() => (errors ? toast.error('Fix the highlighted days.') : update.mutate({ openingHours: hours }, { onSuccess: () => toast.success('Saved.'), onError: (e) => toast.error(errorMessage(e)) }))}>Save</GuardedButton>
      </div>
    </div>
  )
}

function EmployeeSettings() {
  const { session } = useSession()
  const access = useAccess()
  const toast = useToast()
  const perms = useUpdatePermissions()
  const p = session.business.permissions
  const set = (patch: Partial<typeof p>) => perms.mutate(patch, { onSuccess: () => toast.success('Saved.'), onError: (e) => toast.error(errorMessage(e)) })
  return (
    <div className="flex flex-col gap-4">
      <Toggle label="Managers may manage employees" description="Owner-only." checked={p.managersCanManageEmployees} disabled={!access.can('employees.permissions')} onChange={(v) => set({ managersCanManageEmployees: v })} />
      <Toggle label="Show leaderboard to employees" checked={p.showLeaderboardToEmployees} disabled={!access.can('leaderboard.visibility')} onChange={(v) => set({ showLeaderboardToEmployees: v })} />
      <Link to="/app/employees" className="text-sm text-accent hover:underline">Manage team and invitations →</Link>
    </div>
  )
}

export default function SettingsPage() {
  const t = useT()
  const { section = 'business' } = useParams()
  const access = useAccess()
  const backend = useBackend()
  const visible = SECTIONS.filter((s) => access.can(s.permission))
  const current = visible.find((s) => s.id === section) ?? visible[0]!

  return (
    <>
      <PageHeader title={t('nav.settings')} />
      <div className="grid gap-6 md:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label="Settings sections" className="flex gap-1 overflow-x-auto md:flex-col">
          {visible.map((s) => (
            <NavLink key={s.id} to={`/app/settings/${s.id}`} className={() => cn('rounded-lg px-3 py-2 text-sm whitespace-nowrap', s.id === current.id ? 'bg-accent-soft font-medium text-accent' : 'text-muted hover:bg-surface-2 hover:text-fg')}>
              {s.label}
            </NavLink>
          ))}
        </nav>
        <Card>
          <CardHeader title={current.label} />
          <CardBody>
            {current.id === 'business' && <BusinessInfo />}
            {current.id === 'address' && <AddressSection />}
            {current.id === 'hours' && <HoursSection />}
            {current.id === 'logo' && <BrandingForm sections={['logo']} />}
            {current.id === 'brand-colors' && <BrandingForm sections={['colors', 'font']} />}
            {current.id === 'employees' && <EmployeeSettings />}
            {current.id === 'notifications' && <WinBackSettings />}
            {current.id === 'billing' && (
              <div className="flex flex-col items-start gap-2 text-sm">
                <p className="text-muted">Plans, invoices, payment history and billing information.</p>
                <Link to="/app/subscription" className={buttonClass('secondary')}>Open Subscription & Billing</Link>
              </div>
            )}
            {current.id === 'wallet' && (
              <div className="flex flex-col items-start gap-2 text-sm">
                <p className="text-muted">Choose base templates or custom designs and preview each program's pass.</p>
                <Link to="/app/wallet-cards" className={buttonClass('secondary')}>Open Wallet Cards</Link>
              </div>
            )}
            {current.id === 'language' && (
              <div className="flex flex-col gap-4">
                <p className="text-sm text-muted">Interface language for the dashboard. Supported at launch: English, German, Turkish, French, Italian. Customer-facing content language handling is pending confirmation.</p>
                <LanguageSelect onChange={(l) => void backend.setLanguage(l)} />
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted">{t('theme.label')}</span>
                  <ThemeToggle />
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  )
}
