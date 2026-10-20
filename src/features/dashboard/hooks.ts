import { useQuery } from '@tanstack/react-query'
import { useBackend } from '@/state/services'

export function useDashboard() {
  const backend = useBackend()
  return useQuery({ queryKey: ['dashboard'], queryFn: () => backend.getDashboard() })
}
