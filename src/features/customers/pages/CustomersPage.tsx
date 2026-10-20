import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Settings2, UserPlus, Users } from 'lucide-react'
import { useT } from '@/i18n'
import { useAccess, useSession } from '@/state/session'
import { searchCustomers } from '@/lib/customerSearch'
import { formatDate } from '@/lib/dates'
import { PageHeader } from '@/components/data-display/PageHeader'
import { DataTable } from '@/components/data-display/Table'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Field'
import { buttonClass } from '@/components/ui/Button'
import { GuardedButton } from '@/components/feedback/GuardedButton'
import { EmptyState, QueryState } from '@/components/feedback/QueryState'
import { AddCustomerDialog } from '../components/AddCustomerDialog'
import { useCustomers } from '../hooks'

/** Spec §4.5 — customer list with search by Name, Phone, Email, Customer ID. */
export default function CustomersPage() {
  const t = useT()
  const navigate = useNavigate()
  const access = useAccess()
  const { session } = useSession()
  const customers = useCustomers()
  const [query, setQuery] = useState('')
  const [adding, setAdding] = useState(false)
  const full = access.can('customers.viewFull')
  const results = useMemo(() => searchCustomers(customers.data ?? [], query), [customers.data, query])

  return (
    <>
      <PageHeader
        title={full ? t('nav.customers') : t('nav.customerInfo')}
        description={full ? undefined : 'Limited customer information for scanning and redemption.'}
        actions={
          full && (
            <>
              <Link to="/app/customers/signup-fields" className={buttonClass('secondary')}>
                <Settings2 className="size-4" aria-hidden /> Signup fields
              </Link>
              <GuardedButton permission="customers.add" extra={access.limit('customers', customers.data?.length ?? 0)} onClick={() => setAdding(true)}>
                <UserPlus className="size-4" aria-hidden /> Add customer
              </GuardedButton>
            </>
          )
        }
      />
      <Card>
        <div className="border-b border-line p-4">
          <div className="relative block max-w-md">
            <label htmlFor="customer-search" className="sr-only">Search customers</label>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <Input id="customer-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={full ? 'Search by name, phone, email or customer ID' : 'Search by name or customer ID'} className="pl-9" />
          </div>
        </div>
        <QueryState query={customers}>
          {(list) =>
            list.length === 0 ? (
              <div className="p-5">
                <EmptyState icon={<Users className="size-6" />} title="No customers yet" body="Customers appear here when they join a program through its QR code." />
              </div>
            ) : results.length === 0 ? (
              <div className="p-5">
                <EmptyState title="No matching customers" body={`Nothing matches “${query}”.`} />
              </div>
            ) : (
              <DataTable
                caption="Customers"
                rows={results}
                rowKey={(c) => c.id}
                onRowClick={(c) => navigate(`/app/customers/${c.id}`)}
                columns={[
                  { key: 'name', header: 'Name', cell: (c) => <span className="font-medium">{c.name || '—'}</span> },
                  { key: 'id', header: 'Customer ID', cell: (c) => <span className="font-mono text-xs">{c.customerNumber}</span> },
                  ...(full
                    ? [
                        { key: 'email', header: 'Email', hideOnMobile: true, cell: (c: (typeof results)[number]) => c.email || '—' },
                        { key: 'phone', header: 'Phone', hideOnMobile: true, cell: (c: (typeof results)[number]) => c.phone || '—' },
                      ]
                    : []),
                  { key: 'joined', header: 'Joined', hideOnMobile: true, cell: (c) => formatDate(c.createdAt) },
                ]}
              />
            )
          }
        </QueryState>
      </Card>
      {full && <AddCustomerDialog open={adding} onClose={() => setAdding(false)} fields={session.business.signupFields} />}
    </>
  )
}
