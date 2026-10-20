import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Business, Invite } from '@/types/domain'
import { useBackend } from '@/state/services'
import { SESSION_KEY } from '@/state/session'

export function useEmployees() {
  const backend = useBackend()
  return useQuery({ queryKey: ['employees'], queryFn: () => backend.listEmployees() })
}

export function useLeaderboard(enabled = true) {
  const backend = useBackend()
  return useQuery({ queryKey: ['leaderboard'], queryFn: () => backend.getLeaderboard(), enabled })
}

export function useInvite() {
  const backend = useBackend()
  const qc = useQueryClient()
  return useMutation({ mutationFn: ({ email, role }: { email: string; role: Invite['role'] }) => backend.inviteEmployee(email, role), onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }) })
}

export function useUpdatePermissions() {
  const backend = useBackend()
  const qc = useQueryClient()
  return useMutation({ mutationFn: (patch: Partial<Business['permissions']>) => backend.updatePermissions(patch), onSuccess: () => qc.invalidateQueries({ queryKey: SESSION_KEY }) })
}
