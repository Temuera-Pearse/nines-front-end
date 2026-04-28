import React from 'react'
import { BettingPanel } from '../BettingArea/BettingPanel'
import { useBettingAreaModel } from '../BettingArea/useBettingAreaModel'

export const ParimutuelPanel: React.FC = () => {
  const model = useBettingAreaModel()

  return (
    <BettingPanel
      amount={model.amount}
      bettingOpen={model.bettingOpen}
      estimatedReturn={model.estimatedReturn}
      message={model.message}
      placing={model.placing}
      quickBets={model.quickBets}
      selectedEntry={model.selectedEntry}
      totalPool={model.totalPool}
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
    />
  )
}
