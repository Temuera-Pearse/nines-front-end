import React from 'react'
import { RaceTrack } from '../../components/RaceTrack/RaceTrack'
import { ResultsPanel } from '../../components/ResultsPanel/ResultsPanel'
import type {
  ResultsPanelProps,
  Standing,
} from '../../components/ResultsPanel/ResultsPanel'
import { useRaceHeaderTiming } from '../../state/useRaceHeaderTiming'
import { FRONTEND_AUTH_ENABLED, PUBLIC_VIEWER_MODE } from '../../config/features'
import { MobileBottomNav } from './MobileBottomNav'
import './MobileLayout.css'
import { PlayerGameplayPanel } from '../../components/Gameplay/PlayerGameplayPanel'

interface MobileLayoutProps {
  showFinishAnimation: boolean
  showResultsPanel: boolean
  resultsWinner: ResultsPanelProps['winner']
  resultsStandings: Standing[]
  resultsCountdownSeconds: number
  onCompleteResultsPhase: () => void
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({
  showFinishAnimation,
  showResultsPanel,
  resultsWinner,
  resultsStandings,
  resultsCountdownSeconds,
  onCompleteResultsPhase,
}) => {
  const timing = useRaceHeaderTiming()
  const isRaceFocus =
    timing.key === 'running' ||
    timing.key === 'settlingBets' ||
    timing.key === 'resetting'

  return (
    <div
      className={`nines-mobile-layout${isRaceFocus ? ' nines-mobile-layout--race-focus' : ' nines-mobile-layout--selection-focus'}`}
    >
      <main className="nines-mobile-layout__stage" aria-label="Live race">
        <div className="nines-mobile-layout__track">
          <RaceTrack showFinishAnimation={showFinishAnimation} />
        </div>

        {showResultsPanel && (
          <div className="nines-mobile-layout__results">
            <ResultsPanel
              isVisible={showResultsPanel}
              winner={resultsWinner}
              standings={resultsStandings}
              nextRaceStartsInSeconds={resultsCountdownSeconds}
              onComplete={onCompleteResultsPhase}
            />
          </div>
        )}
      </main>

      <div className="nines-mobile-layout__gameplay">
        <PlayerGameplayPanel />
      </div>

      {FRONTEND_AUTH_ENABLED && !PUBLIC_VIEWER_MODE ? (
        <MobileBottomNav />
      ) : null}
    </div>
  )
}
