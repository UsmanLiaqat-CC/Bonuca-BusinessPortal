import { useState } from 'react'
import { NavLink, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Clock, History, Image as ImageIcon, Languages, MapPin, Palette, Settings as SettingsIcon, Store, type LucideIcon } from 'lucide-react'
import { BUSINESS_CATEGORIES, type Address, type AuditEntry, type OpeningHours } from '@/types/domain'
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
import { Field, Input, Select } from '@/components/ui/Field'
import { OpeningHoursField } from '@/components/forms/OpeningHoursField'
import { GuardedButton } from '@/components/feedback/GuardedButton'
import { EmptyState, QueryState } from '@/components/feedback/QueryState'
import { LanguageSelect, ThemeToggle } from '@/components/layout/Preferences'
import { BrandingForm } from '@/features/branding/components/BrandingForm'
import { useUpdateBusiness } from '@/features/branding/hooks'
import { formatDateTime } from '@/lib/dates'

/**
 * Spec §4.12 settings sections. Manager access is "limited" (OI-15). Employees, Notifications, Billing
 * and Wallet customization were removed from Settings (client change); each has its own menu item.
 */
const SECTIONS: { id: string; label: string; permission: Permission; icon: LucideIcon }[] = [
  { id: 'business', label: 'Business information', permission: 'settings.view', icon: Store },
  { id: 'address', label: 'Address', permission: 'settings.view', icon: MapPin },
  { id: 'hours', label: 'Opening hours', permission: 'settings.view', icon: Clock },
  { id: 'logo', label: 'Logo', permission: 'settings.view', icon: ImageIcon },
  { id: 'brand-colors', label: 'Brand colors', permission: 'settings.view', icon: Palette },
  { id: 'language', label: 'Language', permission: 'settings.view', icon: Languages },
  { id: 'audit', label: 'Audit', permission: 'audit.view', icon: History },
]

const MODULES: AuditEntry['module'][] = ['Programs', 'Campaigns', 'Award actions', 'Customers', 'Gifts', 'Employees', 'Notifications', 'Settings']

/** Audit tab: who (Manager/Employee) did what, where (module) and when — with filters. */
function AuditLog() {
  const backend = useBackend()
  const audit = useQuery({ queryKey: ['audit'], queryFn: () => backend.listAudit() })
  const [f, setF] = useState({ user: '', role: '', module: '', action: '', from: '', to: '' })
  return (
    <QueryState query={audit}>
      {(rows) => {
        const users = [...new Map(rows.map((r) => [r.userId, r.userName])).entries()]
        const actions = [...new Set(rows.map((r) => r.action.replace(/[:(].*$/, '').replace(/\s+\d.*$/, '').trim()))].sort()
        const shown = rows.filter(
          (r) =>
            (!f.user || r.userId === f.user) &&
            (!f.role || r.role === f.role) &&
            (!f.module || r.module === f.module) &&
            (!f.action || r.action.startsWith(f.action)) &&
            (!f.from || r.createdAt.slice(0, 10) >= f.from) &&
            (!f.to || r.createdAt.slice(0, 10) <= f.to),
        )
        const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })
        return (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted">Activities performed by Managers and Employees throughout the system.</p>
            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6" role="group" aria-label="Audit filters">
              <Select aria-label="User" value={f.user} onChange={set('user')}>
                <option value="">All users</option>
                {users.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
              </Select>
              <Select aria-label="Role" value={f.role} onChange={set('role')}>
                <option value="">All roles</option>
                <option value="manager">Manager</option>
                <option value="employee">Employee</option>
              </Select>
              <Select aria-label="Module" value={f.module} onChange={set('module')}>
                <option value="">All modules</option>
                {MODULES.map((m) => <option key={m} value={m}>{m}</option>)}
              </Select>
              <Select aria-label="Action" value={f.action} onChange={set('action')}>
                <option value="">All actions</option>
                {actions.map((a) => <option key={a} value={a}>{a}</option>)}
              </Select>
              <Input type="date" aria-label="From date" value={f.from} onChange={set('from')} />
              <Input type="date" aria-label="To date" value={f.to} onChange={set('to')} />
            </div>
            {shown.length === 0 ? (
              <EmptyState icon={<History className="size-6" />} title={rows.length ? 'No activity matches these filters' : 'No Manager or Employee activity yet'} />
            ) : (
              <div className="table-wrap -mx-5">
                <table className="t" aria-label="Audit log">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Role</th>
                      <th>Action performed</th>
                      <th>Module</th>
                      <th>Date & time</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.slice(0, 200).map((r) => (
                      <tr key={r.id}>
                        <td className="font-semibold whitespace-nowrap">{r.userName}</td>
                        <td className="capitalize">{r.role}</td>
                        <td>{r.action}</td>
                        <td className="whitespace-nowrap">{r.module}</td>
                        <td className="whitespace-nowrap text-muted">{formatDateTime(r.createdAt)}</td>
                        <td className="text-muted">{r.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {shown.length > 200 && <p className="hint">Showing the latest 200 of {shown.length} entries. Narrow the filters to see older activity.</p>}
          </div>
        )
      }}
    </QueryState>
  )
}

function BusinessInfo() {
  const { session } = useSession()
  const toast = useToast()
  const update = useUpdateBusiness()
  const t = useT()
  const [name, setName] = useState(session.business.name)
  const [category, setCategory] = useState(session.business.category)
  return (
    <div className="form-grid">
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
    <div className="form-grid">
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
        <p className="lock-overlay">Opening hours are not set yet.</p>
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

export default function SettingsPage() {
  const t = useT()
  const { section = 'business' } = useParams()
  const access = useAccess()
  const backend = useBackend()
  const visible = SECTIONS.filter((s) => access.can(s.permission))
  const current = visible.find((s) => s.id === section) ?? visible[0]!

  return (
    <>
      <PageHeader
        title={t('nav.settings')}
        breadcrumb={
          <>
            <SettingsIcon className="size-[13px]" aria-hidden /> {t('nav.group.business')}
          </>
        }
      />
      <div className="grid items-start gap-[18px] md:grid-cols-[240px_minmax(0,1fr)]">
        <div className="card reveal-up p-2 md:sticky md:top-24">
          <nav aria-label="Settings sections" className="nav mt-0 flex-row overflow-x-auto md:flex-col">
            {visible.map((s) => {
              const Icon = s.icon
              return (
                <NavLink key={s.id} to={`/app/settings/${s.id}`} className={() => cn('whitespace-nowrap', s.id === current.id && 'active')}>
                  <Icon className="size-[17px] shrink-0" aria-hidden />
                  {s.label}
                </NavLink>
              )
            })}
          </nav>
        </div>
        <Card className="reveal-up">
          <CardHeader title={current.label} icon={<current.icon className="size-4" />} />
          <CardBody>
            {current.id === 'business' && <BusinessInfo />}
            {current.id === 'address' && <AddressSection />}
            {current.id === 'hours' && <HoursSection />}
            {current.id === 'logo' && <BrandingForm sections={['logo']} />}
            {current.id === 'brand-colors' && <BrandingForm sections={['colors', 'font']} />}
            {current.id === 'audit' && <AuditLog />}
            {current.id === 'language' && (
              <div className="flex flex-col gap-4">
                <p className="callout">Interface language for the dashboard. Supported at launch: English, German, Turkish, French, Italian. Customer-facing content language handling is pending confirmation.</p>
                <LanguageSelect onChange={(l) => void backend.setLanguage(l)} />
                <div className="flex items-center gap-3 text-sm">
                  <span className="label">{t('theme.label')}</span>
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
