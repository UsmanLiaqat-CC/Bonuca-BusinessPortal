import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useBackend } from '@/state/services'
import { Select } from '@/components/ui/Field'

/** DEVELOPMENT ONLY: pick a stored pass code instead of scanning a physical QR. */
export function SamplePassPicker({ onPick }: { onPick: (code: string) => void }) {
  const backend = useBackend()
  const [customerId, setCustomerId] = useState('')
  const customers = useQuery({ queryKey: ['customers'], queryFn: () => backend.listCustomers() })
  const detail = useQuery({ queryKey: ['customer', customerId], queryFn: () => backend.getCustomer(customerId), enabled: !!customerId })
  const vouchers = detail.data?.rewards.filter((r) => r.passCode) ?? []
  return (
    <div className="callout dev block" role="note">
      <b>Development: pick a stored pass</b>
      <Select className="mt-2" aria-label="Sample customer" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
        <option value="">Choose a customer…</option>
        {(customers.data ?? []).slice(0, 40).map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} ({c.customerNumber})
          </option>
        ))}
      </Select>
      {detail.data && (
        <ul className="mt-2 flex flex-col gap-1">
          {detail.data.memberships.map(({ membership, program }) => (
            <li key={membership.id}>
              <button type="button" className="link text-left" onClick={() => onPick(membership.passCode)}>
                {program.name}: <code className="mono">{membership.passCode}</code>
              </button>
            </li>
          ))}
          {vouchers.map((r) => (
            <li key={r.id}>
              <button type="button" className="link text-left" onClick={() => onPick(r.passCode!)}>
                Voucher {r.name}: <code className="mono">{r.passCode}</code>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
