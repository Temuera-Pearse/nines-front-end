import React from 'react'
import { useRaceStore } from '../../state/raceStore'
import { getHorseIdentity } from '../../utils/raceHelpers'
import './LiveRaceLeaderboard.css'

export const LiveRaceLeaderboard: React.FC = React.memo(
  function LiveRaceLeaderboard() {
    const horses = useRaceStore((state) => state.horses)
    const orderedHorses = [...horses].sort(
      (left, right) => right.position - left.position,
    )

    return (
      <section className="live-race-card" aria-label="Live runner order">
        <div className="live-race-card__header">
          <div>
            <div className="live-race-card__eyebrow">Leaderboard</div>
            <div className="live-race-card__title">Live runner order</div>
            <div className="live-race-card__subtitle">
              Positions update as race data arrives.
            </div>
          </div>
          <div className="live-race-card__pill">Live</div>
        </div>

        <ol className="live-race-list">
          {orderedHorses.map((horse, index) => {
            const identity = getHorseIdentity(horse.id)

            return (
              <li className="live-race-list__row" key={horse.id}>
                <span className="live-race-list__rank">#{index + 1}</span>
                <span
                  className="live-race-list__color"
                  style={{ background: identity.hex }}
                  aria-hidden="true"
                />
                <span className="live-race-list__name">
                  {identity.number}. {identity.name}
                </span>
                <span className="live-race-list__distance">
                  {Math.round(horse.position)}m
                </span>
              </li>
            )
          })}
        </ol>
      </section>
    )
  },
)
