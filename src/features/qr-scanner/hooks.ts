import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ScanInput } from '@/lib/scanEngine'
import { useBackend } from '@/state/services'

export function useRecentScans(limit = 10) {
  const backend = useBackend()
  return useQuery({ queryKey: ['recent-scans', limit], queryFn: () => backend.listRecentScans(limit) })
}

export function useLookupPass() {
  const backend = useBackend()
  return useMutation({ mutationFn: (code: string) => backend.lookupPass(code) })
}

export function useConfirmScan() {
  const backend = useBackend()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: Omit<ScanInput, 'employeeId'>) => backend.confirmScan(input),
    onSuccess: () => {
      for (const key of ['recent-scans', 'customers', 'customer', 'rewards', 'dashboard', 'analytics', 'leaderboard', 'winback']) {
        void qc.invalidateQueries({ queryKey: [key] })
      }
    },
  })
}
