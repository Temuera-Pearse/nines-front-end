import React, { Suspense } from 'react'
import { useAppAuth } from '../../auth/AppAuthProvider'
import { LiveRaceLeaderboard } from '../../components/LiveRaceLeaderboard/LiveRaceLeaderboard'
import { BottomWidgets } from '../../components/NewLayout/BottomWidgets'
import { OnTrackEventsCard } from '../../components/NewLayout/OnTrackEventsCard'
import { RaceTrack } from '../../components/RaceTrack/RaceTrack'
import { ResultsPanel } from '../../components/ResultsPanel/ResultsPanel'
import { PUBLIC_VIEWER_MODE } from '../../config/features'
import type {
  ResultsPanelProps,
  Standing,
} from '../../components/ResultsPanel/ResultsPanel'

const PrivateBettingArea = !PUBLIC_VIEWER_MODE
  ? React.lazy(() =>
      import('../../components/BettingArea/BettingArea').then((module) => ({
        default: module.BettingArea,
      })),
    )
  : null

const PrivateCompactRaceInfo = !PUBLIC_VIEWER_MODE
  ? React.lazy(() =>
      import('../../components/NewLayout/CompactRaceInfo').then((module) => ({
        default: module.CompactRaceInfo,
      })),
    )
  : null

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

      {PrivateCompactRaceInfo && hasConfirmedPlayer && !PUBLIC_VIEWER_MODE ? (
        <div className="nines-race-mobile-status">
          <Suspense fallback={null}>
            <PrivateCompactRaceInfo />
          </Suspense>
        </div>
      ) : null}

      <div className="nines-race-betting">
        {PrivateBettingArea && hasConfirmedPlayer && !PUBLIC_VIEWER_MODE ? (
          <Suspense fallback={null}>
            <PrivateBettingArea />
          </Suspense>
        ) : (
          <LiveRaceLeaderboard />
        )}
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
