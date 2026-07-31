import { usePlayerAccount } from '../PlayerAccountProvider'

export function useCurrentPlayer() {
  const { player, refreshPlayer } = usePlayerAccount()
  return { ...player, refresh: refreshPlayer }
}
