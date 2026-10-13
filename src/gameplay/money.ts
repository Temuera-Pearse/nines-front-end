export const NINES_SCALE = 6
const MINOR_FACTOR = 10n ** BigInt(NINES_SCALE)

export function parseNinesToMinor(value: string): string {
  const normalized = value.trim()
  const match = /^(0|[1-9][0-9]*)(?:\.([0-9]{0,6}))?$/.exec(normalized)
  if (!match) throw new Error('Enter a valid NINES amount with up to 6 decimals')
  const whole = BigInt(match[1])
  const fractional = (match[2] ?? '').padEnd(NINES_SCALE, '0')
  const minor = whole * MINOR_FACTOR + BigInt(fractional || '0')
  if (minor <= 0n) throw new Error('Stake must be greater than zero')
  return minor.toString()
}

export function formatNinesMinor(value: string): string {
  if (!/^[0-9]+$/.test(value)) return '—'
  const minor = BigInt(value)
  const whole = minor / MINOR_FACTOR
  const fraction = (minor % MINOR_FACTOR).toString().padStart(NINES_SCALE, '0')
    .replace(/0+$/, '')
  return fraction ? `${whole}.${fraction}` : whole.toString()
}
