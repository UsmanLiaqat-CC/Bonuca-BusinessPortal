import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { BusinessUpdate } from '@/services/backend'
import { useBackend } from '@/state/services'
import { SESSION_KEY } from '@/state/session'

export function useUpdateBusiness() {
  const backend = useBackend()
  const qc = useQueryClient()
  return useMutation({ mutationFn: (u: BusinessUpdate) => backend.updateBusiness(u), onSuccess: () => qc.invalidateQueries({ queryKey: SESSION_KEY }) })
}
