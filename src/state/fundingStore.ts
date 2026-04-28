import { create } from 'zustand'

type FundingTab = 'overview' | 'add-funds' | 'settings'

interface FundingState {
  activeTab: FundingTab
  // Alpha-only local preview state. nines-financial is the durable source for
  // USDC balances; do not treat this value as financial truth.
  balanceUsdc: number
  depositAddress: string
  networkLabel: string
  setActiveTab: (tab: FundingTab) => void
  resetToAddFunds: () => void
  addTestFunds: (amount: number) => void
}

export const useFundingStore = create<FundingState>((set) => ({
  activeTab: 'add-funds',
  balanceUsdc: 0,
  depositAddress: '0x71A2Ff4E2B6aD4c7d4a0F3A0b4E2C6F9A2d0E7b1',
  networkLabel: 'Base (single network alpha)',

  setActiveTab: (tab) => set({ activeTab: tab }),

  resetToAddFunds: () => set({ activeTab: 'add-funds' }),

  addTestFunds: (amount) =>
    set((state) => ({
      balanceUsdc: Number((state.balanceUsdc + Math.max(0, amount)).toFixed(2)),
    })),
}))

export function formatUsdcBalance(amount: number): string {
  return `${amount.toFixed(2)} USDC`
}
