import type { TeamPermission } from '@/lib/teamPermissions'
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
  return useMutation({
    mutationFn: ({ email, role, permissions }: { email: string; role: Invite['role']; permissions?: TeamPermission[] }) => backend.inviteEmployee(email, role, permissions),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  })
}

/** Owner changes a team member's User Type and permission checkboxes. */
export function useUpdateMemberAccess() {
  const backend = useBackend()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, role, permissions }: { userId: string; role: Invite['role']; permissions: TeamPermission[] }) => backend.updateMemberAccess(userId, role, permissions),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  })
}

export function useUpdatePermissions() {
  const backend = useBackend()
  const qc = useQueryClient()
  return useMutation({ mutationFn: (patch: Partial<Business['permissions']>) => backend.updatePermissions(patch), onSuccess: () => qc.invalidateQueries({ queryKey: SESSION_KEY }) })
}
