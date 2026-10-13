import type { NinesApiClient } from '../api/ninesApiClient'
import type { GameplayState, WagerResult } from './types'

export async function getGameplayState(
  client: NinesApiClient,
  raceRef: string | null,
  signal?: AbortSignal,
): Promise<GameplayState> {
  const query = raceRef ? `?raceRef=${encodeURIComponent(raceRef)}` : ''
  const { data } = await client.request<GameplayState>(`/v1/gameplay${query}`, { signal })
  return data
}

export async function submitWager(client: NinesApiClient, input: {
  raceRef: string
  selectionId: string
  stakeMinor: string
  idempotencyKey: string
}): Promise<WagerResult> {
  const { data } = await client.request<WagerResult>('/v1/wagers', {
    method: 'POST',
    idempotencyKey: input.idempotencyKey,
    body: { raceRef: input.raceRef, selectionId: input.selectionId,
      stakeMinor: input.stakeMinor },
  })
  return data
}
