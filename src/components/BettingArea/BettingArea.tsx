import React from 'react'
import './BettingArea.css'
import { BettingLeaderboard } from './BettingLeaderboard'
import { useBettingAreaModel } from './useBettingAreaModel'

export const BettingArea: React.FC = React.memo(function BettingArea() {
  const model = useBettingAreaModel()

  return (
    <div className="betting-area">
      <BettingLeaderboard
        amount={model.amount}
        bettingOpen={model.bettingOpen}
        entries={model.entries}
        estimatedReturn={model.estimatedReturn}
        isAuthenticated={model.isAuthenticated}
        message={model.message}
        placing={model.placing}
        quickBets={model.quickBets}
        selectedEntry={model.selectedEntry}
        selectedHorseId={model.selectedHorse}
        onAmountChange={model.setAmount}
        onLogin={() => {
          void model.login()
        }}
        onPlaceBet={() => {
          void model.handlePlaceBet()
        }}
        onRegister={() => {
          void model.signup()
        }}
        onSelectHorse={model.setSelectedHorse}
      />
    </div>
  )
})
