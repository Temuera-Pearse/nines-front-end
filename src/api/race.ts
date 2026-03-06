import { fetchJson } from './client'

export interface RaceConfigResponse {
  keyId?: string
  publicKey?: string
  keyframeIntervalTicks?: number
  [key: string]: unknown
}

export interface RaceCurrentResponse {
  raceId: string
  startTime?: string
  endTime?: string
  finishLine?: number
  config?: Record<string, unknown>
  [key: string]: unknown
}

export interface RaceResultsResponse {
  raceId: string
  winner?: string
  placements?: string[]
  [key: string]: unknown
}

export async function getRaceConfig(): Promise<RaceConfigResponse> {
  return fetchJson<RaceConfigResponse>('/race/config', { method: 'GET' })
}

export async function getRaceCurrent(): Promise<RaceCurrentResponse> {
  return fetchJson<RaceCurrentResponse>('/race/current', { method: 'GET' })
}

export async function getRacePrevious(): Promise<unknown> {
  return fetchJson<unknown>('/race/previous', { method: 'GET' })
}

export async function getRaceHistory(): Promise<unknown> {
  return fetchJson<unknown>('/race/history', { method: 'GET' })
}

export async function getRaceResults(
  raceId: string,
): Promise<RaceResultsResponse> {
  return fetchJson<RaceResultsResponse>(
    `/race/results/${encodeURIComponent(raceId)}`,
    {
      method: 'GET',
    },
  )
}

export async function getRaceTimeline(raceId: string): Promise<unknown> {
  return fetchJson<unknown>(`/race/timeline/${encodeURIComponent(raceId)}`, {
    method: 'GET',
  })
}

export async function getRaceTicksFinal(raceId: string): Promise<unknown> {
  return fetchJson<unknown>(`/race/ticks-final/${encodeURIComponent(raceId)}`, {
    method: 'GET',
  })
}
