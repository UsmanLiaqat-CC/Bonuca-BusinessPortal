import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { DesignMode, SurpriseConfig } from '@/types/domain'
import type { CampaignDraft, ProgramDraft } from '@/services/backend'
import type { LifecycleAction } from '@/lib/lifecycle'
import { useBackend } from '@/state/services'

export const programKeys = { all: ['programs'] as const, campaigns: ['campaigns'] as const }

export function usePrograms() {
  const backend = useBackend()
  return useQuery({ queryKey: programKeys.all, queryFn: () => backend.listPrograms() })
}

export function useCampaigns() {
  const backend = useBackend()
  return useQuery({ queryKey: programKeys.campaigns, queryFn: () => backend.listCampaigns() })
}

function useInvalidate() {
  const qc = useQueryClient()
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: programKeys.all }),
      qc.invalidateQueries({ queryKey: programKeys.campaigns }),
      qc.invalidateQueries({ queryKey: ['dashboard'] }),
    ])
}

export function useSaveProgram() {
  const backend = useBackend()
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: ({ id, draft }: { id: string | null; draft: ProgramDraft }) => (id ? backend.updateProgram(id, draft) : backend.createProgram(draft)),
    onSuccess: invalidate,
  })
}

export function useProgramLifecycle() {
  const backend = useBackend()
  const invalidate = useInvalidate()
  return useMutation({ mutationFn: ({ id, action }: { id: string; action: LifecycleAction }) => backend.programLifecycle(id, action), onSuccess: invalidate })
}

export function useSetDesignMode() {
  const backend = useBackend()
  const invalidate = useInvalidate()
  return useMutation({ mutationFn: ({ id, mode }: { id: string; mode: DesignMode }) => backend.setDesignMode(id, mode), onSuccess: invalidate })
}

export function useUpdateSurprise() {
  const backend = useBackend()
  const invalidate = useInvalidate()
  return useMutation({ mutationFn: ({ id, surprise }: { id: string; surprise: SurpriseConfig }) => backend.updateSurprise(id, surprise), onSuccess: invalidate })
}

export function useSaveCampaign() {
  const backend = useBackend()
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: ({ id, draft }: { id: string | null; draft: CampaignDraft }) => (id ? backend.updateCampaign(id, draft) : backend.createCampaign(draft)),
    onSuccess: invalidate,
  })
}

export function useCampaignLifecycle() {
  const backend = useBackend()
  const invalidate = useInvalidate()
  return useMutation({ mutationFn: ({ id, action }: { id: string; action: LifecycleAction }) => backend.campaignLifecycle(id, action), onSuccess: invalidate })
}
