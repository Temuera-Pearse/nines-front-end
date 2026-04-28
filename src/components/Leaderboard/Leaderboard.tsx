import React, { useRef } from 'react'
import { useRaceStore } from '../../state/raceStore'
import { getHorseIdentity } from '../../utils/raceHelpers'
import './Leaderboard.css'

interface Row {
  id: string
  position: number
  rank: number
}

export const Leaderboard: React.FC = () => {
  const { horses, status, placements, winnerBannerHorseId, finishLineMeters } =
    useRaceStore()

  // When placements are set (race finished), use that canonical order.
  // During the race, sort by live position with a stable id tiebreaker so
  // the list doesn't shuffle when horses reach the same position.
  const sorted: Row[] =
    placements.length > 0
      ? placements.map((id, i) => {
          const horse = horses.find((h) => h.id === id)
          return { id, position: horse?.position ?? 1000, rank: i + 1 }
        })
      : [...horses]
          .sort((a, b) => {
            if (winnerBannerHorseId) {
              if (a.id === winnerBannerHorseId && b.id !== winnerBannerHorseId) {
                return -1
              }
              if (b.id === winnerBannerHorseId && a.id !== winnerBannerHorseId) {
                return 1
              }
            }
            if (b.position !== a.position) return b.position - a.position
            // Stable tiebreaker: prevents shuffling when positions are equal (e.g. all at 1000m)
            return a.id.localeCompare(b.id)
          })
          .map((h, i) => ({ id: h.id, position: h.position, rank: i + 1 }))

  // Track prev ranks to flash on overtake
  const prevRanksRef = useRef<Record<string, number>>({})
  const flashing: Record<string, boolean> = {}
  sorted.forEach(({ id, rank }) => {
    const prev = prevRanksRef.current[id]
    if (prev !== undefined && rank < prev) flashing[id] = true
    prevRanksRef.current[id] = rank
  })

  const isRacing = status === 'running'

  return (
    <div className="leaderboard">
      <div className="leaderboard-title">Leaderboard</div>
      <ol className="leaderboard-list">
        {sorted.map(({ id, position, rank }) => {
          const identity = getHorseIdentity(id)
          const pct = Math.min(100, (position / finishLineMeters) * 100)
          const isFlashing = flashing[id]
          return (
            <li
              key={id}
              className={`leaderboard-row${isFlashing ? ' leaderboard-row--flash' : ''}`}
            >
              {/* Rank */}
              <span className="lb-rank">
                {rank === 1
                  ? '🥇'
                  : rank === 2
                    ? '🥈'
                    : rank === 3
                      ? '🥉'
                      : rank}
              </span>

              {/* Colour dot */}
              <span
                className="lb-dot"
                style={{
                  background: identity.hex,
                  boxShadow: `0 0 6px ${identity.hex}88`,
                }}
              />

              {/* Name */}
              <span className="lb-name">{identity.name}</span>

              {/* Progress bar */}
              {isRacing && (
                <div className="lb-bar-wrap">
                  <div
                    className="lb-bar"
                    style={{ width: `${pct}%`, background: identity.hex }}
                  />
                </div>
              )}

              {/* Metres */}
              <span className="lb-pos">{Math.round(position)}m</span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
