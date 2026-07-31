export type ApiErrorCategory =
  | 'authentication'
  | 'eligibility'
  | 'validation'
  | 'conflict'
  | 'dependency'
  | 'unexpected'

export interface SafeApiErrorPayload {
  code: string
  message: string
  correlationId: string | null
  reasonCodes: string[]
}

function categoryFor(status: number, code: string): ApiErrorCategory {
  if (status === 401) return 'authentication'
  if (status === 403) return 'eligibility'
  if (status === 409) return 'conflict'
  if (status === 400 || status === 422) return 'validation'
  if (status === 502 || status === 503 || status === 504) return 'dependency'
  if (code === 'KYC_SESSION_CREATION_FAILED') return 'dependency'
  return 'unexpected'
}

export class NinesApiError extends Error {
  readonly category: ApiErrorCategory
  readonly code: string
  readonly correlationId: string | null
  readonly reasonCodes: string[]
  readonly status: number

  constructor(input: {
    status: number
    code: string
    message: string
    correlationId?: string | null
    reasonCodes?: string[]
  }) {
    super(input.message)
    this.name = 'NinesApiError'
    this.status = input.status
    this.code = input.code
    this.correlationId = input.correlationId ?? null
    this.reasonCodes = input.reasonCodes ?? []
    this.category = categoryFor(input.status, input.code)
  }
}

function safeString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export function parseApiError(
  status: number,
  payload: unknown,
  responseCorrelationId: string | null,
): NinesApiError {
  const envelope =
    payload && typeof payload === 'object' && 'error' in payload
      ? (payload as { error?: unknown }).error
      : null
  const error =
    envelope && typeof envelope === 'object'
      ? (envelope as Record<string, unknown>)
      : {}
  const reasonCodes = Array.isArray(error.reasonCodes)
    ? error.reasonCodes.filter(
        (reasonCode): reasonCode is string => typeof reasonCode === 'string',
      )
    : []

  return new NinesApiError({
    status,
    code: safeString(error.code) ?? `HTTP_${status}`,
    message: safeString(error.message) ?? 'The request could not be completed',
    correlationId:
      safeString(error.correlationId) ?? responseCorrelationId ?? null,
    reasonCodes,
  })
}

export function invalidApiResponse(
  correlationId: string | null,
): NinesApiError {
  return new NinesApiError({
    status: 200,
    code: 'INVALID_RESPONSE',
    message: 'The Nines service returned an invalid response',
    correlationId,
  })
}

export function accountErrorMessage(error: unknown): string {
  if (!(error instanceof NinesApiError)) {
    return 'Something went wrong while loading your account.'
  }
  if (error.category === 'authentication') {
    return 'Your session has expired. Please sign in again.'
  }
  if (error.category === 'eligibility') {
    return 'This action is currently unavailable for your account.'
  }
  if (error.category === 'conflict') {
    return 'Your account state changed. Refreshing the latest details may help.'
  }
  if (error.category === 'dependency') {
    return 'Identity verification is temporarily unavailable.'
  }
  if (error.category === 'validation') {
    return 'The request could not be accepted.'
  }
  return 'Something went wrong while loading your account.'
}
