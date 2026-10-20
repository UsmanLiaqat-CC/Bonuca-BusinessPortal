import type { ProgramDraft } from '@/services/backend'

/**
 * Master fields (spec §4.3) — editing any of these on an Active program updates every issued
 * wallet pass retroactively, so the UI must warn before saving.
 */
export function changedMasterFields(before: ProgramDraft, after: ProgramDraft): string[] {
  const changed: string[] = []
  if (before.name !== after.name) changed.push('Program Name')
  const a = before.visuals
  const b = after.visuals
  if (a.logo !== b.logo) changed.push('Logo')
  if (a.icon !== b.icon) changed.push('Icon')
  if (JSON.stringify(a.background) !== JSON.stringify(b.background)) changed.push('Background')
  if (a.heroImage !== b.heroImage) changed.push('Hero / Strip Image')
  if (a.textColor !== b.textColor) changed.push('Text Colour')
  return changed
}
