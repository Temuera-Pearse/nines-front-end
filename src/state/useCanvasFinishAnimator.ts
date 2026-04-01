import { useEffect, useMemo, useRef, useState } from 'react'
import {
  applyRaceFinish,
  createWinnerHighlightState,
  stepFinishAnimation,
  type BackendFinishResult,
  type CanvasHorseSprite,
  type FinishAnimationState,
  type WinnerHighlightState,
} from '../utils/canvasFinishAnimation'

interface UseCanvasFinishAnimatorArgs {
  horses: CanvasHorseSprite[]
  results: BackendFinishResult[]
  finishLineX: number
  isFinished: boolean
  resultsVisible?: boolean
}

export function useCanvasFinishAnimator({
  horses,
  results,
  finishLineX,
  isFinished,
  resultsVisible = false,
}: UseCanvasFinishAnimatorArgs) {
  const [animatedHorses, setAnimatedHorses] = useState(horses)
  const [isAnimatingFinish, setIsAnimatingFinish] = useState(false)
  const [winnerHighlight, setWinnerHighlight] = useState<WinnerHighlightState>({
    winnerHorseId: null,
    showBanner: false,
    active: false,
  })
  const animationRef = useRef<FinishAnimationState | null>(null)
  const frameRef = useRef<number | null>(null)

  const sortedResults = useMemo(
    () => [...results].sort((left, right) => left.position - right.position),
    [results],
  )

  useEffect(() => {
    if (!isFinished) {
      setAnimatedHorses(horses)
      setIsAnimatingFinish(false)
      setWinnerHighlight({
        winnerHorseId: null,
        showBanner: false,
        active: false,
      })
      animationRef.current = null
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
      return
    }

    if (sortedResults.length === 0) {
      setAnimatedHorses(horses)
      return
    }

    const startAnimation = () => {
      animationRef.current = applyRaceFinish(horses, sortedResults, {
        finishLineX,
      })
      setIsAnimatingFinish(true)

      const tick = (nowMs: number) => {
        if (!animationRef.current) return

        const frame = stepFinishAnimation(horses, animationRef.current, nowMs)
        setAnimatedHorses(frame.horses)

        if (frame.completed) {
          setIsAnimatingFinish(false)
          setWinnerHighlight(
            createWinnerHighlightState(frame.horses, resultsVisible),
          )
          animationRef.current = null
          frameRef.current = null
          return
        }

        frameRef.current = requestAnimationFrame(tick)
      }

      frameRef.current = requestAnimationFrame(tick)
    }

    startAnimation()

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
    }
  }, [finishLineX, horses, isFinished, resultsVisible, sortedResults])

  useEffect(() => {
    if (!isFinished || isAnimatingFinish) return
    setWinnerHighlight(
      createWinnerHighlightState(animatedHorses, resultsVisible),
    )
  }, [animatedHorses, isAnimatingFinish, isFinished, resultsVisible])

  return {
    animatedHorses,
    isAnimatingFinish,
    winnerHighlight,
    winningHorseId: sortedResults[0]
      ? typeof sortedResults[0].horse === 'string'
        ? sortedResults[0].horse
        : `horse-${sortedResults[0].horse}`
      : null,
  }
}
