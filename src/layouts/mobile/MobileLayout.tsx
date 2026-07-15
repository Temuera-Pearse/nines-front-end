import React from 'react'
import { CompactRaceInfo } from '../../components/NewLayout/CompactRaceInfo'
import { RaceTrack } from '../../components/RaceTrack/RaceTrack'
import { ResultsPanel } from '../../components/ResultsPanel/ResultsPanel'
import type {
  ResultsPanelProps,
  Standing,
} from '../../components/ResultsPanel/ResultsPanel'
import { useRaceHeaderTiming } from '../../state/useRaceHeaderTiming'
import { MobileSelectionSheet } from './MobileSelectionSheet'
import './MobileLayout.css'

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
      <div className="nines-mobile-layout__status">
        <CompactRaceInfo />
      </div>

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

      <MobileSelectionSheet timing={timing} />
    </div>
  )
}
