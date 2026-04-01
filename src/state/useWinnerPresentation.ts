import { useEffect, useState } from 'react'

interface UseWinnerPresentationArgs {
  winnerHorseId: string | null
  bannerVisibleUntilUtc?: string
  resultsVisible?: boolean
}

export function useWinnerPresentation({
  winnerHorseId,
  bannerVisibleUntilUtc,
  resultsVisible = false,
}: UseWinnerPresentationArgs) {
  const [showWinnerEffect, setShowWinnerEffect] = useState(false)

  useEffect(() => {
    if (!winnerHorseId) {
      setShowWinnerEffect(false)
      return
    }

    if (resultsVisible) {
      setShowWinnerEffect(false)
      return
    }

    const syncVisibility = () => {
      const endMs = bannerVisibleUntilUtc
        ? new Date(bannerVisibleUntilUtc).getTime()
        : Number.NaN
      setShowWinnerEffect(!Number.isFinite(endMs) || Date.now() < endMs)
    }

    syncVisibility()
    const intervalId = window.setInterval(syncVisibility, 100)

    return () => window.clearInterval(intervalId)
  }, [bannerVisibleUntilUtc, resultsVisible, winnerHorseId])

  return {
    showWinnerEffect,
    showWinnerBanner: showWinnerEffect && !resultsVisible,
    dismissWinnerEffect: () => setShowWinnerEffect(false),
  }
}
