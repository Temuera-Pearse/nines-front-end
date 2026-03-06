const DEFAULT_TRACK_LENGTH_METERS = 1000

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

// ─── Horse identity catalogue ────────────────────────────────────────────────
// Each slot maps to horse-0 … horse-9 from the backend.
export interface HorseIdentity {
  number: number // race number (1-based, displayed on badge)
  name: string
  hex: string // primary colour as a hex string
  tailwind: string // Tailwind bg- class (kept for places that already use it)
}

export const HORSE_IDENTITIES: HorseIdentity[] = [
  { number: 1, name: 'Red Rocket', hex: '#ef4444', tailwind: 'bg-red-500' },
  { number: 2, name: 'Blue Bolt', hex: '#3b82f6', tailwind: 'bg-blue-500' },
  { number: 3, name: 'Green Ghost', hex: '#22c55e', tailwind: 'bg-green-500' },
  { number: 4, name: 'Gold Rush', hex: '#eab308', tailwind: 'bg-yellow-500' },
  {
    number: 5,
    name: 'Purple Reign',
    hex: '#a855f7',
    tailwind: 'bg-purple-500',
  },
  { number: 6, name: 'Pink Storm', hex: '#ec4899', tailwind: 'bg-pink-500' },
  { number: 7, name: 'Indigo Fire', hex: '#6366f1', tailwind: 'bg-indigo-500' },
  {
    number: 8,
    name: 'Orange Blaze',
    hex: '#f97316',
    tailwind: 'bg-orange-500',
  },
  { number: 9, name: 'Teal Comet', hex: '#14b8a6', tailwind: 'bg-teal-500' },
  { number: 10, name: 'Cyan Flash', hex: '#06b6d4', tailwind: 'bg-cyan-500' },
]

export function getHorseIdentity(horseId: string): HorseIdentity {
  const raw = Number(horseId.split('-')[1])
  const index = Number.isFinite(raw) ? raw : 0
  return HORSE_IDENTITIES[
    ((index % HORSE_IDENTITIES.length) + HORSE_IDENTITIES.length) %
      HORSE_IDENTITIES.length
  ]
}

/**
 * Backend positions are in meters (0..trackLength). Convert to 0..100%.
 */
export function positionToPercentage(
  positionMeters: number,
  trackLengthMeters: number = DEFAULT_TRACK_LENGTH_METERS,
): number {
  if (!Number.isFinite(positionMeters) || positionMeters <= 0) return 0
  if (!Number.isFinite(trackLengthMeters) || trackLengthMeters <= 0) return 0
  return clamp((positionMeters / trackLengthMeters) * 100, 0, 100)
}

export function positionToProgress(
  positionMeters: number,
  trackLengthMeters: number = DEFAULT_TRACK_LENGTH_METERS,
): number {
  if (!Number.isFinite(positionMeters) || positionMeters <= 0) return 0
  if (!Number.isFinite(trackLengthMeters) || trackLengthMeters <= 0) return 0
  return clamp(positionMeters / trackLengthMeters, 0, 1)
}

export function getHorseColor(horseId: string): string {
  return getHorseIdentity(horseId).tailwind
}

export function getHorseHex(horseId: string): string {
  return getHorseIdentity(horseId).hex
}

export function getHorseName(horseId: string): string {
  return getHorseIdentity(horseId).name
}

export function getHorseNumber(horseId: string): number {
  return getHorseIdentity(horseId).number
}

export function calculateElapsedTime(startUtc: string): number {
  if (!startUtc) return 0
  const start = new Date(startUtc).getTime()
  const now = Date.now()
  return Math.floor((now - start) / 1000)
}
