import type { OpeningHours, Weekday } from '@/types/domain'
import { WEEKDAYS } from '@/types/domain'
import { cn } from '@/lib/cn'

const LABELS: Record<Weekday, string> = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' }

/** Structured opening hours input (spec §1.4). Redesign rows: day · open switch · times (closed days dim). */
export function OpeningHoursField({ value, onChange, errors, disabled }: { value: OpeningHours; onChange: (v: OpeningHours) => void; errors?: Partial<Record<Weekday, string>>; disabled?: boolean }) {
  const set = (day: Weekday, patch: Partial<OpeningHours[Weekday]>) => onChange({ ...value, [day]: { ...value[day], ...patch } })
  return (
    <fieldset className="flex flex-col" disabled={disabled}>
      {WEEKDAYS.map((day) => {
        const closed = value[day].closed
        return (
          <div key={day} className={cn('hours-row text-sm sm:grid-cols-[110px_100px_1fr]', closed && 'closed')}>
            <span className="font-semibold">{LABELS[day]}</span>
            <label className="check text-[13px]">
              <input type="checkbox" checked={closed} onChange={(e) => set(day, { closed: e.target.checked })} />
              Closed
            </label>
            {closed ? (
              <span className="closed-tag">Closed all day</span>
            ) : (
              <span className="times">
                <input type="time" aria-label={`${LABELS[day]} opens`} value={value[day].open} onChange={(e) => set(day, { open: e.target.value })} className="input h-10" />
                <span className="text-faint">–</span>
                <input type="time" aria-label={`${LABELS[day]} closes`} value={value[day].close} onChange={(e) => set(day, { close: e.target.value })} className="input h-10" />
              </span>
            )}
            {errors?.[day] && <span className="error-msg col-span-full">{errors[day]}</span>}
          </div>
        )
      })}
    </fieldset>
  )
}
