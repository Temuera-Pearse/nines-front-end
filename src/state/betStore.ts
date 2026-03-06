import { create } from 'zustand'
import { placeBet as placeBetApi } from '../api/bets'
import { useRaceStore } from './raceStore'

interface BetState {
  selectedHorse: string | null
  amount: number

  // Actions
  setSelectedHorse: (horseId: string | null) => void
  setAmount: (amount: number) => void
  placeBet: () => Promise<void>
  reset: () => void
}

export const useBetStore = create<BetState>((set, get) => ({
  selectedHorse: null,
  amount: 0,

  setSelectedHorse: (horseId) => set({ selectedHorse: horseId }),

  setAmount: (amount) => set({ amount: Math.max(0, amount) }),

  placeBet: async () => {
    const { selectedHorse, amount } = get()
    const { raceId } = useRaceStore.getState()

    if (!raceId) throw new Error('No active race')
    if (!selectedHorse) throw new Error('No horse selected')
    if (amount <= 0) throw new Error('Bet amount must be greater than 0')

    await placeBetApi({
      raceId,
      horseId: selectedHorse,
      amount,
    })
  },

  reset: () => set({ selectedHorse: null, amount: 0 }),
}))
