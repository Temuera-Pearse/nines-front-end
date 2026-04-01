import React, { useEffect, useRef, useState } from 'react'
import { useRaceStore } from '../../state/raceStore'
import { Horse } from '../Horse/Horse'
import {
  getHorseName,
  getHorseIdentity,
  VISUAL_FINISH_LINE_METERS,
  VISUAL_START_LINE_METERS,
  VISUAL_TRACK_LENGTH_METERS,
} from '../../utils/raceHelpers'
import { useWinnerPresentation } from '../../state/useWinnerPresentation'
import { WinnerBanner } from '../WinnerBanner/WinnerBanner'
import { selectCurrentEventHeadline } from '../../state/raceSelectors'
import raceTrackImg from '../../assets/raceTrack.jpg'
import './RaceTrack.css'

const START_LINE_PERCENT =
  (VISUAL_START_LINE_METERS / VISUAL_TRACK_LENGTH_METERS) * 100
const FINISH_LINE_PERCENT =
  (VISUAL_FINISH_LINE_METERS / VISUAL_TRACK_LENGTH_METERS) * 100

interface RaceTrackProps {
  showFinishAnimation: boolean
}

export const RaceTrack: React.FC<RaceTrackProps> = ({
  showFinishAnimation,
}) => {
  const {
    horses,
    status,
    winner,
    winnerBannerHorseId,
    lastResult,
    raceId,
    interpolationEnabled,
    horseEffects,
  } = useRaceStore()
  const bannerVisibleUntilUtc = useRaceStore(
    (state) => state.bannerVisibleUntilUtc,
  )
  const currentEventHeadline = useRaceStore(selectCurrentEventHeadline)
  const [showStartSignal, setShowStartSignal] = useState(false)
  const startSignalRef = useRef<string | null>(null)

  useEffect(() => {
    if (status !== 'running' || !raceId) {
      return
    }

    const signalKey = `${raceId}:${status}`
    if (startSignalRef.current === signalKey) {
      return
    }

    startSignalRef.current = signalKey
    setShowStartSignal(true)
    const timeoutId = window.setTimeout(() => {
      setShowStartSignal(false)
    }, 1800)

    return () => window.clearTimeout(timeoutId)
  }, [raceId, status])

  // Determine the current leader
  const leader = horses.length
    ? [...horses].sort((a, b) => b.position - a.position)[0]
    : null
  const leaderIdentity = leader ? getHorseIdentity(leader.id) : null
  const displayWinnerId =
    winnerBannerHorseId ??
    (status === 'finished' || status === 'results'
      ? (lastResult?.winner ?? winner)
      : null)
  const winnerIdentity = getHorseIdentity(displayWinnerId ?? 'horse-0')
  const { showWinnerBanner } = useWinnerPresentation({
    winnerHorseId: displayWinnerId,
    bannerVisibleUntilUtc,
    resultsVisible: status === 'results',
  })
  const isWinnerPresentationActive =
    showWinnerBanner ||
    status === 'finished' ||
    status === 'results' ||
    showFinishAnimation

  return (
    <div
      className={`race-track${showFinishAnimation ? ' race-track--finish-animate' : ''}`}
      style={{ backgroundImage: `url(${raceTrackImg})` }}
    >
      <div className="race-track-vignette" />
      <div className="race-chip race-chip-left">🏁 {raceId ?? 'RACE'}</div>
      <div className="race-chip race-chip-right">
        {status === 'running'
          ? 'LIVE 🔴'
          : status === 'betsOpen'
            ? 'GETTING SET'
            : status === 'finished' || status === 'results'
              ? 'RESULTS'
              : 'NEXT RACE SOON'}
      </div>

      {showStartSignal && <div className="start-banner">And they're off!</div>}

      {/* Leader callout */}
      {status === 'running' &&
        leaderIdentity &&
        leader &&
        leader.position > 10 && (
          <div
            className="leader-banner"
            style={{
              borderColor: leaderIdentity.hex,
              color: leaderIdentity.hex,
            }}
          >
            <span
              className="leader-dot"
              style={{ background: leaderIdentity.hex }}
            />
            🏇 {leaderIdentity.name} leads!
          </div>
        )}

      {status === 'running' && currentEventHeadline && (
        <div className="event-banner">{currentEventHeadline}</div>
      )}

      {horses.map((horse, index) => (
        <div
          key={horse.id}
          className={`race-lane race-lane-${index}${horse.id === displayWinnerId ? ' race-lane--winner' : ''}`}
        >
          <div
            className="lane-label"
            style={{ color: getHorseIdentity(horse.id).hex }}
          >
            {getHorseName(horse.id)}
          </div>
          <div className="lane-track">
            <div
              className="lane-marker lane-marker--start"
              style={{ left: `${START_LINE_PERCENT}%` }}
            >
              {index === 0 ? <span>START</span> : null}
            </div>
            <div
              className="lane-marker lane-marker--finish"
              style={{ left: `${FINISH_LINE_PERCENT}%` }}
            >
              {index === 0 ? <span>FINISH</span> : null}
            </div>
            <Horse
              id={horse.id}
              position={horse.position}
              laneNumber={index + 1}
              interpolationEnabled={interpolationEnabled}
              activeEventIds={horseEffects[horse.id]?.activeEventIds ?? []}
              isStunned={horseEffects[horse.id]?.isStunned === true}
              isRemoved={horseEffects[horse.id]?.isRemoved === true}
            />
          </div>
        </div>
      ))}

      {displayWinnerId && (
        <>
          <WinnerBanner
            winnerName={winnerIdentity.name}
            accentColor={winnerIdentity.hex}
            visible={showWinnerBanner}
          />
          <div className="confetti-wrap">
            {Array.from({ length: 28 }).map((_, i) => (
              <span
                key={i}
                className="confetti-piece"
                style={{
                  left: `${(i / 28) * 100}%`,
                  animationDelay: `${(i % 7) * 0.08}s`,
                  animationDuration: `${3 + (i % 4) * 0.3}s`,
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
