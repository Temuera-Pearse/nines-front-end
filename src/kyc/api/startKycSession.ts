import type { NinesApiClient } from '../../api/ninesApiClient'
import { invalidApiResponse } from '../../api/apiError'
import {
  parseStartedKycSession,
} from '../domain/KycProfile'
import type { StartedKycSession } from '../domain/KycSession'

export async function startKycSession(
  client: NinesApiClient,
  idempotencyKey: string,
  signal?: AbortSignal,
): Promise<StartedKycSession> {
  const response = await client.request<unknown>('/v1/me/kyc/sessions', {
    method: 'POST',
    body: {},
    idempotencyKey,
    signal,
  })
  try {
    return parseStartedKycSession(response.data)
  } catch {
    throw invalidApiResponse(response.correlationId)
  }
}
