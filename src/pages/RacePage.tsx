import React, { useState, useEffect } from 'react'
import { useRaceStore } from '../state/raceStore'
import { RaceTrack } from '../components/RaceTrack/RaceTrack'
import { Leaderboard } from '../components/Leaderboard/Leaderboard'
import { Card } from '../components/UI/Card'
import { getHorseIdentity } from '../utils/raceHelpers'
import { useRaceLifecycle } from '../state/useRaceLifecycle'
import { formatRaceRef } from '../utils/raceRef'
import './RacePage.css'

function useClockMs() {
  const [ms, setMs] = useState(() => {
    const now = new Date()
    return now.getUTCSeconds() * 1000 + now.getUTCMilliseconds()
  })
  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date()
      setMs(now.getUTCSeconds() * 1000 + now.getUTCMilliseconds())
    }, 50)
    return () => clearInterval(id)
  }, [])
  return ms
}

export const RacePage: React.FC = () => {
  const {
    raceRef,
    horses,
    winner,
    winnerBannerHorseId,
    placements,
    lastResult,
    status,
  } =
    useRaceStore()
  const { showFinishAnimation } = useRaceLifecycle()
  const clockMs = useClockMs()
  const clockSec = Math.floor(clockMs / 1000)

  // Phase windows
  const isPreRace = clockSec <= 24 // :00–:24  waiting
  const isCountdown = clockSec >= 25 && clockSec <= 29 // :25–:29  countdown
  const isRunning = clockSec >= 30 && clockSec <= 50 // :30–:50  race running
  const isFinished = status === 'finished' || (winner && placements.length > 0)

  // ms until :30 — valid across the entire :00–:29 window
  const msUntilStart = clockSec <= 29 ? Math.max(0, 30_000 - clockMs) : 0

  // Elapsed: precise ms since :30.000
  const elapsedMs = isRunning ? Math.max(0, clockMs - 30_000) : 0

  // Current leader for the header
  const leader = horses.length
    ? [...horses].sort((a, b) => b.position - a.position)[0]
    : null
  const leaderIdentity = leader ? getHorseIdentity(leader.id) : null
  const declaredWinnerIdentity = winnerBannerHorseId
    ? getHorseIdentity(winnerBannerHorseId)
    : null

  return (
    <div className="race-page container mx-auto px-4 py-6">
      {/* Header card */}
      <div className="mb-4">
        <Card>
          <div className="race-page__header-grid grid grid-cols-3 items-center">
            {/* Left section - 30% */}
            <div>
              {isPreRace ? (
                <h1 className="text-3xl font-bold text-gray-400">
                  Next Race Soon
                </h1>
              ) : isCountdown ? (
                <h1 className="text-3xl font-bold text-yellow-500">
                  Get Ready!
                </h1>
              ) : isFinished ? (
                <h1 className="text-3xl font-bold text-green-600">
                  Race Complete
                </h1>
              ) : (
                <h1 className="text-3xl font-bold text-gray-800">
                  Race In Progress
                </h1>
              )}
              {raceRef && (
                <div className="text-xs text-gray-400 font-mono mt-1">
                  {formatRaceRef(raceRef)}
                </div>
              )}
              {/* Leader banner (only during race) */}
              {isRunning &&
                !winnerBannerHorseId &&
                leaderIdentity &&
                leader &&
                leader.position > 10 && (
                  <div
                    className="mt-2 inline-flex items-center gap-2 text-sm font-semibold px-3 py-1 rounded-full"
                    style={{
                      background: `${leaderIdentity.hex}22`,
                      color: leaderIdentity.hex,
                      border: `1px solid ${leaderIdentity.hex}55`,
                    }}
                  >
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full"
                      style={{ background: leaderIdentity.hex }}
                    />
                    🏇 {leaderIdentity.name} leads!
                  </div>
                )}
                {isRunning && declaredWinnerIdentity && (
                  <div
                    className="mt-2 inline-flex items-center gap-2 text-sm font-semibold px-3 py-1 rounded-full"
                    style={{
                      background: `${declaredWinnerIdentity.hex}22`,
                      color: declaredWinnerIdentity.hex,
                      border: `1px solid ${declaredWinnerIdentity.hex}55`,
                    }}
                  >
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full"
                      style={{ background: declaredWinnerIdentity.hex }}
                    />
                    🏆 Official winner: {declaredWinnerIdentity.name}
                  </div>
                )}
            </div>

            {/* Middle section - 40% - Results when finished */}
            <div className="text-center">
              {isFinished && (winner || lastResult?.winner) && (
                <div>
                  <div className="text-4xl mb-2">🏆</div>
                  <div className="text-lg font-bold text-gray-800 mb-1">
                    Winner
                  </div>
                  {(() => {
                    const winnerId = lastResult?.winner ?? winner
                    const winnerIdentity = winnerId
                      ? getHorseIdentity(winnerId)
                      : null
                    return winnerIdentity ? (
                      <div>
                        <div
                          className="inline-flex items-center gap-2 text-xl font-bold px-3 py-1 rounded-full"
                          style={{
                            background: `${winnerIdentity.hex}22`,
                            color: winnerIdentity.hex,
                            border: `1px solid ${winnerIdentity.hex}55`,
                          }}
                        >
                          <span
                            className="inline-block w-4 h-4 rounded-full"
                            style={{ background: winnerIdentity.hex }}
                          />
                          {winnerIdentity.name}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Final Placements Available
                        </div>
                      </div>
                    ) : null
                  })()}
                </div>
              )}
            </div>

            {/* Right section - 30% */}
            <div className="race-page__header-timer text-right">
              {isPreRace ? (
                <>
                  <div className="text-xs text-gray-400 uppercase tracking-wider">
                    Next race in
                  </div>
                  <div className="text-4xl font-black text-gray-300 tabular-nums leading-none mt-1">
                    {Math.ceil(msUntilStart / 1000)}s
                  </div>
                </>
              ) : isCountdown ? (
                <>
                  <div className="text-xs text-gray-500 uppercase tracking-wider">
                    Starts in
                  </div>
                  <div className="text-5xl font-black text-yellow-500 tabular-nums leading-none mt-1">
                    {(msUntilStart / 1000).toFixed(1)}s
                  </div>
                </>
              ) : isRunning ? (
                <>
                  <div className="text-xs text-gray-500 uppercase tracking-wider">
                    Elapsed
                  </div>
                  <div className="text-4xl font-black text-blue-600 tabular-nums leading-none mt-1">
                    {(elapsedMs / 1000).toFixed(2)}s
                  </div>
                </>
              ) : isFinished ? (
                <>
                  <div className="text-xs text-gray-500 uppercase tracking-wider">
                    Next race in
                  </div>
                  <div className="text-4xl font-black text-blue-600 tabular-nums leading-none mt-1">
                    {Math.ceil((60 - clockSec + 30) % 60)}s
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </Card>
      </div>

      {/* Five-column layout: leaderboard + leaderboard + track + leaderboard + leaderboard */}
      <div className="race-page__layout flex gap-4 items-start">
        {/* Left leaderboards */}
        <div className="race-page__sidebar w-52 flex-shrink-0">
          <Leaderboard />
        </div>
        <div className="race-page__sidebar w-52 flex-shrink-0">
          <div className="leaderboard">
            <div className="leaderboard-title">Win Pool</div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total Pool:</span>
                <span className="font-bold">$8,420</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>House Take:</span>
                <span className="font-bold">7%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Net Pool:</span>
                <span className="font-bold">$7,831</span>
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <div className="flex justify-between text-xs">
                <span>Red Rocket</span>
                <span>$1,200</span>
                <span>14.3%</span>
                <span className="font-bold">6.8x</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Blue Bolt</span>
                <span>$1,500</span>
                <span>17.8%</span>
                <span className="font-bold">5.5x</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Green Ghost</span>
                <span>$1,000</span>
                <span>11.9%</span>
                <span className="font-bold">8.2x</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Gold Rush</span>
                <span>$800</span>
                <span>9.5%</span>
                <span className="font-bold">10.3x</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Purple Reign</span>
                <span>$600</span>
                <span>7.1%</span>
                <span className="font-bold">13.8x</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Pink Storm</span>
                <span>$550</span>
                <span>6.5%</span>
                <span className="font-bold">15.1x</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Indigo Fire</span>
                <span>$500</span>
                <span>5.9%</span>
                <span className="font-bold">16.6x</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Orange Blaze</span>
                <span>$450</span>
                <span>5.3%</span>
                <span className="font-bold">18.5x</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Teal Comet</span>
                <span>$400</span>
                <span>4.8%</span>
                <span className="font-bold">20.8x</span>
              </div>
            </div>
            <button className="w-full mt-4 bg-slate-600 hover:bg-slate-500 text-white py-1 px-2 rounded text-xs">
              View Pool Details
            </button>
          </div>
        </div>

        {/* Track — takes most of the width */}
        <div className="race-page__track flex-1 min-w-0">
          <Card className="p-0">
            <RaceTrack showFinishAnimation={showFinishAnimation} />
          </Card>
        </div>

        {/* Right leaderboards */}
        <div className="race-page__sidebar w-52 flex-shrink-0">
          <div className="leaderboard">
            <div className="leaderboard-title">Your Bet</div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Selected Horse:</span>
                <span className="font-bold">Blue Bolt</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Stake:</span>
                <span className="font-bold">$200</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Estimated Payout:</span>
                <span className="font-bold">$454</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Current Position:</span>
                <span className="font-bold">2nd</span>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-1 px-2 rounded text-xs">
                Edit Bet
              </button>
              <button
                className="w-full bg-slate-600 hover:bg-slate-500 text-white py-1 px-2 rounded text-xs disabled:opacity-50"
                disabled
              >
                Cash Out
              </button>
            </div>
          </div>
        </div>
        <div className="race-page__sidebar w-52 flex-shrink-0">
          <div className="leaderboard">
            <div className="leaderboard-title">Market Activity</div>
            <div className="space-y-1 text-xs">
              <div>Large bet placed on Teal</div>
              <div>Blue Bolt gaining money (+3%)</div>
              <div>Purple losing share (-1%)</div>
            </div>
            <button className="w-full mt-4 bg-slate-600 hover:bg-slate-500 text-white py-1 px-2 rounded text-xs">
              View History
            </button>
          </div>
        </div>
      </div>

      {/* Footer ad banner */}
      <div className="mt-4">
        <Card>
          <div className="text-center py-4">
            <div className="text-lg font-bold text-gray-600">
              🎉 Your Ads Here - Like Football Sideline Banners! 🎉
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
