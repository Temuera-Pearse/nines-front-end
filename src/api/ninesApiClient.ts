import { NinesApiError, parseApiError } from './apiError'
import { createRequestId } from './requestCorrelation'

export type ApiRequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  signal?: AbortSignal
  idempotencyKey?: string
}

export interface ApiResponse<T> {
  data: T
  correlationId: string | null
}

export interface NinesApiClient {
  request<T>(
    path: string,
    options?: ApiRequestOptions,
  ): Promise<ApiResponse<T>>
}

type TokenProvider = () => Promise<string | null>

function normaliseBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim()
  if (!trimmed) throw new Error('VITE_NINES_API_URL is required')
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed
}

async function readJsonSafely(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.toLowerCase().includes('application/json')) return null
  try {
    return await response.json()
  } catch {
    return null
  }
}

export function createNinesApiClient(input: {
  baseUrl: string
  getAccessToken: TokenProvider
  fetchImpl?: typeof fetch
}): NinesApiClient {
  const baseUrl = normaliseBaseUrl(input.baseUrl)
  const fetchImpl = input.fetchImpl ?? fetch

  return {
    async request<T>(
      path: string,
      options: ApiRequestOptions = {},
    ): Promise<ApiResponse<T>> {
      let accessToken: string | null
      try {
        accessToken = await input.getAccessToken()
      } catch {
        throw new NinesApiError({
          status: 401,
          code: 'TOKEN_UNAVAILABLE',
          message: 'Your session could not be restored',
        })
      }
      if (!accessToken) {
        throw new NinesApiError({
          status: 401,
          code: 'TOKEN_UNAVAILABLE',
          message: 'Sign in is required',
        })
      }

      const headers = new Headers({
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'X-Correlation-Id': createRequestId(),
      })
      if (options.body !== undefined) {
        headers.set('Content-Type', 'application/json')
      }
      if (options.idempotencyKey) {
        headers.set('Idempotency-Key', options.idempotencyKey)
      }

      let response: Response
      try {
        response = await fetchImpl(`${baseUrl}${path}`, {
          method: options.method ?? 'GET',
          headers,
          body:
            options.body === undefined
              ? undefined
              : JSON.stringify(options.body),
          signal: options.signal,
        })
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw error
        }
        throw new NinesApiError({
          status: 0,
          code: 'NETWORK_ERROR',
          message: 'The Nines service could not be reached',
        })
      }

      const correlationId = response.headers.get('x-correlation-id')
      const payload = await readJsonSafely(response)
      if (!response.ok) {
        throw parseApiError(response.status, payload, correlationId)
      }
      if (payload === null) {
        throw new NinesApiError({
          status: response.status,
          code: 'INVALID_RESPONSE',
          message: 'The Nines service returned an invalid response',
          correlationId,
        })
      }

      return {
        data: payload as T,
        correlationId,
      }
    },
  }
}
