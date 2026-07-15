import React from 'react'
import { BettingEntry } from './types'

interface BettingLeaderboardProps {
  amount: number
  bettingOpen: boolean
  entries: BettingEntry[]
  estimatedReturn: string
  isAuthenticated: boolean
  message: string
  placing: boolean
  quickBets: number[]
  selectedEntry: BettingEntry | null
  selectedHorseId: string | null
  onAmountChange: (amount: number) => void
  onLogin: () => void
  onPlaceBet: () => void
  onRegister: () => void
  onSelectHorse: (horseId: string | null) => void
}

export const BettingLeaderboard: React.FC<BettingLeaderboardProps> = React.memo(
  function BettingLeaderboard({
    amount,
    bettingOpen,
    entries,
    estimatedReturn,
    isAuthenticated,
    message,
    placing,
    quickBets,
    selectedEntry,
    onSelectHorse,
    onAmountChange,
    onLogin,
    onPlaceBet,
    onRegister,
    selectedHorseId,
  }) {
    return (
      <section className="betting-card betting-card--leaderboard">
        <div className="betting-card__header">
          <div>
            <div className="betting-card__eyebrow">Leaderboard</div>
            <div className="betting-card__title">Live horse order</div>
            <div className="betting-card__subtitle">
              Select a runner to expand inline betting beneath that horse.
            </div>
          </div>
          <div className="betting-card__pill">Live</div>
        </div>

        <div className="betting-leaderboard__list">
          {entries.map((entry) => {
            const isSelected = selectedHorseId === entry.id
            const showExpandedRow = isSelected

            return (
              <React.Fragment key={entry.id}>
                <button
                  type="button"
                  className={`betting-leaderboard__row${isAuthenticated ? ' betting-leaderboard__row--with-stats' : ''}${isSelected ? ' betting-leaderboard__row--selected' : ''}`}
                  onClick={() => onSelectHorse(isSelected ? null : entry.id)}
                >
                  <span className="betting-leaderboard__rank">
                    #{entry.rank}
                  </span>

                  <div className="betting-leaderboard__main">
                    <div className="betting-leaderboard__horse-line">
                      <span
                        className="betting-leaderboard__color"
                        style={{ background: entry.identity.hex }}
                      />
                      <span className="betting-leaderboard__name">
                        {entry.identity.number}. {entry.identity.name}
                      </span>
                    </div>

                    <div className="betting-leaderboard__meta">
                      <span>{Math.round(entry.positionMeters)}m</span>
                      <span>Pos. {entry.rank}</span>
                    </div>
                  </div>

                  {isAuthenticated ? (
                    <div className="betting-leaderboard__stat-block">
                      <div className="betting-leaderboard__stat">
                        <span className="betting-leaderboard__stat-label">
                          Pool
                        </span>
                        <span className="betting-leaderboard__stat-value">
                          {entry.poolAmount === null
                            ? '$0'
                            : `$${entry.poolAmount.toLocaleString()}`}
                        </span>
                      </div>
                      <div className="betting-leaderboard__stat">
                        <span className="betting-leaderboard__stat-label">
                          Share
                        </span>
                        <span className="betting-leaderboard__stat-value">
                          {entry.poolPercentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="betting-leaderboard__stat">
                        <span className="betting-leaderboard__stat-label">
                          Payout
                        </span>
                        <span className="betting-leaderboard__stat-value betting-leaderboard__stat-value--payout">
                          {entry.payoutMultiplier.toFixed(2)}x
                        </span>
                      </div>
                    </div>
                  ) : null}
                </button>

                {showExpandedRow ? (
                  <div className="betting-leaderboard__expanded-row">
                    {isAuthenticated && selectedEntry?.id === entry.id ? (
                      <div className="betting-inline-panel">
                        <div className="betting-inline-panel__header">
                          <div>
                            <div className="betting-inline-panel__title">
                              Bet on {selectedEntry.identity.name}
                            </div>
                            <div className="betting-inline-panel__subtitle">
                              Betting is {bettingOpen ? 'open' : 'closed'} for
                              this runner.
                            </div>
                          </div>
                          <div
                            className={`betting-card__pill${bettingOpen ? '' : ' betting-card__pill--closed'}`}
                          >
                            {bettingOpen ? 'Bets open' : 'Bets closed'}
                          </div>
                        </div>

                        <div className="betting-inline-panel__controls">
                          <div className="betting-panel__field">
                            <label
                              className="betting-panel__field-label"
                              htmlFor={`bet-stake-${entry.id}`}
                            >
                              Stake
                            </label>
                            <input
                              id={`bet-stake-${entry.id}`}
                              className="betting-panel__input"
                              type="number"
                              min="0"
                              value={amount || ''}
                              onChange={(event) =>
                                onAmountChange(Number(event.target.value || 0))
                              }
                              placeholder="Enter your stake"
                            />
                          </div>

                          <div className="betting-panel__quick-bets">
                            {quickBets.map((value) => (
                              <button
                                key={value}
                                type="button"
                                className={`betting-panel__quick-bet${amount === value ? ' betting-panel__quick-bet--active' : ''}`}
                                onClick={() => onAmountChange(value)}
                              >
                                ${value}
                              </button>
                            ))}
                          </div>

                          <div className="betting-inline-panel__footer">
                            <div className="betting-panel__summary-card betting-inline-panel__return-card">
                              <div className="betting-panel__summary-label">
                                Estimated return
                              </div>
                              <div className="betting-panel__summary-value betting-panel__summary-value--success">
                                ${estimatedReturn}
                              </div>
                            </div>
                            <button
                              type="button"
                              className="betting-panel__cta betting-inline-panel__cta"
                              onClick={onPlaceBet}
                              disabled={placing || !bettingOpen || amount <= 0}
                            >
                              {placing
                                ? 'Placing bet...'
                                : bettingOpen
                                  ? 'Place bet'
                                  : 'Betting closed'}
                            </button>
                          </div>

                          {message ? (
                            <div
                              className={`betting-panel__message${message.toLowerCase().includes('success') ? ' betting-panel__message--success' : ' betting-panel__message--error'}`}
                            >
                              {message}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ) : (
                      <div className="betting-inline-guard">
                        <div className="betting-inline-guard__title">
                          Please log in
                        </div>
                        <div className="betting-inline-guard__copy">
                          Betting info and controls are unavailable until you
                          are authenticated.
                        </div>
                        <div className="betting-inline-guard__actions">
                          <button
                            type="button"
                            className="betting-panel__teaser-button betting-panel__teaser-button--secondary"
                            onClick={onLogin}
                          >
                            Log in
                          </button>
                          <button
                            type="button"
                            className="betting-panel__teaser-button betting-panel__teaser-button--primary"
                            onClick={onRegister}
                          >
                            Register
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </React.Fragment>
            )
          })}
        </div>
      </section>
    )
  },
)
