import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { WinBackConfig } from '@/types/domain'
import type { NotificationDraft } from '@/services/backend'
import { useBackend } from '@/state/services'

export function useNotifications() {
  const backend = useBackend()
  return useQuery({ queryKey: ['notifications'], queryFn: () => backend.listNotifications() })
}

export function useSaveNotification() {
  const backend = useBackend()
  const qc = useQueryClient()
  return useMutation({ mutationFn: ({ id, draft }: { id: string | null; draft: NotificationDraft }) => backend.saveNotification(id, draft), onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }) })
}

export function useSendNotification() {
  const backend = useBackend()
  const qc = useQueryClient()
  return useMutation({ mutationFn: (id: string) => backend.sendNotification(id), onSettled: () => qc.invalidateQueries({ queryKey: ['notifications'] }) })
}

export function useWinBack() {
  const backend = useBackend()
  return useQuery({ queryKey: ['winback'], queryFn: () => backend.getWinBack() })
}

export function useSaveWinBack() {
  const backend = useBackend()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (c: WinBackConfig) => backend.saveWinBack(c),
    onSuccess: () => Promise.all([qc.invalidateQueries({ queryKey: ['winback'] }), qc.invalidateQueries({ queryKey: ['rewards'] })]),
  })
}
