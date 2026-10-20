import type { Customer } from '@/types/domain'

/** Customer search by Name, Phone, Email and Customer ID (spec §4.5). */
export function matchesCustomer(customer: Customer, rawQuery: string): boolean {
  const q = rawQuery.trim().toLowerCase()
  if (!q) return true
  const digits = q.replace(/\D/g, '')
  return (
    customer.name.toLowerCase().includes(q) ||
    customer.email.toLowerCase().includes(q) ||
    customer.customerNumber.toLowerCase().includes(q) ||
    (digits.length >= 3 && customer.phone.replace(/\D/g, '').includes(digits))
  )
}

export function searchCustomers(customers: Customer[], query: string): Customer[] {
  return customers.filter((c) => matchesCustomer(c, query))
}
