import React, { Suspense } from 'react'
import { useAppAuth } from '../../auth/AppAuthProvider'
import { RaceTrack } from '../../components/RaceTrack/RaceTrack'
import { ResultsPanel } from '../../components/ResultsPanel/ResultsPanel'
import type {
  ResultsPanelProps,
  Standing,
} from '../../components/ResultsPanel/ResultsPanel'
import { useRaceHeaderTiming } from '../../state/useRaceHeaderTiming'
import { PUBLIC_VIEWER_MODE } from '../../config/features'
import './MobileLayout.css'

const PrivateCompactRaceInfo = !PUBLIC_VIEWER_MODE
  ? React.lazy(() =>
      import('../../components/NewLayout/CompactRaceInfo').then((module) => ({
        default: module.CompactRaceInfo,
      })),
    )
  : null

const PrivateMobileSelectionSheet = !PUBLIC_VIEWER_MODE
  ? React.lazy(() =>
      import('./MobileSelectionSheet').then((module) => ({
        default: module.MobileSelectionSheet,
      })),
    )
  : null

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
  const { hasConfirmedPlayer } = useAppAuth()
  const timing = useRaceHeaderTiming()
  const isRaceFocus =
    timing.key === 'running' ||
    timing.key === 'settlingBets' ||
    timing.key === 'resetting'

  return (
    <div
      className={`nines-mobile-layout${isRaceFocus ? ' nines-mobile-layout--race-focus' : ' nines-mobile-layout--selection-focus'}`}
    >
      {PrivateCompactRaceInfo && hasConfirmedPlayer && !PUBLIC_VIEWER_MODE ? (
        <div className="nines-mobile-layout__status">
          <Suspense fallback={null}>
            <PrivateCompactRaceInfo />
          </Suspense>
        </div>
      ) : null}

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

      {PrivateMobileSelectionSheet && hasConfirmedPlayer && !PUBLIC_VIEWER_MODE ? (
        <Suspense fallback={null}>
          <PrivateMobileSelectionSheet timing={timing} />
        </Suspense>
      ) : null}
    </div>
  )
}
