import type { FieldErrors, FieldValues, Resolver } from 'react-hook-form'
import type { z } from 'zod'

function setPath(target: Record<string, unknown>, path: (string | number)[], value: unknown) {
  let node: Record<string, unknown> = target
  path.forEach((key, i) => {
    const k = String(key)
    if (i === path.length - 1) {
      if (node[k] === undefined) node[k] = value
      return
    }
    node[k] ??= typeof path[i + 1] === 'number' ? [] : {}
    node = node[k] as Record<string, unknown>
  })
}

/** Minimal react-hook-form resolver for zod schemas (avoids an extra dependency). */
export function zodResolver<T extends FieldValues>(schema: z.ZodType<T>): Resolver<T> {
  return async (values) => {
    const result = await schema.safeParseAsync(values)
    if (result.success) return { values: result.data, errors: {} }
    const errors: Record<string, unknown> = {}
    for (const issue of result.error.issues) {
      const path = issue.path.filter((p): p is string | number => typeof p !== 'symbol')
      setPath(errors, path.length ? path : ['root'], { type: issue.code, message: issue.message })
    }
    return { values: {}, errors: errors as FieldErrors<T> }
  }
}

/** For number inputs: '' → null, otherwise Number. */
export const toNullableNumber = (v: unknown): number | null =>
  v === '' || v === null || v === undefined ? null : Number(v)
