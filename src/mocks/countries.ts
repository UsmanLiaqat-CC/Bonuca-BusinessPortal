/** Registration country list (ISO 3166-1 alpha-2). The spec requires a dropdown but supplies no list. */
export const COUNTRIES: { code: string; name: string }[] = [
  { code: 'AT', name: 'Austria' }, { code: 'BE', name: 'Belgium' }, { code: 'CH', name: 'Switzerland' },
  { code: 'CZ', name: 'Czechia' }, { code: 'DE', name: 'Germany' }, { code: 'DK', name: 'Denmark' },
  { code: 'ES', name: 'Spain' }, { code: 'FI', name: 'Finland' }, { code: 'FR', name: 'France' },
  { code: 'GB', name: 'United Kingdom' }, { code: 'GR', name: 'Greece' }, { code: 'HU', name: 'Hungary' },
  { code: 'IE', name: 'Ireland' }, { code: 'IT', name: 'Italy' }, { code: 'LU', name: 'Luxembourg' },
  { code: 'NL', name: 'Netherlands' }, { code: 'NO', name: 'Norway' }, { code: 'PL', name: 'Poland' },
  { code: 'PT', name: 'Portugal' }, { code: 'RO', name: 'Romania' }, { code: 'SE', name: 'Sweden' },
  { code: 'SK', name: 'Slovakia' }, { code: 'TR', name: 'Türkiye' }, { code: 'US', name: 'United States' },
  { code: 'OTHER', name: 'Other' },
]

/** Country → suggested interface language (§1.2). */
export function suggestedLanguage(code: string): 'en' | 'de' | 'tr' | 'fr' | 'it' {
  if (['DE', 'AT'].includes(code)) return 'de'
  if (code === 'TR') return 'tr'
  if (['FR', 'BE', 'LU'].includes(code)) return 'fr'
  if (code === 'IT') return 'it'
  return 'en'
}
