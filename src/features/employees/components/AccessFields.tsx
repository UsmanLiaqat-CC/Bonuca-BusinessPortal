import { presetFor, TEAM_PERMISSIONS, USER_TYPE_LABEL, type TeamPermission, type UserType } from '@/lib/teamPermissions'
import { Select } from '@/components/ui/Field'

const TABS = [...new Set(TEAM_PERMISSIONS.map((p) => p.tab))]

/**
 * User Type (Staff / Manager / Admin) and its permission checkboxes, grouped per tab with read-only or
 * edit marks. Picking a type re-applies its preset; the ticks can then be changed one by one.
 */
export function AccessFields({
  type,
  permissions,
  onChange,
  types,
  idPrefix = 'access',
}: {
  type: UserType
  permissions: TeamPermission[]
  onChange: (type: UserType, permissions: TeamPermission[]) => void
  types: UserType[]
  idPrefix?: string
}) {
  const toggle = (key: TeamPermission, on: boolean) => onChange(type, on ? [...permissions, key] : permissions.filter((p) => p !== key))
  return (
    <div className="flex flex-col gap-4">
      <div className="field">
        <label htmlFor={`${idPrefix}-type`} className="label">User Type</label>
        <Select id={`${idPrefix}-type`} value={type} onChange={(e) => onChange(e.target.value as UserType, presetFor(e.target.value as UserType))}>
          {types.map((t) => <option key={t} value={t}>{USER_TYPE_LABEL[t]}</option>)}
        </Select>
        <p className="hint">Each type ticks a set of permissions. Change the ticks below if needed. The same access applies on the web and mobile apps.</p>
      </div>
      <fieldset className="flex flex-col gap-3" aria-label="Permissions">
        {TABS.map((tab) => (
          <div key={tab} className="rounded-xl border border-line p-3">
            <p className="mb-2 text-xs font-semibold tracking-wide text-faint uppercase">{tab}</p>
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {TEAM_PERMISSIONS.filter((p) => p.tab === tab).map((p) => (
                <li key={p.key}>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="size-4 accent-[var(--color-accent)]" checked={permissions.includes(p.key)} onChange={(e) => toggle(p.key, e.target.checked)} />
                    {p.label}
                    <span className="text-[11px] text-faint">({p.level === 'read' ? 'read-only' : 'edit'})</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </fieldset>
    </div>
  )
}
