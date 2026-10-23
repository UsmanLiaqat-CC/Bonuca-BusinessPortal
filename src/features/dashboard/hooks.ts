import { useQuery } from '@tanstack/react-query'
import { useBackend } from '@/state/services'
import type { DateRange } from '@/lib/metrics'

export function useDashboard(range?: DateRange) {
  const backend = useBackend()
  return useQuery({ queryKey: ['dashboard', range?.from, range?.to], queryFn: () => backend.getDashboard(range), placeholderData: (prev) => prev })
}
