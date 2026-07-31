import type { NinesApiClient } from '../../api/ninesApiClient'
import { invalidApiResponse } from '../../api/apiError'
import { parseKycProfile, type KycProfile } from '../domain/KycProfile'

export async function getKycProfile(
  client: NinesApiClient,
  signal?: AbortSignal,
): Promise<KycProfile> {
  const response = await client.request<unknown>('/v1/me/kyc', { signal })
  try {
    return parseKycProfile(response.data)
  } catch {
    throw invalidApiResponse(response.correlationId)
  }
}
