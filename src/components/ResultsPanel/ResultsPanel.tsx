import React, { useEffect, useMemo, useRef, useState } from 'react'
import './ResultsPanel.css'

export type Standing = {
  position: number
  horseNumber: number
  horseName: string
  odds: string
  payout?: string
}

export type ResultsPanelProps = {
  isVisible: boolean
  winner: {
    horseNumber: number
    horseName: string
    odds: string
    payout: string
  } | null
  standings: Standing[]
  nextRaceStartsInSeconds: number
  onComplete?: () => void
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({
  isVisible,
  winner,
  standings,
  nextRaceStartsInSeconds,
  onComplete,
}) => {
  const completeCalledRef = useRef(false)
  const remainingSeconds = Math.max(0, Math.floor(nextRaceStartsInSeconds))

  const sortedStandings = useMemo(
    () =>
      [...standings]
        .filter(
          (standing) =>
            Number.isFinite(standing.position) &&
            Number.isFinite(standing.horseNumber) &&
            Boolean(standing.horseName),
        )
        .sort((left, right) => left.position - right.position),
    [standings],
  )

  useEffect(() => {
    completeCalledRef.current = false
  }, [isVisible, nextRaceStartsInSeconds, winner, standings])

  useEffect(() => {
    if (!isVisible) return

    if (remainingSeconds <= 0) {
      if (!completeCalledRef.current) {
        completeCalledRef.current = true
        onComplete?.()
      }
    }
  }, [isVisible, onComplete, remainingSeconds])

  if (!isVisible) return null

  const hasStandings = sortedStandings.length > 0

  return (
    <section
      className="results-panel"
      aria-live="polite"
      aria-label="Official race results"
    >
      <header className="results-panel__header">
        <div>
          <p className="results-panel__eyebrow">Official Results</p>
          <h2 className="results-panel__title">Race settled by the backend</h2>
        </div>
        <div
          className="results-panel__countdown"
          aria-label="Next race countdown"
        >
          <span className="results-panel__countdown-label">Next race</span>
          <strong className="results-panel__countdown-value">
            {remainingSeconds}s
          </strong>
        </div>
      </header>

      {winner ? (
        <div className="results-panel__winner-card" role="status">
          <div className="results-panel__winner-kicker">🏆 Winner</div>
          <div className="results-panel__winner-main">
            <span className="results-panel__winner-number">
              #{winner.horseNumber}
            </span>
            <div>
              <div className="results-panel__winner-name">
                {winner.horseName}
              </div>
              <div className="results-panel__winner-meta">
                Odds {winner.odds} • Payout {winner.payout}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="results-panel__empty-banner">
          Winner information is not available yet.
        </div>
      )}

      <div className="results-panel__body">
        <div className="results-panel__standings-card">
          <h3 className="results-panel__section-title">Final Standings</h3>

          {hasStandings ? (
            <ol className="results-panel__standings-list">
              {sortedStandings.map((standing) => {
                const isWinner = standing.position === 1

                return (
                  <li
                    key={`${standing.position}-${standing.horseNumber}-${standing.horseName}`}
                    className={`results-panel__standing-row${isWinner ? ' results-panel__standing-row--winner' : ''}`}
                  >
                    <span className="results-panel__position">
                      {standing.position}
                    </span>
                    <span className="results-panel__horse-number">
                      #{standing.horseNumber}
                    </span>
                    <span className="results-panel__horse-name">
                      {standing.horseName}
                    </span>
                    <span className="results-panel__odds">{standing.odds}</span>
                    <span className="results-panel__payout">
                      {standing.payout ??
                        (isWinner && winner ? winner.payout : '—')}
                    </span>
                  </li>
                )
              })}
            </ol>
          ) : (
            <div className="results-panel__empty-state">
              No official standings are available.
            </div>
          )}
        </div>

        <aside
          className="results-panel__summary-card"
          aria-label="Payout summary"
        >
          <h3 className="results-panel__section-title">Payout Summary</h3>
          {winner ? (
            <dl className="results-panel__summary-list">
              <div>
                <dt>Winning horse</dt>
                <dd>
                  #{winner.horseNumber} {winner.horseName}
                </dd>
              </div>
              <div>
                <dt>Official odds</dt>
                <dd>{winner.odds}</dd>
              </div>
              <div>
                <dt>Payout</dt>
                <dd>{winner.payout}</dd>
              </div>
              <div>
                <dt>Panel closes in</dt>
                <dd>{remainingSeconds}s</dd>
              </div>
            </dl>
          ) : (
            <div className="results-panel__empty-state">
              Payout details will appear when a winner is supplied.
            </div>
          )}
        </aside>
      </div>
    </section>
  )
}
