export const VISUAL_TRACK_LENGTH_METERS = 1400
export const VISUAL_START_LINE_METERS = 200
export const OFFICIAL_RACE_DISTANCE_METERS = 1000
export const VISUAL_FINISH_LINE_METERS =
  VISUAL_START_LINE_METERS + OFFICIAL_RACE_DISTANCE_METERS
export const VISUAL_RUNOFF_DISTANCE_METERS =
  VISUAL_TRACK_LENGTH_METERS - VISUAL_FINISH_LINE_METERS
export const VISUAL_OFFSCREEN_OVERSHOOT_METERS = 60

const DEFAULT_TRACK_LENGTH_METERS = OFFICIAL_RACE_DISTANCE_METERS

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

interface RaceEventIdentity {
  label: string
}

const RACE_EVENT_IDENTITIES: Record<string, RaceEventIdentity> = {
  hook_shot: { label: 'Hook Shot' },
  bomb_throw: { label: 'Bomb Throw' },
  position_swap: { label: 'Position Swap' },
  samurai_duel: { label: 'Samurai Duel' },
  smg_attack: { label: 'SMG Attack' },
  summon_lightning_strike: { label: 'Summon Lightning' },
  aerial_duel: { label: 'Aerial Duel' },
  ice_patch: { label: 'Ice Patch' },
  earthquake: { label: 'Earthquake' },
  tidal_wave: { label: 'Tidal Wave' },
  lightning_strike: { label: 'Lightning Strike' },
  meteor_strike: { label: 'Meteor Strike' },
  tornado: { label: 'Tornado' },
  rocket_boost: { label: 'Rocket Boost' },
  temporary_shield: { label: 'Temporary Shield' },
  magnet_pull: { label: 'Magnet Pull' },
  ufo_abduction: { label: 'UFO Abduction' },
  chain_reaction: { label: 'Chain Reaction' },
  chain_stun: { label: 'Chain Stun' },
  luck_charm: { label: 'Luck Charm' },
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

export function getRaceEventLabel(eventId: string): string {
  return RACE_EVENT_IDENTITIES[eventId]?.label ?? eventId.replace(/_/g, ' ')
}

export function describeRaceEvent(
  eventId: string,
  affectedHorseIds: string[] = [],
): string {
  const label = getRaceEventLabel(eventId)

  if (affectedHorseIds.length === 1) {
    return `${getHorseName(affectedHorseIds[0])}: ${label}`
  }

  if (affectedHorseIds.length === 2) {
    return `${label} on ${affectedHorseIds.map(getHorseName).join(' and ')}`
  }

  if (affectedHorseIds.length > 2) {
    return `${label} across ${affectedHorseIds.length} horses`
  }

  return `${label} triggered`
}

/**
 * Backend positions are in meters (0..trackLength). Convert to 0..100%.
 */
export function positionToPercentage(
  positionMeters: number,
  trackLengthMeters: number = DEFAULT_TRACK_LENGTH_METERS,
): number {
  const startProgress =
    (VISUAL_START_LINE_METERS / VISUAL_TRACK_LENGTH_METERS) * 100
  if (!Number.isFinite(positionMeters) || positionMeters <= 0) {
    return startProgress
  }
  if (!Number.isFinite(trackLengthMeters) || trackLengthMeters <= 0) return 0

  const visualFinishMeters = VISUAL_START_LINE_METERS + trackLengthMeters
  const maxVisualMeters =
    visualFinishMeters +
    VISUAL_RUNOFF_DISTANCE_METERS +
    VISUAL_OFFSCREEN_OVERSHOOT_METERS
  const visualMeters = clamp(
    VISUAL_START_LINE_METERS + positionMeters,
    VISUAL_START_LINE_METERS,
    maxVisualMeters,
  )

  return clamp((visualMeters / VISUAL_TRACK_LENGTH_METERS) * 100, 0, 110)
}

export function positionToProgress(
  positionMeters: number,
  trackLengthMeters: number = DEFAULT_TRACK_LENGTH_METERS,
): number {
  const startProgress = VISUAL_START_LINE_METERS / VISUAL_TRACK_LENGTH_METERS
  if (!Number.isFinite(positionMeters) || positionMeters <= 0) {
    return startProgress
  }
  if (!Number.isFinite(trackLengthMeters) || trackLengthMeters <= 0) return 0

  const visualFinishMeters = VISUAL_START_LINE_METERS + trackLengthMeters
  const maxVisualMeters =
    visualFinishMeters +
    VISUAL_RUNOFF_DISTANCE_METERS +
    VISUAL_OFFSCREEN_OVERSHOOT_METERS
  const visualMeters = clamp(
    VISUAL_START_LINE_METERS + positionMeters,
    VISUAL_START_LINE_METERS,
    maxVisualMeters,
  )

  return clamp(visualMeters / VISUAL_TRACK_LENGTH_METERS, 0, 1.1)
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
