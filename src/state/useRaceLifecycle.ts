import { useEffect, useRef, useState } from 'react'
import { RaceStatus, useRaceStore } from './raceStore'
import { countdownTo } from '../utils/time'

export function useRaceLifecycle() {
  const status = useRaceStore((state) => state.status)
  const backendResults = useRaceStore((state) => state.backendResults)
  const finishAnimationKey = useRaceStore((state) => state.finishAnimationKey)
  const bannerVisibleUntilUtc = useRaceStore(
    (state) => state.bannerVisibleUntilUtc,
  )
  const resultsVisibleUntilUtc = useRaceStore(
    (state) => state.resultsVisibleUntilUtc,
  )
  const interpolationEnabled = useRaceStore(
    (state) => state.interpolationEnabled,
  )
  const enterResultsPhase = useRaceStore((state) => state.enterResultsPhase)
  const completeResultsPhase = useRaceStore(
    (state) => state.completeResultsPhase,
  )

  const [showFinishAnimation, setShowFinishAnimation] = useState(false)
  const [resultsCountdownSeconds, setResultsCountdownSeconds] = useState(0)
  const latestFinishKeyRef = useRef(0)

  useEffect(() => {
    if (
      status !== RaceStatus.FINISHED &&
      status !== RaceStatus.RESULTS
    ) {
      setShowFinishAnimation(false)
      setResultsCountdownSeconds(0)
      return
    }

    latestFinishKeyRef.current = finishAnimationKey

    const syncFinishPhase = () => {
      const nowMs = Date.now()
      const bannerEndMs = new Date(bannerVisibleUntilUtc).getTime()
      const showBannerWindow =
        status === RaceStatus.FINISHED &&
        (!Number.isFinite(bannerEndMs) || nowMs < bannerEndMs)

      setShowFinishAnimation(showBannerWindow)

      if (
        status === RaceStatus.FINISHED &&
        Number.isFinite(bannerEndMs) &&
        nowMs >= bannerEndMs &&
        latestFinishKeyRef.current === finishAnimationKey &&
        useRaceStore.getState().status === RaceStatus.FINISHED
      ) {
        enterResultsPhase()
        return
      }

      if (useRaceStore.getState().status === RaceStatus.RESULTS) {
        const seconds = countdownTo(resultsVisibleUntilUtc)
        setResultsCountdownSeconds(seconds)

        if (seconds <= 0) {
          completeResultsPhase()
        }
      }
    }

    syncFinishPhase()
    const intervalId = window.setInterval(syncFinishPhase, 100)

    return () => window.clearInterval(intervalId)
  }, [
    bannerVisibleUntilUtc,
    completeResultsPhase,
    enterResultsPhase,
    finishAnimationKey,
    resultsVisibleUntilUtc,
    status,
  ])

  return {
    status,
    backendResults,
    interpolationEnabled,
    isFinished: status === RaceStatus.FINISHED || status === RaceStatus.RESULTS,
    showFinishAnimation,
    showResultsPanel: status === RaceStatus.RESULTS,
    resultsCountdownSeconds,
    completeResultsPhase,
  }
}
