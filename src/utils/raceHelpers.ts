import {
  FINISH_Y,
  RACE_DISTANCE_Y,
  START_Y,
  TRACK_HEIGHT,
} from '../constants/raceTrack'
import { HORSE_COUNT } from '../constants/raceParticipants'

export const OFFICIAL_RACE_DISTANCE_METERS = 1000

const DEFAULT_TRACK_LENGTH_METERS = OFFICIAL_RACE_DISTANCE_METERS
const DEFAULT_FINISH_LINE_METERS = OFFICIAL_RACE_DISTANCE_METERS

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

function normalizePositiveNumber(
  value: number,
  fallback: number,
): number {
  return Number.isFinite(value) && value > 0 ? value : fallback
}

export interface RaceVisualMetrics {
  startProgress: number
  finishProgress: number
  raceDistanceMeters: number
  visualTrackLengthMeters: number
}

export function getRaceVisualMetrics(
  trackLengthMeters: number = DEFAULT_TRACK_LENGTH_METERS,
  finishLineMeters: number = DEFAULT_FINISH_LINE_METERS,
): RaceVisualMetrics {
  const safeTrackLength = normalizePositiveNumber(
    trackLengthMeters,
    DEFAULT_TRACK_LENGTH_METERS,
  )
  const safeFinishLine = normalizePositiveNumber(
    finishLineMeters,
    safeTrackLength,
  )
  const raceDistanceMeters = Math.min(safeFinishLine, safeTrackLength)
  return {
    startProgress: START_Y / TRACK_HEIGHT,
    finishProgress: FINISH_Y / TRACK_HEIGHT,
    raceDistanceMeters,
    visualTrackLengthMeters: TRACK_HEIGHT,
  }
}

// ─── Horse identity catalogue ────────────────────────────────────────────────
// Active slots map to horse-0 … horse-8 from the backend.
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
]

const LEGACY_HORSE_IDENTITIES: Record<string, HorseIdentity> = {
  'horse-9': {
    number: 10,
    name: 'Cyan Flash',
    hex: '#06b6d4',
    tailwind: 'bg-cyan-500',
  },
}

export function getHorseIdentity(horseId: string): HorseIdentity {
  const legacyIdentity = LEGACY_HORSE_IDENTITIES[horseId]
  if (legacyIdentity) return legacyIdentity

  const raw = Number(horseId.split('-')[1])
  const index = Number.isFinite(raw) ? raw : 0
  const activeIdentityCount = Math.min(HORSE_COUNT, HORSE_IDENTITIES.length)
  return HORSE_IDENTITIES[
    ((index % activeIdentityCount) + activeIdentityCount) %
      activeIdentityCount
  ]
}

export function getRaceEventLabel(eventId: string): string {
  return RACE_EVENT_IDENTITIES[eventId]?.label ?? eventId.replace(/_/g, ' ')
}

export function describeRaceEvent(
  eventId: string,
  affectedHorseIds: string[] = [],
): string {
  if (eventId === 'finish_line_crossed') {
    if (affectedHorseIds.length >= 1) {
      return `${getHorseName(affectedHorseIds[0])} crossed the finish line`
    }
    return 'A horse crossed the finish line'
  }

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
 * Backend positions are in meters. Convert them into fixed race-world progress.
 */
export function positionToPercentage(
  positionMeters: number,
  trackLengthMeters: number = DEFAULT_TRACK_LENGTH_METERS,
  finishLineMeters: number = DEFAULT_FINISH_LINE_METERS,
): number {
  return (
    positionToProgress(positionMeters, trackLengthMeters, finishLineMeters) *
    100
  )
}

export function positionToProgress(
  positionMeters: number,
  _trackLengthMeters: number = DEFAULT_TRACK_LENGTH_METERS,
  finishLineMeters: number = DEFAULT_FINISH_LINE_METERS,
): number {
  return positionToRaceProgress(positionMeters, finishLineMeters)
}

export function positionToRaceProgress(
  positionMeters: number,
  finishLineMeters: number = DEFAULT_FINISH_LINE_METERS,
): number {
  const safeFinishLine = normalizePositiveNumber(
    finishLineMeters,
    DEFAULT_FINISH_LINE_METERS,
  )
  if (!Number.isFinite(positionMeters) || positionMeters <= 0) {
    return 0
  }

  return clamp(positionMeters / safeFinishLine, 0, 1)
}

export function raceProgressToWorldY(progress: number): number {
  return START_Y - clamp(progress, 0, 1) * RACE_DISTANCE_Y
}

export function positionToWorldY(
  positionMeters: number,
  finishLineMeters: number = DEFAULT_FINISH_LINE_METERS,
): number {
  return raceProgressToWorldY(
    positionToRaceProgress(positionMeters, finishLineMeters),
  )
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
