import { useEffect, useMemo, useState } from 'react'
import { useAppAuth } from '../../auth/AppAuthProvider'
import { useBetStore } from '../../state/betStore'
import { useRaceStore } from '../../state/raceStore'
import { getHorseIdentity } from '../../utils/raceHelpers'
import { BettingEntry } from './types'

const HOUSE_PCT = 0.15

export const QUICK_BETS = [5, 10, 25, 50, 100]

export function useBettingAreaModel() {
  const { isAuthenticated, login, signup } = useAppAuth()
  const { horses, status, winnerBannerHorseId, placements } = useRaceStore()
  const { selectedHorse, amount, placeBet, setAmount, setSelectedHorse } =
    useBetStore()
  const [placing, setPlacing] = useState(false)
  const [message, setMessage] = useState('')

  const entries = useMemo<BettingEntry[]>(() => {
    const fallbackRows = Array.from({ length: 10 }, (_, index) => ({
      id: `horse-${index}`,
      position: 0,
    }))
    const baseRows = (horses.length ? horses : fallbackRows).slice()
    const rows =
      placements.length > 0
        ? (() => {
            const byId = new Map(baseRows.map((horse) => [horse.id, horse]))
            const ordered = placements
              .map((id) => byId.get(id))
              .filter((horse): horse is (typeof baseRows)[number] =>
                Boolean(horse),
              )
            const seen = new Set(ordered.map((horse) => horse.id))
            return [...ordered, ...baseRows.filter((horse) => !seen.has(horse.id))]
          })()
        : baseRows.sort((left, right) => {
            if (winnerBannerHorseId) {
              if (left.id === winnerBannerHorseId && right.id !== winnerBannerHorseId) {
                return -1
              }
              if (right.id === winnerBannerHorseId && left.id !== winnerBannerHorseId) {
                return 1
              }
            }
            if (right.position !== left.position) {
              return right.position - left.position
            }
            return left.id.localeCompare(right.id)
          })

    return rows.map((horse, index) => {
      return {
        id: horse.id,
        rank: index + 1,
        positionMeters: horse.position,
        poolAmount: null,
        poolPercentage: 0,
        payoutMultiplier: 0,
        identity: getHorseIdentity(horse.id),
      }
    })
  }, [horses, placements, winnerBannerHorseId])

  useEffect(() => {
    if (selectedHorse && !entries.some((entry) => entry.id === selectedHorse)) {
      setSelectedHorse(null)
    }
  }, [entries, selectedHorse, setSelectedHorse])

  const selectedEntry =
    entries.find((entry) => entry.id === selectedHorse) ?? null
  const totalPool = entries.reduce(
    (sum, entry) => sum + (entry.poolAmount ?? 0),
    0,
  )
  const netPool = Math.round(totalPool * (1 - HOUSE_PCT))
  const estimatedReturn =
    selectedEntry && selectedEntry.poolAmount && amount > 0
      ? ((amount / selectedEntry.poolAmount) * netPool).toFixed(2)
      : '0.00'

  const handlePlaceBet = async () => {
    setMessage('')
    setPlacing(true)
    try {
      await placeBet()
      setMessage('Bet placed successfully')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to place bet')
    } finally {
      setPlacing(false)
    }
  }

  return {
    amount,
    entries,
    estimatedReturn,
    isAuthenticated,
    message,
    placing,
    quickBets: QUICK_BETS,
    selectedEntry,
    selectedHorse,
    totalPool,
    bettingOpen: status === 'betsOpen',
    setAmount,
    setSelectedHorse,
    login,
    signup,
    handlePlaceBet,
  }
}
