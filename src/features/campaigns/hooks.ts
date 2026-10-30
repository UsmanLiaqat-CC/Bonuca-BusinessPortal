import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useBackend } from '@/state/services'

export const campaignKeys = { rows: ['campaign-rows'] as const, linked: (id: string) => ['campaign-linked', id] as const }

/** Campaigns tab rows: every campaign plus the win-back campaign, with offer, period and counts. */
export function useCampaignRows() {
  const backend = useBackend()
  return useQuery({ queryKey: campaignKeys.rows, queryFn: () => backend.listCampaignRows() })
}

export function useCampaignLinked(id: string) {
  const backend = useBackend()
  return useQuery({ queryKey: campaignKeys.linked(id), queryFn: () => backend.getCampaignLinked(id) })
}

export function useInvalidateCampaigns() {
  const qc = useQueryClient()
  return () =>
    Promise.all(['campaign-rows', 'campaign-linked', 'campaigns', 'winback', 'rewards'].map((k) => qc.invalidateQueries({ queryKey: [k] })))
}

export function useLinkCampaignCustomer() {
  const backend = useBackend()
  const invalidate = useInvalidateCampaigns()
  return useMutation({ mutationFn: ({ campaignId, customerId }: { campaignId: string; customerId: string }) => backend.linkCampaignCustomer(campaignId, customerId), onSuccess: invalidate })
}

/** Win-back campaign: Pause / Resume / End. */
export function useWinbackLifecycle() {
  const backend = useBackend()
  const invalidate = useInvalidateCampaigns()
  return useMutation({ mutationFn: (action: 'enable' | 'disable' | 'end') => backend.winbackLifecycle(action), onSuccess: invalidate })
}
