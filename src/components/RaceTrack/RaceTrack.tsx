import React, { useEffect, useRef, useState } from 'react'
import { RaceStatus, useRaceStore } from '../../state/raceStore'
import { Horse } from '../Horse/Horse'
import {
  getHorseName,
  getHorseIdentity,
  positionToRaceProgress,
  positionToWorldY,
} from '../../utils/raceHelpers'
import { useWinnerPresentation } from '../../state/useWinnerPresentation'
import { WinnerBanner } from '../WinnerBanner/WinnerBanner'
import { HeaderRaceTimer } from '../Header/HeaderRaceTimer'
import { selectCurrentEventHeadline } from '../../state/raceSelectors'
import {
  AUTO_RACE_CAMERA_ENABLED,
  FINISH_Y,
  RACE_DISTANCE_Y,
  START_Y,
  TRACK_HEIGHT,
} from '../../constants/raceTrack'
import './RaceTrack.css'

const CAMERA_LERP = 0.12

interface RaceTrackProps {
  showFinishAnimation: boolean
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * amount
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
    finishLineMeters,
  } = useRaceStore()
  const bannerVisibleUntilUtc = useRaceStore(
    (state) => state.bannerVisibleUntilUtc,
  )
  const currentEventHeadline = useRaceStore(selectCurrentEventHeadline)
  const [showStartSignal, setShowStartSignal] = useState(false)
  const startSignalRef = useRef<string | null>(null)
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const cameraStateRef = useRef({
    horses,
    status,
    finishLineMeters,
  })
  const currentScrollRef = useRef(0)

  cameraStateRef.current = {
    horses,
    status,
    finishLineMeters,
  }

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

  useEffect(() => {
    if (!AUTO_RACE_CAMERA_ENABLED) {
      return
    }

    let rafId: number | null = null

    const getCameraTarget = (viewportHeight: number): number => {
      const {
        horses: cameraHorses,
        status: cameraStatus,
        finishLineMeters: cameraFinishLineMeters,
      } = cameraStateRef.current
      const maxScroll = Math.max(0, TRACK_HEIGHT - viewportHeight)
      const finishTarget = FINISH_Y - viewportHeight * 0.2

      if (
        cameraStatus === RaceStatus.FINISHED ||
        cameraStatus === RaceStatus.RESULTS
      ) {
        return clamp(finishTarget, 0, maxScroll)
      }

      if (cameraStatus !== RaceStatus.RUNNING) {
        return clamp(START_Y - viewportHeight * 0.4, 0, maxScroll)
      }

      const rankedHorses = cameraHorses.filter((horse) =>
        Number.isFinite(horse.position),
      )
      const leader =
        rankedHorses.length > 0
          ? [...rankedHorses].sort(
              (left, right) => right.position - left.position,
            )[0]
          : null
      const followedRunnerY =
        leader !== null
          ? positionToWorldY(leader.position, cameraFinishLineMeters)
          : rankedHorses.length > 0
            ? rankedHorses.reduce(
                (sum, horse) =>
                  sum + positionToWorldY(horse.position, cameraFinishLineMeters),
                0,
              ) / rankedHorses.length
            : START_Y
      const followedProgress =
        leader !== null
          ? positionToRaceProgress(leader.position, cameraFinishLineMeters)
          : clamp((START_Y - followedRunnerY) / RACE_DISTANCE_Y, 0, 1)
      const actionTarget = followedRunnerY - viewportHeight * 0.48
      const finishBias = clamp((followedProgress - 0.75) / 0.25, 0, 1)
      const biasedTarget = lerp(actionTarget, finishTarget, finishBias)

      return clamp(biasedTarget, 0, maxScroll)
    }

    const animateCamera = () => {
      const viewport = viewportRef.current

      if (viewport) {
        const viewportHeight = viewport.clientHeight
        const maxScroll = Math.max(0, TRACK_HEIGHT - viewportHeight)

        if (maxScroll <= 0) {
          currentScrollRef.current = 0
          if (viewport.scrollTop !== 0) {
            viewport.scrollTop = 0
          }
        } else {
          const targetScroll = getCameraTarget(viewportHeight)
          const currentScroll = clamp(
            currentScrollRef.current || viewport.scrollTop,
            0,
            maxScroll,
          )
          const nextScroll = lerp(currentScroll, targetScroll, CAMERA_LERP)

          currentScrollRef.current = nextScroll
          viewport.scrollTop = nextScroll
        }
      }

      rafId = window.requestAnimationFrame(animateCamera)
    }

    rafId = window.requestAnimationFrame(animateCamera)

    return () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId)
      }
    }
  }, [])

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
  const showLiveLeaderBanner =
    status === 'running' &&
    !winnerBannerHorseId &&
    Boolean(leaderIdentity && leader && leader.position > 10)

  return (
    <div className="race-track-frame">
      <div className="race-viewport-info" aria-live="polite">
        <div className="race-chip race-chip-left">🏁 {raceId ?? 'RACE'}</div>
        <HeaderRaceTimer />
      </div>

      <div className="race-track-overlays">
        {showStartSignal && (
          <div className="start-banner">And they're off!</div>
        )}

        {showLiveLeaderBanner && leaderIdentity && leader && (
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
      </div>

      <div className="race-viewport" ref={viewportRef}>
        <div className="race-track race-world">
          <div className="race-environment race-environment--trees" />
          <div className="race-environment race-environment--fence" />
          <div className="race-environment race-environment--water" />
          <div className="race-track-vignette" />

          <div className="race-lanes">
            {horses.map((horse, index) => (
              <div
                key={horse.id}
                className={`race-lane race-lane-${index}${horse.id === displayWinnerId ? ' race-lane--winner' : ''}`}
                style={{ '--lane-index': index } as React.CSSProperties}
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
                    style={{ top: `${START_Y}px` }}
                  />
                  <div
                    className="lane-marker lane-marker--finish"
                    style={{ top: `${FINISH_Y}px` }}
                  />
                  <Horse
                    id={horse.id}
                    position={horse.position}
                    laneNumber={index + 1}
                    finishLineMeters={finishLineMeters}
                    interpolationEnabled={interpolationEnabled}
                    activeEventIds={horseEffects[horse.id]?.activeEventIds ?? []}
                    isStunned={horseEffects[horse.id]?.isStunned === true}
                    isRemoved={horseEffects[horse.id]?.isRemoved === true}
                  />
                </div>
              </div>
            ))}
          </div>

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
      </div>
    </div>
  )
}
