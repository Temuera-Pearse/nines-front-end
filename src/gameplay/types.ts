export type WagerStatus =
  | 'accepted'
  | 'rejected'
  | 'settlement_pending'
  | 'settled_win'
  | 'settled_loss'
  | 'voided'
  | 'manual_review'

export interface PlayerBalance {
  currency: 'NINES'
  scale: 6
  availableMinor: string
  lockedMinor: string
  displayMinor: string
  effectiveStatus: string
  asOf: string
}

export interface PlayerWager {
  betId: string
  raceRef: string
  selectionId: string
  stakeMinor: string
  status: WagerStatus
  rejectionCode: string | null
  acceptedAt: string | null
  updatedAt: string
  poolStatus: string
  winningSelectionId: string | null
  settlementStatus: string | null
  settledAt: string | null
  payoutMinor: string | null
}

export interface GameplayState {
  schemaVersion: 'nines-player-gameplay-state.v1'
  balance: PlayerBalance
  wagers: PlayerWager[]
}

export interface WagerResult {
  schemaVersion: 'nines-place-bet-result.v1'
  result: 'accepted' | 'replayed' | 'rejected'
  betId: string
  raceRef: string
  selectionId: string
  stake: { currency: 'NINES'; scale: 6; minorUnits: string }
  rejectionCode: string | null
  effectiveAt: string
}
