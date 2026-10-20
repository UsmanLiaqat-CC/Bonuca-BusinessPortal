import { describe, expect, it } from 'vitest'
import { availableActions, nextStatus } from '@/lib/lifecycle'

describe('program lifecycle (spec §4.2)', () => {
  it('Draft → Active only via Publish', () => {
    expect(nextStatus('draft', 'publish')).toBe('active')
    expect(nextStatus('draft', 'enable')).toBeNull()
  })
  it('Enable/Disable toggles Active ⇄ Paused', () => {
    expect(nextStatus('active', 'disable')).toBe('paused')
    expect(nextStatus('paused', 'enable')).toBe('active')
    expect(nextStatus('active', 'publish')).toBeNull()
  })
  it('Archive is a separate, permanent action', () => {
    expect(nextStatus('paused', 'archive')).toBe('archived')
    expect(availableActions('archived')).toEqual([])
  })
})
