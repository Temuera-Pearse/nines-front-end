import { fetchJson } from './client'
import type { FinancialCurrency, MinorUnitString } from './financialContracts'

export interface PlaceBetRequest {
  raceId: string
  selectionId: string
  stakeMinor: MinorUnitString
  currency: FinancialCurrency
}

// Alpha bridge: nines-financial owns the durable reserve-stake command. This
// front-end DTO already uses minor-unit strings so the backend adapter can be
// replaced without changing UI state.
export type PlaceBetResponse = unknown

export async function placeBet(
  request: PlaceBetRequest,
): Promise<PlaceBetResponse> {
  return fetchJson<PlaceBetResponse>('/bets', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}
