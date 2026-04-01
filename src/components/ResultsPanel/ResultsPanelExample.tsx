import React, { useMemo, useState } from 'react'
import { ResultsPanel, type Standing } from './ResultsPanel'

type ResultsPanelExampleProps = {
  isRaceFinished: boolean
  winner: {
    horseNumber: number
    horseName: string
    odds: string
    payout: string
  } | null
  standings: Standing[]
  nextRaceStartsInSeconds: number
}

export const ResultsPanelExample: React.FC<ResultsPanelExampleProps> = ({
  isRaceFinished,
  winner,
  standings,
  nextRaceStartsInSeconds,
}) => {
  const [panelComplete, setPanelComplete] = useState(false)

  const visible = useMemo(
    () => isRaceFinished && !panelComplete,
    [isRaceFinished, panelComplete],
  )

  return (
    <ResultsPanel
      isVisible={visible}
      winner={winner}
      standings={standings}
      nextRaceStartsInSeconds={nextRaceStartsInSeconds}
      onComplete={() => setPanelComplete(true)}
    />
  )
}
