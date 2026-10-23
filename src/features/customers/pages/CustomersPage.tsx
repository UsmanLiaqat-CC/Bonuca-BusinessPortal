import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Search, SearchX, Settings2, UserPlus, Users } from 'lucide-react'
import { useT } from '@/i18n'
import { useAccess, useSession } from '@/state/session'
import { searchCustomers } from '@/lib/customerSearch'
import { formatDate } from '@/lib/dates'
import { PageHeader } from '@/components/data-display/PageHeader'
import { DataTable, Initials } from '@/components/data-display/Table'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Field'
import { buttonClass } from '@/components/ui/Button'
import { GuardedButton } from '@/components/feedback/GuardedButton'
import { EmptyState, QueryState } from '@/components/feedback/QueryState'
import { AddCustomerDialog } from '../components/AddCustomerDialog'
import { useCustomers } from '../hooks'

const PAGE_SIZE = 16

/** Spec §4.5 — customer list with search by Name, Phone, Email, Customer ID. */
export default function CustomersPage() {
  const t = useT()
  const navigate = useNavigate()
  const access = useAccess()
  const { session } = useSession()
  const customers = useCustomers()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [adding, setAdding] = useState(false)
  const full = access.can('customers.viewFull')
  const results = useMemo(() => searchCustomers(customers.data ?? [], query), [customers.data, query])
  const pages = Math.max(1, Math.ceil(results.length / PAGE_SIZE))
  const current = Math.min(page, pages - 1)
  const shown = results.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE)

  return (
    <>
      <PageHeader
        title={full ? t('nav.customers') : t('nav.customerInfo')}
        breadcrumb={
          <>
            <Users className="size-[13px]" aria-hidden /> {t('nav.group.operations')}
          </>
        }
        description={full ? undefined : 'Limited customer information for scanning and redemption.'}
        actions={
          full && (
            <>
              <Link to="/app/customers/signup-fields" className={buttonClass('secondary')}>
                <Settings2 className="size-[15px]" aria-hidden /> Signup fields
              </Link>
              <GuardedButton permission="customers.add" extra={access.limit('customers', customers.data?.length ?? 0)} onClick={() => setAdding(true)}>
                <UserPlus className="size-[15px]" aria-hidden /> Add customer
              </GuardedButton>
            </>
          )
        }
      />
      <Card className="reveal-up overflow-hidden">
        <div className="toolbar border-b border-line">
          <div className="search">
            <label htmlFor="customer-search" className="sr-only">
              Search customers
            </label>
            <Search className="pointer-events-none size-4" aria-hidden />
            <Input
              id="customer-search"
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(0)
              }}
              placeholder={full ? 'Search by name, phone, email or customer ID' : 'Search by name or customer ID'}
            />
          </div>
          {customers.data && <span className="text-[13px] text-muted">{results.length.toLocaleString()} customers</span>}
        </div>
        <QueryState query={customers}>
          {(list) =>
            list.length === 0 ? (
              <div className="p-5">
                <EmptyState icon={<Users className="size-6" />} title="No customers yet" body="Customers appear here when they join a program through its QR code." />
              </div>
            ) : results.length === 0 ? (
              <div className="p-5">
                <EmptyState icon={<SearchX className="size-6" />} title="No matching customers" body={`Nothing matches “${query}”.`} />
              </div>
            ) : (
              <>
                <DataTable
                  caption="Customers"
                  rows={shown}
                  rowKey={(c) => c.id}
                  onRowClick={(c) => navigate(`/app/customers/${c.id}`)}
                  columns={[
                    {
                      key: 'name',
                      header: 'Name',
                      cell: (c) => (
                        <span className="person">
                          <Initials name={c.name || c.customerNumber} />
                          {c.name || '—'}
                        </span>
                      ),
                    },
                    { key: 'id', header: 'Customer ID', cell: (c) => <span className="mono text-muted">{c.customerNumber}</span> },
                    ...(full
                      ? [
                          { key: 'email', header: 'Email', hideOnMobile: true, cell: (c: (typeof results)[number]) => c.email || '—' },
                          { key: 'phone', header: 'Phone', hideOnMobile: true, cell: (c: (typeof results)[number]) => c.phone || '—' },
                        ]
                      : []),
                    { key: 'joined', header: 'Joined', hideOnMobile: true, cell: (c) => <span className="text-muted">{formatDate(c.createdAt)}</span> },
                  ]}
                />
                {pages > 1 && (
                  <nav className="pager flex-wrap gap-2" aria-label="Customer pages">
                    <span>
                      {current * PAGE_SIZE + 1}–{Math.min((current + 1) * PAGE_SIZE, results.length)} of {results.length}
                    </span>
                    <div className="pg">
                      <button type="button" aria-label="Previous page" disabled={current === 0} onClick={() => setPage(current - 1)} className="grid place-items-center disabled:opacity-40">
                        <ChevronLeft className="size-[15px]" aria-hidden />
                      </button>
                      {Array.from({ length: pages }, (_, i) => i)
                        .filter((i) => pages <= 7 || Math.abs(i - current) <= 2 || i === 0 || i === pages - 1)
                        .map((i) => (
                          <button key={i} type="button" aria-current={i === current ? 'page' : undefined} className={i === current ? 'on' : undefined} onClick={() => setPage(i)}>
                            {i + 1}
                          </button>
                        ))}
                      <button type="button" aria-label="Next page" disabled={current === pages - 1} onClick={() => setPage(current + 1)} className="grid place-items-center disabled:opacity-40">
                        <ChevronRight className="size-[15px]" aria-hidden />
                      </button>
                    </div>
                  </nav>
                )}
              </>
            )
          }
        </QueryState>
      </Card>
      {full && <AddCustomerDialog open={adding} onClose={() => setAdding(false)} fields={session.business.signupFields} />}
    </>
  )
}
