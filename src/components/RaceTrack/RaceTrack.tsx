import React from 'react'
import { useRaceStore } from '../../state/raceStore'
import { Horse } from '../Horse/Horse'
import { getHorseName, getHorseIdentity } from '../../utils/raceHelpers'
import raceTrackImg from '../../assets/raceTrack.jpg'
import './RaceTrack.css'

export const RaceTrack: React.FC = () => {
  const { horses, status, winner, lastResult, raceId } = useRaceStore()

  // Determine the current leader
  const leader = horses.length
    ? [...horses].sort((a, b) => b.position - a.position)[0]
    : null
  const leaderIdentity = leader ? getHorseIdentity(leader.id) : null
  const winnerIdentity = getHorseIdentity(
    lastResult?.winner ?? winner ?? 'horse-0',
  )

  return (
    <div
      className="race-track"
      style={{ backgroundImage: `url(${raceTrackImg})` }}
    >
      <div className="race-track-vignette" />
      <div className="race-chip race-chip-left">🏁 {raceId ?? 'RACE'}</div>
      <div className="race-chip race-chip-right">
        {status === 'running'
          ? 'LIVE 🔴'
          : status === 'betsOpen'
            ? 'GATES LOADING'
            : status === 'finished'
              ? 'RESULTS'
              : 'NEXT RACE SOON'}
      </div>

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

      <div className="finish-line">FINISH</div>

      {horses.map((horse, index) => (
        <div key={horse.id} className={`race-lane race-lane-${index}`}>
          <div
            className="lane-label"
            style={{ color: getHorseIdentity(horse.id).hex }}
          >
            {getHorseName(horse.id)}
          </div>
          <div className="lane-track">
            <Horse
              id={horse.id}
              position={horse.position}
              laneNumber={index + 1}
            />
          </div>
        </div>
      ))}

      {status === 'finished' && (
        <>
          <div
            className="winner-banner"
            style={{ borderColor: winnerIdentity.hex }}
          >
            <div className="winner-kicker">🏆 WINNER</div>
            <div className="winner-name" style={{ color: winnerIdentity.hex }}>
              {winnerIdentity.name}
            </div>
          </div>
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
