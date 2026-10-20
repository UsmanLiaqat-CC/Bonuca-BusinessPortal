const PASS_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function randomInts(count: number, max: number): number[] {
  const buf = new Uint32Array(count)
  crypto.getRandomValues(buf)
  return Array.from(buf, (n) => n % max)
}

export function createId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replaceAll('-', '').slice(0, 12)}`
}

/** Code encoded in a customer's wallet-pass QR. */
export function createPassCode(): string {
  return `BNC-${randomInts(8, PASS_ALPHABET.length)
    .map((i) => PASS_ALPHABET[i])
    .join('')}`
}

export function createVerificationCode(): string {
  return randomInts(6, 10).join('')
}

export function createToken(): string {
  return crypto.randomUUID().replaceAll('-', '')
}
