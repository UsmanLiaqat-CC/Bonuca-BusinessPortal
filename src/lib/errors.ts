import type { ZodError } from 'zod'
import { AccessDeniedError } from './access'

export class ValidationError extends Error {
  readonly issues: { path: string; message: string }[]
  constructor(message: string, issues: { path: string; message: string }[] = []) {
    super(message)
    this.name = 'ValidationError'
    this.issues = issues
  }
  static fromZod(error: ZodError, message = 'Some fields need attention.'): ValidationError {
    return new ValidationError(
      message,
      error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    )
  }
}

export class NotFoundError extends Error {
  constructor(message = 'Not found.') {
    super(message)
    this.name = 'NotFoundError'
  }
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

/** Centralised user-facing error text. */
export function errorMessage(error: unknown): string {
  if (error instanceof ValidationError && error.issues.length) {
    return `${error.message} ${error.issues.slice(0, 3).map((i) => i.message).join(' ')}`
  }
  if (error instanceof AccessDeniedError) return error.decision.message
  if (error instanceof Error) return error.message
  return 'Something went wrong. Please try again.'
}
