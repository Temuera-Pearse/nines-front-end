import { RaceStatus } from '../state/raceStore'
import type { PlayerWager } from './types'

export function isBettingOpen(status: RaceStatus, closesAt: string, nowMs: number): boolean {
  const closesAtMs = Date.parse(closesAt)
  return status === RaceStatus.BETS_OPEN && Number.isFinite(closesAtMs) && nowMs < closesAtMs
}

export function wagerOutcome(wager: PlayerWager, winnerId: string | null):
  'pending_result' | 'settlement_pending' | 'won' | 'lost' | 'voided' | 'manual_review' {
  if (wager.status === 'settled_win') return 'won'
  if (wager.status === 'settled_loss') return 'lost'
  if (wager.status === 'voided' || wager.status === 'rejected') return 'voided'
  if (wager.status === 'manual_review') return 'manual_review'
  return winnerId ? 'settlement_pending' : 'pending_result'
}
