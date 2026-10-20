import type { Background, HexColor } from '@/types/domain'

export const HEX_RE = /^#[0-9a-fA-F]{6}$/

export function isHexColor(value: string): boolean {
  return HEX_RE.test(value)
}

export function hexToRgb(hex: HexColor): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function rgbToHex(r: number, g: number, b: number): HexColor {
  return `#${[r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`.toUpperCase()
}

function channel(c: number): number {
  const s = c / 255
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

export function relativeLuminance(hex: HexColor): number {
  const [r, g, b] = hexToRgb(hex)
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

export function contrastRatio(a: HexColor, b: HexColor): number {
  const [l1, l2] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x) as [number, number]
  return (l1 + 0.05) / (l2 + 0.05)
}

/** Auto-suggest a pass text colour with contrast against the background (spec §4.2 Text Colour). */
export function suggestTextColor(background: HexColor): HexColor {
  return contrastRatio(background, '#FFFFFF') >= contrastRatio(background, '#0A0A0A') ? '#FFFFFF' : '#0A0A0A'
}

/** Representative solid colour for a background (for contrast checks). */
export function backgroundBaseColor(bg: Background): HexColor {
  return bg.kind === 'color' ? bg.color : '#0A112F'
}

/** CSS background for a pass. 'default' = Bonuca template gradient #0A112F → #000000 (§4.10). */
export function backgroundCss(bg: Background): string {
  switch (bg.kind) {
    case 'default':
      return 'linear-gradient(160deg, #0A112F 0%, #000000 100%)'
    case 'color':
      return bg.color
    case 'image':
      return `center / cover no-repeat url("${bg.image}")`
  }
}
