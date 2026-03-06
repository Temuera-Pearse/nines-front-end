import { fetchJson } from './client'

export interface PlaceBetRequest {
  raceId: string
  horseId: string
  amount: number
}

// Keep this loose until the backend contract is finalized.
export type PlaceBetResponse = unknown

export async function placeBet(
  request: PlaceBetRequest,
): Promise<PlaceBetResponse> {
  return fetchJson<PlaceBetResponse>('/bets', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}
