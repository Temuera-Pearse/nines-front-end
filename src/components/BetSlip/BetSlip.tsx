import React from 'react'
import { useBetStore } from '../../state/betStore'
import { useRaceStore } from '../../state/raceStore'
import { getHorseName, getHorseColor } from '../../utils/raceHelpers'
import { Button } from '../UI/Button'
import { Card } from '../UI/Card'

export const BetSlip: React.FC = () => {
  const { selectedHorse, amount, setAmount, placeBet, reset } = useBetStore()
  const { horses, status } = useRaceStore()

  const isBettingDisabled = status !== 'betsOpen'

  const handlePlaceBet = async () => {
    if (!selectedHorse || amount <= 0) {
      alert('Please select a horse and enter an amount')
      return
    }

    try {
      await placeBet()
      alert(`Bet placed: $${amount} on ${getHorseName(selectedHorse)}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to place bet'
      alert(message)
    }
  }

  return (
    <Card title="Bet Slip" className="max-w-md">
      {selectedHorse ? (
        <div className="mb-4">
          <div className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg">
            <div
              className={`w-8 h-8 rounded ${getHorseColor(selectedHorse)}`}
            ></div>
            <div className="flex-1">
              <div className="font-semibold">{getHorseName(selectedHorse)}</div>
              <div className="text-sm text-gray-600">{selectedHorse}</div>
            </div>
            <button
              onClick={reset}
              className="text-red-600 hover:text-red-700"
              disabled={isBettingDisabled}
            >
              ✕
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-4 text-center text-gray-500">
          Select a horse to place a bet
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Bet Amount ($)
        </label>
        <input
          type="number"
          value={amount || ''}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter amount"
          min="0"
          step="10"
          disabled={isBettingDisabled}
        />
      </div>

      <div className="flex gap-2 mb-4">
        {[10, 50, 100, 500].map((preset) => (
          <button
            key={preset}
            onClick={() => setAmount(preset)}
            className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors disabled:opacity-50"
            disabled={isBettingDisabled}
          >
            ${preset}
          </button>
        ))}
      </div>

      <Button
        onClick={handlePlaceBet}
        disabled={isBettingDisabled || !selectedHorse || amount <= 0}
        variant="success"
        className="w-full"
      >
        {isBettingDisabled ? 'Betting Closed' : 'Place Bet'}
      </Button>

      {isBettingDisabled && (
        <div className="mt-3 text-sm text-center text-red-600">
          Betting is currently closed
        </div>
      )}
    </Card>
  )
}
