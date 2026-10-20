import type { OpeningHours, Weekday } from '@/types/domain'
import { WEEKDAYS } from '@/types/domain'

const LABELS: Record<Weekday, string> = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' }

/** Structured opening hours input (spec §1.4). */
export function OpeningHoursField({ value, onChange, errors, disabled }: { value: OpeningHours; onChange: (v: OpeningHours) => void; errors?: Partial<Record<Weekday, string>>; disabled?: boolean }) {
  const set = (day: Weekday, patch: Partial<OpeningHours[Weekday]>) => onChange({ ...value, [day]: { ...value[day], ...patch } })
  return (
    <fieldset className="flex flex-col gap-2" disabled={disabled}>
      {WEEKDAYS.map((day) => (
        <div key={day} className="flex flex-wrap items-center gap-2 text-sm">
          <span className="w-24 font-medium">{LABELS[day]}</span>
          <label className="flex items-center gap-1.5">
            <input type="checkbox" checked={value[day].closed} onChange={(e) => set(day, { closed: e.target.checked })} className="size-4 accent-[var(--bn-accent)]" />
            Closed
          </label>
          {!value[day].closed && (
            <>
              <input type="time" aria-label={`${LABELS[day]} opens`} value={value[day].open} onChange={(e) => set(day, { open: e.target.value })} className="h-9 rounded-lg border border-line bg-surface px-2" />
              <span className="text-muted">–</span>
              <input type="time" aria-label={`${LABELS[day]} closes`} value={value[day].close} onChange={(e) => set(day, { close: e.target.value })} className="h-9 rounded-lg border border-line bg-surface px-2" />
            </>
          )}
          {errors?.[day] && <span className="w-full text-xs text-danger">{errors[day]}</span>}
        </div>
      ))}
    </fieldset>
  )
}
