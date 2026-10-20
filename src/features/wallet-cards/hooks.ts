import { usePrograms, useSetDesignMode } from '@/features/loyalty-programs/hooks'

export function useProgramsQueryAndMode() {
  return { programs: usePrograms(), setMode: useSetDesignMode() }
}
