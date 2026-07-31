import type { NinesApiClient } from '../../api/ninesApiClient'
import { invalidApiResponse } from '../../api/apiError'
import { parseCurrentPlayer, type CurrentPlayer } from '../domain/CurrentPlayer'

export async function getCurrentPlayer(
  client: NinesApiClient,
  signal?: AbortSignal,
): Promise<CurrentPlayer> {
  const response = await client.request<unknown>('/v1/me', { signal })
  try {
    return parseCurrentPlayer(response.data)
  } catch {
    throw invalidApiResponse(response.correlationId)
  }
}
