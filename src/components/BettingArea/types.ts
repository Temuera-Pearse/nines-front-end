import { HorseIdentity } from '../../utils/raceHelpers'

export interface BettingEntry {
  id: string
  rank: number
  positionMeters: number
  poolAmount: number | null
  poolPercentage: number
  payoutMultiplier: number
  identity: HorseIdentity
}
