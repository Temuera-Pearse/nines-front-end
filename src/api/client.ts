import { API_BASE_URL, API_TOKEN } from '../config/runtime'

export class ApiError extends Error {
  status: number
  body: unknown

  constructor(message: string, status: number, body: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

function isAbsoluteUrl(url: string): boolean {
  return /^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(url)
}

function resolveUrl(path: string): string {
  if (isAbsoluteUrl(path)) return path

  const base = API_BASE_URL
  if (!base) return path

  const baseClean = base.endsWith('/') ? base.slice(0, -1) : base
  const pathClean = path.startsWith('/') ? path : `/${path}`
  return `${baseClean}${pathClean}`
}

export async function fetchJson<T>(
  path: string,
  init: RequestInit & { parseJson?: boolean } = {},
): Promise<T> {
  const { parseJson = true, headers, ...rest } = init

  const res = await fetch(resolveUrl(path), {
    ...rest,
    headers: {
      Accept: 'application/json',
      ...(parseJson ? { 'Content-Type': 'application/json' } : {}),
      ...(API_TOKEN ? { 'x-api-token': API_TOKEN } : {}),
      ...(headers ?? {}),
    },
  })

  const contentType = res.headers.get('content-type') ?? ''
  const isJson = contentType.includes('application/json')

  const body = parseJson
    ? isJson
      ? await res.json().catch(() => null)
      : await res.text().catch(() => null)
    : null

  if (!res.ok) {
    const message =
      typeof body === 'string' && body ? body : `Request failed (${res.status})`
    throw new ApiError(message, res.status, body)
  }

  return body as T
}
