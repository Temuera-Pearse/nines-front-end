import { create } from 'zustand'

interface Horse {
  id: string
  position: number
}

export interface LastResult {
  raceId: string
  winner: string
  placements: string[]
  raceEndUtc: string
}

interface RaceState {
  raceId: string | null
  status: 'idle' | 'betsOpen' | 'betsClosed' | 'running' | 'finished'
  /** Stable ordering for array-based tick payloads */
  horseOrder: string[]
  horses: Horse[]
  placements: string[]
  winner: string | null
  betsOpenAtUtc: string
  betsCloseAtUtc: string
  raceStartUtc: string
  raceEndUtc: string
  /** Persists across reset() — used by ResultsPage */
  lastResult: LastResult | null

  // Actions
  setRaceId: (id: string) => void
  setStatus: (status: RaceState['status']) => void
  setHorseOrder: (order: string[]) => void
  setHorses: (horses: Horse[]) => void
  updatePositions: (positions: Record<string, number>) => void
  setWinner: (winner: string, placements: string[]) => void
  setBetsOpenAtUtc: (time: string) => void
  setBetsCloseAtUtc: (time: string) => void
  setRaceStartUtc: (time: string) => void
  setRaceEndUtc: (time: string) => void
  reset: () => void
}

const initialState = {
  raceId: null,
  status: 'idle' as const,
  horseOrder: [] as string[],
  horses: [],
  placements: [],
  winner: null,
  betsOpenAtUtc: '',
  betsCloseAtUtc: '',
  raceStartUtc: '',
  raceEndUtc: '',
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

  // reset() clears live race state but PRESERVES lastResult for the results page
  reset: () =>
    set((state) => ({ ...initialState, lastResult: state.lastResult })),
}))
