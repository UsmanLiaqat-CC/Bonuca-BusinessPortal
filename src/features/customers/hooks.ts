import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { SignupFieldConfig } from '@/types/domain'
import type { CustomerInput } from '@/services/backend'
import { useBackend } from '@/state/services'
import { SESSION_KEY } from '@/state/session'

export function useCustomers() {
  const backend = useBackend()
  return useQuery({ queryKey: ['customers'], queryFn: () => backend.listCustomers() })
}

export function useCustomer(id: string) {
  const backend = useBackend()
  return useQuery({ queryKey: ['customer', id], queryFn: () => backend.getCustomer(id) })
}

export function useAddCustomer() {
  const backend = useBackend()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CustomerInput) => backend.addCustomer(input),
    onSuccess: () => Promise.all([qc.invalidateQueries({ queryKey: ['customers'] }), qc.invalidateQueries({ queryKey: ['dashboard'] })]),
  })
}

export function useUpdateNotes(id: string) {
  const backend = useBackend()
  const qc = useQueryClient()
  return useMutation({ mutationFn: (notes: string) => backend.updateCustomerNotes(id, notes), onSuccess: () => qc.invalidateQueries({ queryKey: ['customer', id] }) })
}

export function useUpdateSignupFields() {
  const backend = useBackend()
  const qc = useQueryClient()
  return useMutation({ mutationFn: (c: SignupFieldConfig) => backend.updateSignupFields(c), onSuccess: () => qc.invalidateQueries({ queryKey: SESSION_KEY }) })
}
