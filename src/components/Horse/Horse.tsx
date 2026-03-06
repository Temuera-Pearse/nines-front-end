import React, { useEffect, useLayoutEffect, useRef } from 'react'
import { positionToProgress, getHorseIdentity } from '../../utils/raceHelpers'
import './Horse.css'

const FINISH_GUTTER_PX = 15
const HORSE_W = 20

interface HorseProps {
  id: string
  position: number
  laneNumber: number
}

export const Horse: React.FC<HorseProps> = ({ id, position, laneNumber }) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const horseRef = useRef<HTMLDivElement | null>(null)

  // Keep a mutable ref to the *target* left-px so the rAF loop can interpolate
  const targetRef = useRef<number>(0)
  const currentRef = useRef<number>(0)
  const rafRef = useRef<number | null>(null)

  // Track whether we've received a non-zero position since the last reset
  const hadNonZeroRef = useRef(false)

  const identity = getHorseIdentity(id)

  // Compute target px from new position prop; snap on reset / first tick
  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return

    const progress = positionToProgress(position)
    const trackWidth = container.clientWidth
    const maxLeft = Math.max(0, trackWidth - HORSE_W - FINISH_GUTTER_PX)
    const newTarget = Math.min(maxLeft, Math.max(0, progress * maxLeft))
    targetRef.current = newTarget

    if (position === 0) {
      // Race reset — snap horse to start line immediately, clear the "seen" flag
      currentRef.current = 0
      hadNonZeroRef.current = false
    } else if (!hadNonZeroRef.current) {
      // First non-zero tick after a reset: snap instead of lerping from 0 to
      // wherever the backend currently is (avoids frozen-then-jump appearance
      // when ticks arrive 1-2s late)
      currentRef.current = newTarget
      hadNonZeroRef.current = true
    }
  }, [position])

  // rAF loop: lerp currentRef → targetRef and write directly to DOM
  useEffect(() => {
    let alive = true

    const animate = () => {
      if (!alive) return
      const horse = horseRef.current
      if (horse) {
        const diff = targetRef.current - currentRef.current
        // Fast lerp: covers >99% of distance in ~6 frames (100ms at 60fps)
        currentRef.current += diff * 0.18
        if (Math.abs(diff) < 0.3) currentRef.current = targetRef.current
        horse.style.left = `${currentRef.current.toFixed(2)}px`
      }
      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => {
      alive = false
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // Keep track width in sync on resize
  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return
    const ro = new ResizeObserver(() => {
      const progress = positionToProgress(position)
      const trackWidth = container.clientWidth
      const maxLeft = Math.max(0, trackWidth - HORSE_W - FINISH_GUTTER_PX)
      targetRef.current = Math.min(maxLeft, Math.max(0, progress * maxLeft))
    })
    ro.observe(container)
    return () => ro.disconnect()
  }, [position])

  return (
    <div className="horse-container" ref={containerRef}>
      <div
        ref={horseRef}
        className="horse"
        style={{
          backgroundColor: identity.hex,
          boxShadow: `0 2px 8px ${identity.hex}66`,
          left: '0px',
        }}
      >
        {/* Number badge */}
        <span className="horse-num">{laneNumber}</span>
        <span className="horse-icon">🐎</span>
      </div>
    </div>
  )
}
