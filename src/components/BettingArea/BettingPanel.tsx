import React from 'react'
import { useAppAuth } from '../../auth/AppAuthProvider'
import { BettingEntry } from './types'

interface BettingPanelProps {
  amount: number
  bettingOpen: boolean
  estimatedReturn: string
  message: string
  placing: boolean
  quickBets: number[]
  selectedEntry: BettingEntry | null
  totalPool: number
  onAmountChange: (amount: number) => void
  onLogin: () => void
  onPlaceBet: () => void
  onRegister: () => void
}

export const BettingPanel: React.FC<BettingPanelProps> = React.memo(
  function BettingPanel({
    amount,
    bettingOpen,
    estimatedReturn,
    message,
    placing,
    quickBets,
    selectedEntry,
    totalPool,
    onAmountChange,
    onLogin,
    onPlaceBet,
    onRegister,
  }) {
    const { isAuthenticated } = useAppAuth()

    return (
      <section className="betting-card">
        <div className="betting-card__header">
          <div>
            <div className="betting-card__eyebrow">Betting</div>
            <div className="betting-card__title">Dedicated bet slip</div>
            <div className="betting-card__subtitle">
              {isAuthenticated
                ? 'Review the runner and place a quick win bet.'
                : 'Watch the race live and unlock betting after sign in.'}
            </div>
          </div>
          <div
            className={`betting-card__pill${bettingOpen ? '' : ' betting-card__pill--closed'}`}
          >
            {bettingOpen ? 'Bets open' : 'Bets closed'}
          </div>
        </div>

        <div className="betting-panel__body">
          <div className="betting-panel__selection">
            {selectedEntry ? (
              <>
                <span
                  className="betting-panel__selection-chip"
                  style={{ background: selectedEntry.identity.hex }}
                >
                  {selectedEntry.identity.number}
                </span>
                <div className="betting-panel__selection-copy">
                  <span className="betting-panel__selection-label">
                    Selected horse
                  </span>
                  <span className="betting-panel__selection-name">
                    {selectedEntry.identity.name}
                  </span>
                </div>
              </>
            ) : (
              <div className="betting-panel__selection-copy">
                <span className="betting-panel__selection-label">
                  Selected horse
                </span>
                <span className="betting-panel__selection-name">
                  Choose a runner from the leaderboard
                </span>
              </div>
            )}
          </div>

          {isAuthenticated ? (
            <>
              <div className="betting-panel__field">
                <label
                  className="betting-panel__field-label"
                  htmlFor="bet-stake"
                >
                  Stake
                </label>
                <input
                  id="bet-stake"
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

              <div className="betting-panel__summary">
                <div className="betting-panel__summary-card">
                  <div className="betting-panel__summary-label">
                    Estimated return
                  </div>
                  <div className="betting-panel__summary-value betting-panel__summary-value--success">
                    ${estimatedReturn}
                  </div>
                </div>

                <div className="betting-panel__summary-card">
                  <div className="betting-panel__summary-label">
                    Current win pool
                  </div>
                  <div className="betting-panel__summary-value">
                    ${totalPool.toLocaleString()}
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="betting-panel__cta"
                onClick={onPlaceBet}
                disabled={
                  placing || !bettingOpen || !selectedEntry || amount <= 0
                }
              >
                {placing
                  ? 'Placing bet...'
                  : bettingOpen
                    ? 'Place bet'
                    : 'Betting closed'}
              </button>

              {message ? (
                <div
                  className={`betting-panel__message${message.toLowerCase().includes('success') ? ' betting-panel__message--success' : ' betting-panel__message--error'}`}
                >
                  {message}
                </div>
              ) : null}
            </>
          ) : (
            <div className="betting-panel__teaser">
              <span className="betting-panel__teaser-lock">🔒</span>
              <div className="betting-panel__teaser-copy">
                {selectedEntry
                  ? `Log in to place a bet on ${selectedEntry.identity.name}.`
                  : 'Log in to place bets, view pool stats, and manage your race action.'}
              </div>
              <div className="betting-panel__teaser-actions">
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
      </section>
    )
  },
)
