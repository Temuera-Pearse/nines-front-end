import React, { useEffect, useLayoutEffect, useRef } from 'react'
import {
  getHorseIdentity,
  getRaceEventLabel,
  positionToWorldY,
} from '../../utils/raceHelpers'
import { START_Y } from '../../constants/raceTrack'
import './Horse.css'

interface HorseProps {
  id: string
  position: number
  laneNumber: number
  finishLineMeters?: number
  interpolationEnabled?: boolean
  activeEventIds?: string[]
  isStunned?: boolean
  isRemoved?: boolean
}

export const Horse: React.FC<HorseProps> = ({
  id,
  position,
  laneNumber,
  finishLineMeters = 1000,
  interpolationEnabled = true,
  activeEventIds = [],
  isStunned = false,
  isRemoved = false,
}) => {
  const horseRef = useRef<HTMLDivElement | null>(null)

  // Keep a mutable ref to the target top-px so the rAF loop can interpolate.
  const targetRef = useRef<number>(0)
  const currentRef = useRef<number>(0)
  const segmentStartRef = useRef<number>(0)
  const segmentFromRef = useRef<number>(0)
  const segmentDurationRef = useRef<number>(180)
  const segmentStartedAtRef = useRef<number>(0)
  const rafRef = useRef<number | null>(null)

  // Track whether we've received a non-zero position since the last reset
  const hadNonZeroRef = useRef(false)
  const lastUpdateAtRef = useRef<number | null>(null)
  const smoothedIntervalRef = useRef<number>(180)

  const identity = getHorseIdentity(id)
  const effectLabel = isRemoved
    ? 'OUT'
    : isStunned
      ? 'STUNNED'
      : activeEventIds[0]
        ? getRaceEventLabel(activeEventIds[0])
        : null

  // Compute target px from new position prop; snap on reset / first tick
  useLayoutEffect(() => {
    const newTarget = positionToWorldY(position, finishLineMeters)
    targetRef.current = newTarget

    if (!interpolationEnabled) {
      currentRef.current = newTarget
      segmentStartRef.current = newTarget
      segmentFromRef.current = newTarget
      segmentStartedAtRef.current = performance.now()
      const horse = horseRef.current
      if (horse) horse.style.top = `${newTarget.toFixed(2)}px`
      return
    }

    const now = performance.now()

    if (position <= 0) {
      currentRef.current = newTarget
      segmentStartRef.current = newTarget
      segmentFromRef.current = newTarget
      segmentStartedAtRef.current = now
      segmentDurationRef.current = 0
      lastUpdateAtRef.current = null
      hadNonZeroRef.current = false
      const horse = horseRef.current
      if (horse) horse.style.top = `${newTarget.toFixed(2)}px`
      return
    }

    if (!hadNonZeroRef.current && position > 25) {
      currentRef.current = newTarget
      segmentStartRef.current = newTarget
      segmentFromRef.current = newTarget
      segmentStartedAtRef.current = now
      segmentDurationRef.current = 0
      hadNonZeroRef.current = true
      lastUpdateAtRef.current = now
      const horse = horseRef.current
      if (horse) horse.style.top = `${newTarget.toFixed(2)}px`
      return
    }

    const lastUpdateAt = lastUpdateAtRef.current
    if (lastUpdateAt !== null) {
      const observedInterval = now - lastUpdateAt
      if (Number.isFinite(observedInterval) && observedInterval > 16) {
        smoothedIntervalRef.current =
          smoothedIntervalRef.current * 0.72 + observedInterval * 0.28
      }
    }

    const travelDistance = Math.abs(newTarget - currentRef.current)
    const nextDuration = Math.max(
      140,
      Math.min(620, smoothedIntervalRef.current * 0.95 + travelDistance * 2.1),
    )

    segmentFromRef.current = currentRef.current
    segmentStartRef.current = newTarget
    segmentStartedAtRef.current = now
    segmentDurationRef.current = nextDuration
    lastUpdateAtRef.current = now
    hadNonZeroRef.current = true
  }, [finishLineMeters, interpolationEnabled, position])

  // rAF loop: lerp currentRef → targetRef and write directly to DOM
  useEffect(() => {
    if (!interpolationEnabled) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      const horse = horseRef.current
      if (horse) {
        horse.style.top = `${targetRef.current.toFixed(2)}px`
      }
      return
    }

    let alive = true

    const animate = () => {
      if (!alive) return
      const horse = horseRef.current
      if (horse) {
        const now = performance.now()
        const duration = segmentDurationRef.current

        if (duration <= 0) {
          currentRef.current = targetRef.current
        } else {
          const elapsed = now - segmentStartedAtRef.current
          const progress = Math.max(0, Math.min(1, elapsed / duration))
          currentRef.current =
            segmentFromRef.current +
            (segmentStartRef.current - segmentFromRef.current) * progress
          if (progress >= 1) currentRef.current = targetRef.current
        }

        horse.style.top = `${currentRef.current.toFixed(2)}px`
      }
      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => {
      alive = false
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [interpolationEnabled])

  return (
    <div className="horse-container">
      <div
        ref={horseRef}
        className={`horse${isStunned ? ' horse--stunned' : ''}${isRemoved ? ' horse--removed' : ''}`}
        style={{
          backgroundColor: identity.hex,
          boxShadow: `0 2px 8px ${identity.hex}66`,
          top: `${START_Y}px`,
        }}
      >
        {/* Number badge */}
        <span className="horse-num">{laneNumber}</span>
        {effectLabel ? (
          <span className="horse-effect">{effectLabel}</span>
        ) : null}
        <span className="horse-icon">🐎</span>
      </div>
    </div>
  )
}
