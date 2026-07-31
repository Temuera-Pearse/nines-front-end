export function createRequestId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `nines-${Date.now()}-${Math.random().toString(16).slice(2)}`
}
