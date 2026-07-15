import React from 'react'
import { useAppAuth } from '../../auth/AppAuthProvider'
import { BettingArea } from '../../components/BettingArea/BettingArea'
import { BottomWidgets } from '../../components/NewLayout/BottomWidgets'
import { CompactRaceInfo } from '../../components/NewLayout/CompactRaceInfo'
import { OnTrackEventsCard } from '../../components/NewLayout/OnTrackEventsCard'
import { RaceTrack } from '../../components/RaceTrack/RaceTrack'
import { ResultsPanel } from '../../components/ResultsPanel/ResultsPanel'
import type {
  ResultsPanelProps,
  Standing,
} from '../../components/ResultsPanel/ResultsPanel'

interface DesktopLayoutProps {
  showFinishAnimation: boolean
  showResultsPanel: boolean
  resultsWinner: ResultsPanelProps['winner']
  resultsStandings: Standing[]
  resultsCountdownSeconds: number
  onCompleteResultsPhase: () => void
}

export const DesktopLayout: React.FC<DesktopLayoutProps> = ({
  showFinishAnimation,
  showResultsPanel,
  resultsWinner,
  resultsStandings,
  resultsCountdownSeconds,
  onCompleteResultsPhase,
}) => {
  const { hasConfirmedPlayer } = useAppAuth()

  return (
    <div
      className={`nines-race-layout ${
        hasConfirmedPlayer
          ? 'nines-race-layout--player'
          : 'nines-race-layout--guest'
      }`}
    >
      <div className="nines-race-track-panel">
        <RaceTrack showFinishAnimation={showFinishAnimation} />
      </div>

      <div className="nines-race-mobile-status">
        <CompactRaceInfo />
      </div>

      <div className="nines-race-betting">
        <BettingArea />
      </div>

      {showResultsPanel && (
        <div className="nines-race-results-region">
          <ResultsPanel
            isVisible={showResultsPanel}
            winner={resultsWinner}
            standings={resultsStandings}
            nextRaceStartsInSeconds={resultsCountdownSeconds}
            onComplete={onCompleteResultsPhase}
          />
        </div>
      )}

      <div className="nines-race-events">
        <OnTrackEventsCard />
      </div>

      <div className="nines-race-bottom-widgets">
        <BottomWidgets />
      </div>
    </div>
  )
}
