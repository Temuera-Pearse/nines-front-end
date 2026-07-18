import { fetchJson } from './client'

export interface RaceConfigResponse {
  protoVer?: number
  keyId?: string
  publicKey?: string
  keyframeIntervalTicks?: number
  [key: string]: unknown
}

export interface RaceCurrentResponse {
  raceRef: string | null
  startTime?: string
  endTime?: string
  finishLine?: number
  config?: Record<string, unknown>
  [key: string]: unknown
}

export interface RaceResultsResponse {
  raceRef: string
  timestampUtc?: string
  winnerId?: string
  finishOrder?: string[]
  finishTimesMs?: Record<string, number>
  finishTickIndex?: Record<string, number>
  presentation?: {
    bannerVisibleUntilUtc?: string
    resultsVisibleUntilUtc?: string
  }
  winner?: string
  placements?: string[]
  [key: string]: unknown
}

export interface RaceFinalTicksResponse {
  ticksFinal: Array<{
    tickIndex: number
    positions: number[]
  }>
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
  raceRef: string,
): Promise<RaceResultsResponse> {
  return fetchJson<RaceResultsResponse>(
    `/race/results/${encodeURIComponent(raceRef)}`,
    {
      method: 'GET',
    },
  )
}

export async function getRaceTimeline(raceRef: string): Promise<unknown> {
  return fetchJson<unknown>(`/race/timeline/${encodeURIComponent(raceRef)}`, {
    method: 'GET',
  })
}

export async function getRaceTicksFinal(
  raceRef: string,
): Promise<RaceFinalTicksResponse> {
  return fetchJson<RaceFinalTicksResponse>(
    `/race/ticks-final/${encodeURIComponent(raceRef)}`,
    {
      method: 'GET',
    },
  )
}
