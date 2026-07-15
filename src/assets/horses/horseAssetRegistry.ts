export type HorseAnimationState =
  | 'idle'
  | 'gallop'
  | 'stumble'
  | 'finish'
  | 'shadow'

import { HORSE_COUNT } from '../../constants/raceParticipants'

export interface SharedHorseAnimationManifest {
  state: HorseAnimationState
  folder: string
  expectedFilePattern: string
  notes: string
}

export interface HorseSkinManifest {
  horseId: string
  folder: string
  accentHex: string
  expectedFiles: string[]
}

export const SHARED_HORSE_ANIMATIONS: SharedHorseAnimationManifest[] = [
  {
    state: 'idle',
    folder: 'src/assets/horses/shared/idle',
    expectedFilePattern: 'horse_idle_01.png',
    notes: 'Lineup and pre-race frames.',
  },
  {
    state: 'gallop',
    folder: 'src/assets/horses/shared/gallop',
    expectedFilePattern: 'horse_gallop_01.png',
    notes: 'Primary running cycle.',
  },
  {
    state: 'stumble',
    folder: 'src/assets/horses/shared/stumble',
    expectedFilePattern: 'horse_stumble_01.png',
    notes: 'Reaction frames for stun, collision, or disruption.',
  },
  {
    state: 'finish',
    folder: 'src/assets/horses/shared/finish',
    expectedFilePattern: 'horse_finish_01.png',
    notes: 'Finish and runoff frames.',
  },
  {
    state: 'shadow',
    folder: 'src/assets/horses/shared/shadow',
    expectedFilePattern: 'horse_shadow.png',
    notes: 'Reusable shadow or footprint overlays.',
  },
]

const ALL_HORSE_SKINS: HorseSkinManifest[] = [
  {
    horseId: 'horse-0',
    folder: 'src/assets/horses/skins/horse-0',
    accentHex: '#ef4444',
    expectedFiles: ['silks.png', 'badge.svg'],
  },
  {
    horseId: 'horse-1',
    folder: 'src/assets/horses/skins/horse-1',
    accentHex: '#3b82f6',
    expectedFiles: ['silks.png', 'badge.svg'],
  },
  {
    horseId: 'horse-2',
    folder: 'src/assets/horses/skins/horse-2',
    accentHex: '#22c55e',
    expectedFiles: ['silks.png', 'badge.svg'],
  },
  {
    horseId: 'horse-3',
    folder: 'src/assets/horses/skins/horse-3',
    accentHex: '#eab308',
    expectedFiles: ['silks.png', 'badge.svg'],
  },
  {
    horseId: 'horse-4',
    folder: 'src/assets/horses/skins/horse-4',
    accentHex: '#a855f7',
    expectedFiles: ['silks.png', 'badge.svg'],
  },
  {
    horseId: 'horse-5',
    folder: 'src/assets/horses/skins/horse-5',
    accentHex: '#ec4899',
    expectedFiles: ['silks.png', 'badge.svg'],
  },
  {
    horseId: 'horse-6',
    folder: 'src/assets/horses/skins/horse-6',
    accentHex: '#6366f1',
    expectedFiles: ['silks.png', 'badge.svg'],
  },
  {
    horseId: 'horse-7',
    folder: 'src/assets/horses/skins/horse-7',
    accentHex: '#f97316',
    expectedFiles: ['silks.png', 'badge.svg'],
  },
  {
    horseId: 'horse-8',
    folder: 'src/assets/horses/skins/horse-8',
    accentHex: '#14b8a6',
    expectedFiles: ['silks.png', 'badge.svg'],
  },
  {
    horseId: 'horse-9',
    folder: 'src/assets/horses/skins/horse-9',
    accentHex: '#06b6d4',
    expectedFiles: ['silks.png', 'badge.svg'],
  },
]

export const HORSE_SKINS: HorseSkinManifest[] = ALL_HORSE_SKINS.slice(
  0,
  HORSE_COUNT,
)

export const LEGACY_HORSE_SKINS: HorseSkinManifest[] =
  ALL_HORSE_SKINS.slice(HORSE_COUNT)
