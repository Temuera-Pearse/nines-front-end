import { create } from 'zustand'

interface Horse {
  id: string
  position: number
}

export enum RaceStatus {
  IDLE = 'idle',
  BETS_OPEN = 'betsOpen',
  BETS_CLOSED = 'betsClosed',
  RUNNING = 'running',
  FINISHED = 'finished',
  RESULTS = 'results',
}

export interface BackendRaceResult {
  horse: number
  position: number
}

export interface RaceFinishPresentation {
  bannerVisibleUntilUtc?: string
  resultsVisibleUntilUtc?: string
}

export interface RaceWinnerDeclaredPayload {
  raceId?: string
  timestampUtc?: string
  winnerId?: string
  finishOrder?: string[]
  finishTimesMs?: Record<string, number>
  finishTickIndex?: Record<string, number>
  presentation?: Pick<
    RaceFinishPresentation,
    'bannerVisibleUntilUtc' | 'resultsVisibleUntilUtc'
  >
}

export interface RaceFinishPayload {
  raceId?: string
  timestampUtc?: string
  results?: BackendRaceResult[]
  winnerId?: string
  finishOrder?: string[]
  finishTimesMs?: Record<string, number>
  finishTickIndex?: Record<string, number>
  presentation?: RaceFinishPresentation
}

export interface RaceEventRecord {
  eventId: string
  instanceId: string
  tickIndex: number
  affectedHorseIds: string[]
}

export interface HorseEffectState {
  horseId: string
  activeEventIds: string[]
  isStunned: boolean
  isRemoved: boolean
}

export interface LastResult {
  raceId: string
  winner: string
  placements: string[]
  raceEndUtc: string
}

function deriveResultsVisibleUntilUtc(raceEndUtc?: string): string {
  const minimumVisibleUntilMs = Date.now() + 8_000
  const raceEndMs = raceEndUtc ? new Date(raceEndUtc).getTime() : Date.now()

  if (!Number.isFinite(raceEndMs)) {
    return new Date(Date.now() + 12_000).toISOString()
  }

  const nextMinuteBoundaryMs = Math.ceil(raceEndMs / 60_000) * 60_000
  const boundaryDiffMs = nextMinuteBoundaryMs - raceEndMs

  if (boundaryDiffMs >= 10_000 && boundaryDiffMs <= 15_000) {
    return new Date(
      Math.max(nextMinuteBoundaryMs, minimumVisibleUntilMs),
    ).toISOString()
  }

  return new Date(
    Math.max(raceEndMs + 12_000, minimumVisibleUntilMs),
  ).toISOString()
}

function deriveBannerVisibleUntilUtc(raceEndUtc?: string): string {
  const raceEndMs = raceEndUtc ? new Date(raceEndUtc).getTime() : Date.now()
  if (!Number.isFinite(raceEndMs)) {
    return new Date(Date.now() + 3_400).toISOString()
  }
  return new Date(raceEndMs + 3_400).toISOString()
}

function normalizeBannerVisibleUntilUtc(value?: string, raceEndUtc?: string) {
  const minimumVisibleUntilMs = Date.now() + 2_200
  const rawMs = value ? new Date(value).getTime() : Number.NaN

  if (Number.isFinite(rawMs)) {
    return new Date(Math.max(rawMs, minimumVisibleUntilMs)).toISOString()
  }

  return new Date(
    Math.max(new Date(deriveBannerVisibleUntilUtc(raceEndUtc)).getTime(), minimumVisibleUntilMs),
  ).toISOString()
}

function normalizeResultsVisibleUntilUtc(value?: string, raceEndUtc?: string) {
  const minimumVisibleUntilMs = Date.now() + 8_000
  const rawMs = value ? new Date(value).getTime() : Number.NaN

  if (Number.isFinite(rawMs)) {
    return new Date(Math.max(rawMs, minimumVisibleUntilMs)).toISOString()
  }

  return new Date(
    Math.max(
      new Date(deriveResultsVisibleUntilUtc(raceEndUtc)).getTime(),
      minimumVisibleUntilMs,
    ),
  ).toISOString()
}

function resolveHorseId(horse: number, knownHorseIds: string[]): string {
  const directId = `horse-${horse}`
  if (knownHorseIds.includes(directId)) return directId

  const oneBasedId = `horse-${horse - 1}`
  if (knownHorseIds.includes(oneBasedId)) return oneBasedId

  return directId
}

function resultsToPlacements(
  results: BackendRaceResult[],
  knownHorseIds: string[],
): string[] {
  return [...results]
    .filter(
      (result) =>
        Number.isFinite(result.horse) && Number.isFinite(result.position),
    )
    .sort((left, right) => left.position - right.position)
    .map((result) => resolveHorseId(result.horse, knownHorseIds))
}

export interface RaceState {
  raceId: string | null
  status: RaceStatus
  /** Stable ordering for array-based tick payloads */
  horseOrder: string[]
  horses: Horse[]
  recentEvents: RaceEventRecord[]
  horseEffects: Record<string, HorseEffectState>
  placements: string[]
  winner: string | null
  winnerBannerHorseId: string | null
  betsOpenAtUtc: string
  betsCloseAtUtc: string
  raceStartUtc: string
  raceEndUtc: string
  interpolationEnabled: boolean
  backendResults: BackendRaceResult[]
  finishAnimationKey: number
  bannerVisibleUntilUtc: string
  resultsVisibleUntilUtc: string
  /** Persists across reset() — used by ResultsPage */
  lastResult: LastResult | null

  // Actions
  setRaceId: (id: string) => void
  setStatus: (status: RaceStatus) => void
  setHorseOrder: (order: string[]) => void
  setHorses: (horses: Horse[]) => void
  updatePositions: (positions: Record<string, number>) => void
  setWinner: (winner: string, placements: string[]) => void
  setBetsOpenAtUtc: (time: string) => void
  setBetsCloseAtUtc: (time: string) => void
  setRaceStartUtc: (time: string) => void
  setRaceEndUtc: (time: string) => void
  setInterpolationEnabled: (enabled: boolean) => void
  applyLiveTickDetails: (
    events?: RaceEventRecord[],
    effects?: HorseEffectState[],
  ) => void
  clearLiveRaceVisuals: () => void
  handleWinnerDeclared: (payload: RaceWinnerDeclaredPayload) => void
  handleRaceFinish: (payload: RaceFinishPayload) => void
  enterResultsPhase: () => void
  completeResultsPhase: () => void
  reset: () => void
}

const initialState = {
  raceId: null,
  status: RaceStatus.IDLE,
  horseOrder: [] as string[],
  horses: [],
  recentEvents: [] as RaceEventRecord[],
  horseEffects: {} as Record<string, HorseEffectState>,
  placements: [],
  winner: null,
  winnerBannerHorseId: null,
  betsOpenAtUtc: '',
  betsCloseAtUtc: '',
  raceStartUtc: '',
  raceEndUtc: '',
  interpolationEnabled: true,
  backendResults: [] as BackendRaceResult[],
  finishAnimationKey: 0,
  bannerVisibleUntilUtc: '',
  resultsVisibleUntilUtc: '',
  lastResult: null as LastResult | null,
}

export const useRaceStore = create<RaceState>((set, get) => ({
  ...initialState,

  setRaceId: (id) => set({ raceId: id }),

  setStatus: (status) => set({ status }),

  setHorseOrder: (horseOrder) => set({ horseOrder }),

  setHorses: (horses) => set({ horses }),

  updatePositions: (positions) =>
    set((state) => ({
      horses: state.horses.map((horse) => ({
        ...horse,
        position: positions[horse.id] ?? horse.position,
      })),
    })),

  setWinner: (winner, placements) => {
    console.log(
      '[RaceStore] setWinner called with winner:',
      winner,
      'placements:',
      placements,
    )
    const { raceId, raceEndUtc } = get()
    set({
      winner,
      placements,
      // Snapshot into lastResult immediately so it survives reset()
      lastResult: {
        raceId: raceId ?? '',
        winner,
        placements,
        raceEndUtc,
      },
    })
  },

  setBetsOpenAtUtc: (time) => set({ betsOpenAtUtc: time }),

  setBetsCloseAtUtc: (time) => set({ betsCloseAtUtc: time }),

  setRaceStartUtc: (time) => set({ raceStartUtc: time }),

  setRaceEndUtc: (time) => set({ raceEndUtc: time }),

  setInterpolationEnabled: (enabled) => set({ interpolationEnabled: enabled }),

  applyLiveTickDetails: (events, effects) =>
    set((state) => {
      const nextState: Partial<RaceState> = {}

      if (Array.isArray(effects)) {
        const nextEffects: Record<string, HorseEffectState> = {}
        for (const effect of effects) {
          if (!effect?.horseId) continue
          nextEffects[effect.horseId] = {
            horseId: effect.horseId,
            activeEventIds: Array.isArray(effect.activeEventIds)
              ? effect.activeEventIds.filter(Boolean)
              : [],
            isStunned: effect.isStunned === true,
            isRemoved: effect.isRemoved === true,
          }
        }
        nextState.horseEffects = nextEffects
      }

      if (Array.isArray(events) && events.length > 0) {
        const seenInstanceIds = new Set(
          state.recentEvents.map((event) => event.instanceId),
        )
        const additions = events
          .filter(
            (event) =>
              event?.instanceId && !seenInstanceIds.has(event.instanceId),
          )
          .map((event) => ({
            eventId: event.eventId,
            instanceId: event.instanceId,
            tickIndex: event.tickIndex,
            affectedHorseIds: Array.isArray(event.affectedHorseIds)
              ? event.affectedHorseIds.filter(Boolean)
              : [],
          }))

        if (additions.length > 0) {
          nextState.recentEvents = [...state.recentEvents, ...additions].slice(
            -12,
          )
        }
      }

      return Object.keys(nextState).length > 0 ? nextState : state
    }),

  clearLiveRaceVisuals: () => set({ recentEvents: [], horseEffects: {} }),

  handleWinnerDeclared: (payload) => {
    const state = get()
    const winnerBannerHorseId = payload.winnerId ?? state.winnerBannerHorseId
    const raceId = payload.raceId ?? state.raceId ?? ''
    const bannerVisibleUntilUtc = normalizeBannerVisibleUntilUtc(
      payload.presentation?.bannerVisibleUntilUtc,
      payload.timestampUtc,
    )
    const resultsVisibleUntilUtc = normalizeResultsVisibleUntilUtc(
      payload.presentation?.resultsVisibleUntilUtc,
      payload.timestampUtc,
    )

    set({
      raceId,
      winnerBannerHorseId,
      bannerVisibleUntilUtc,
      resultsVisibleUntilUtc,
    })
  },

  handleRaceFinish: (payload) => {
    const state = get()
    const knownHorseIds =
      state.horseOrder.length > 0
        ? state.horseOrder
        : state.horses.map((horse) => horse.id)
    const backendResults = Array.isArray(payload.results)
      ? [...payload.results].sort(
          (left, right) => left.position - right.position,
        )
      : []

    const placements =
      Array.isArray(payload.finishOrder) && payload.finishOrder.length > 0
        ? payload.finishOrder
        : resultsToPlacements(backendResults, knownHorseIds)

    const winner = payload.winnerId ?? placements[0] ?? null
    const raceId = payload.raceId ?? state.raceId ?? ''
    const raceEndUtc = payload.timestampUtc ?? state.raceEndUtc
    const bannerVisibleUntilUtc = normalizeBannerVisibleUntilUtc(
      payload.presentation?.bannerVisibleUntilUtc,
      raceEndUtc,
    )
    const resultsVisibleUntilUtc = normalizeResultsVisibleUntilUtc(
      payload.presentation?.resultsVisibleUntilUtc,
      raceEndUtc,
    )

    set({
      raceId,
      raceEndUtc,
      status: RaceStatus.FINISHED,
      interpolationEnabled: true,
      horseEffects: {},
      backendResults,
      finishAnimationKey: state.finishAnimationKey + 1,
      bannerVisibleUntilUtc,
      resultsVisibleUntilUtc,
      winner,
      winnerBannerHorseId: winner,
      placements,
      lastResult: winner
        ? {
            raceId,
            winner,
            placements,
            raceEndUtc,
          }
        : state.lastResult,
    })
  },

  enterResultsPhase: () =>
    set((state) => {
      if (state.status !== RaceStatus.FINISHED) return state
      return { status: RaceStatus.RESULTS }
    }),

  completeResultsPhase: () => {
    const state = get()
    if (
      state.status !== RaceStatus.RESULTS &&
      state.status !== RaceStatus.FINISHED
    ) {
      return
    }

    set({
      raceId: state.raceId,
      status: RaceStatus.IDLE,
      horseOrder: state.horseOrder,
      horses: state.horses.map((horse) => ({ ...horse, position: 0 })),
      recentEvents: [],
      horseEffects: {},
      placements: [],
      winner: null,
      winnerBannerHorseId: null,
      betsOpenAtUtc: '',
      betsCloseAtUtc: '',
      raceStartUtc: '',
      raceEndUtc: '',
      interpolationEnabled: true,
      backendResults: [],
      finishAnimationKey: state.finishAnimationKey,
      bannerVisibleUntilUtc: '',
      resultsVisibleUntilUtc: '',
      lastResult: state.lastResult,
    })
  },

  // reset() clears live race state but PRESERVES lastResult for the results page
  reset: () =>
    set((state) => ({ ...initialState, lastResult: state.lastResult })),
}))
