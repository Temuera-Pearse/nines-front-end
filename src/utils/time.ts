export function formatUtc(isoString: string): string {
  if (!isoString) return '--:--:-- UTC'
  const date = new Date(isoString)
  return date.toISOString().substring(11, 19) + ' UTC'
}

export function countdownTo(isoString: string): number {
  if (!isoString) return 0
  const target = new Date(isoString).getTime()
  const now = Date.now()
  const diff = Math.max(0, Math.floor((target - now) / 1000))
  return diff
}

export function getCurrentUtc(): string {
  return new Date().toISOString()
}

export function formatCountdown(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function calculateElapsedTime(startUtc: string): number {
  if (!startUtc) return 0
  const start = new Date(startUtc).getTime()
  const now = Date.now()
  return Math.floor((now - start) / 1000)
}
