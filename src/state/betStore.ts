import { create } from 'zustand'
import { placeBet as placeBetApi } from '../api/bets'
import { getDefaultHorseIds } from '../constants/raceParticipants'
import { useRaceStore } from './raceStore'

const USDC_MINOR_UNITS = 1_000_000

function toUsdcMinorUnitString(amount: number): string {
  return String(Math.round(amount * USDC_MINOR_UNITS))
}

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
    const { horses, raceRef } = useRaceStore.getState()

    if (!raceRef) throw new Error('No active race')
    if (!selectedHorse) throw new Error('No horse selected')
    const validSelectionIds =
      horses.length > 0 ? horses.map((horse) => horse.id) : getDefaultHorseIds()
    if (!validSelectionIds.includes(selectedHorse)) {
      throw new Error('Invalid horse selection')
    }
    if (amount <= 0) throw new Error('Bet amount must be greater than 0')

    await placeBetApi({
      raceRef,
      selectionId: selectedHorse,
      stakeMinor: toUsdcMinorUnitString(amount),
      currency: 'USDC',
    })
  },

  reset: () => set({ selectedHorse: null, amount: 0 }),
}))
