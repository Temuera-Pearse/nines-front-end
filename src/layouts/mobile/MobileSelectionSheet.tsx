import React, { useEffect, useMemo, useState } from 'react'
import { useFundingStore, formatUsdcBalance } from '../../state/fundingStore'
import type { RaceHeaderTiming } from '../../state/useRaceHeaderTiming'
import { useBettingAreaModel } from '../../components/BettingArea/useBettingAreaModel'
import './MobileLayout.css'

interface MobileSelectionSheetProps {
  timing: RaceHeaderTiming
}

function sheetPhaseLabel(key: RaceHeaderTiming['key']) {
  if (key === 'betsOpen') return 'Selections open'
  if (key === 'running') return 'Race live'
  if (key === 'settlingBets') return 'Results soon'
  if (key === 'resetting') return 'Next race loading'
  return 'Selections closed'
}

export const MobileSelectionSheet: React.FC<MobileSelectionSheetProps> = React.memo(
  function MobileSelectionSheet({ timing }: MobileSelectionSheetProps) {
    const model = useBettingAreaModel()
    const balanceUsdc = useFundingStore((state) => state.balanceUsdc)
    const [isExpanded, setIsExpanded] = useState(
      () => timing.key === 'betsOpen',
    )

    useEffect(() => {
      if (timing.key === 'betsOpen') {
        setIsExpanded(true)
        return
      }

      if (
        timing.key === 'running' ||
        timing.key === 'settlingBets' ||
        timing.key === 'resetting'
      ) {
        setIsExpanded(false)
      }
    }, [timing.key])

    const selectedName = model.selectedEntry?.identity.name ?? 'No selection'
    const selectedAccent = model.selectedEntry?.identity.hex ?? '#64748b'
    const selectedNumber = model.selectedEntry?.identity.number ?? '-'
    const canPlaceBet =
      model.isAuthenticated &&
      model.bettingOpen &&
      model.selectedEntry !== null &&
      model.amount > 0 &&
      !model.placing
    const visibleEntries = useMemo(
      () => (isExpanded ? model.entries : model.entries.slice(0, 3)),
      [isExpanded, model.entries],
    )

    return (
      <section
        className={`nines-mobile-sheet${isExpanded ? ' nines-mobile-sheet--expanded' : ' nines-mobile-sheet--compact'}`}
        aria-label="Mobile race selections"
      >
        <button
          type="button"
          className="nines-mobile-sheet__handle"
          onClick={() => setIsExpanded((value) => !value)}
          aria-expanded={isExpanded}
        >
          <span className="nines-mobile-sheet__grabber" />
          <span className="nines-mobile-sheet__handle-text">
            {isExpanded ? 'Collapse selections' : 'Open selections'}
          </span>
        </button>

        <div className="nines-mobile-sheet__summary">
          <div className="nines-mobile-sheet__selection-chip">
            <span
              className="nines-mobile-sheet__runner-dot"
              style={{ background: selectedAccent }}
            />
            <div className="nines-mobile-sheet__summary-copy">
              <span className="nines-mobile-sheet__eyebrow">
                {sheetPhaseLabel(timing.key)}
              </span>
              <strong>{selectedNumber}. {selectedName}</strong>
            </div>
          </div>

          <div className="nines-mobile-sheet__timer">
            <span>{timing.timerLabel}</span>
            <strong>{timing.isLive ? 'LIVE' : timing.timerValue}</strong>
          </div>
        </div>

        <div className="nines-mobile-sheet__content">
          <div className="nines-mobile-sheet__account-row">
            <div>
              <span>Balance</span>
              <strong>{formatUsdcBalance(balanceUsdc)}</strong>
            </div>
            <div>
              <span>Return</span>
              <strong>${model.estimatedReturn}</strong>
            </div>
            <div>
              <span>Status</span>
              <strong>{model.bettingOpen ? 'Open' : 'Closed'}</strong>
            </div>
          </div>

          <div className="nines-mobile-runner-list">
            {visibleEntries.map((entry) => {
              const isSelected = model.selectedHorse === entry.id

              return (
                <button
                  key={entry.id}
                  type="button"
                  className={`nines-mobile-runner${isSelected ? ' nines-mobile-runner--selected' : ''}`}
                  onClick={() =>
                    model.setSelectedHorse(isSelected ? null : entry.id)
                  }
                  disabled={!model.bettingOpen}
                >
                  <span className="nines-mobile-runner__rank">
                    {entry.rank}
                  </span>
                  <span
                    className="nines-mobile-runner__color"
                    style={{ background: entry.identity.hex }}
                  />
                  <span className="nines-mobile-runner__name">
                    {entry.identity.number}. {entry.identity.name}
                  </span>
                  <span className="nines-mobile-runner__odds">
                    {entry.payoutMultiplier > 0
                      ? `${entry.payoutMultiplier.toFixed(2)}x`
                      : 'Odds --'}
                  </span>
                </button>
              )
            })}
          </div>

          {isExpanded ? (
            <>
              <div className="nines-mobile-sheet__stake-row">
                <label htmlFor="mobile-bet-stake">Stake</label>
                <input
                  id="mobile-bet-stake"
                  type="number"
                  min="0"
                  inputMode="decimal"
                  value={model.amount || ''}
                  placeholder="0"
                  onChange={(event) =>
                    model.setAmount(Number(event.target.value || 0))
                  }
                  disabled={!model.bettingOpen}
                />
              </div>

              <div className="nines-mobile-sheet__quick-bets">
                {model.quickBets.map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={
                      model.amount === value
                        ? 'nines-mobile-sheet__quick-bet nines-mobile-sheet__quick-bet--active'
                        : 'nines-mobile-sheet__quick-bet'
                    }
                    onClick={() => model.setAmount(value)}
                    disabled={!model.bettingOpen}
                  >
                    ${value}
                  </button>
                ))}
              </div>

              {model.isAuthenticated ? (
                <button
                  type="button"
                  className="nines-mobile-sheet__cta"
                  onClick={() => {
                    void model.handlePlaceBet()
                  }}
                  disabled={!canPlaceBet}
                >
                  {model.placing
                    ? 'Placing bet...'
                    : model.bettingOpen
                      ? 'Place bet'
                      : 'Betting closed'}
                </button>
              ) : (
                <div className="nines-mobile-sheet__auth-actions">
                  <button
                    type="button"
                    onClick={() => {
                      void model.login()
                    }}
                  >
                    Log in
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void model.signup()
                    }}
                  >
                    Register
                  </button>
                </div>
              )}

              {model.message ? (
                <div
                  className={`nines-mobile-sheet__message${model.message.toLowerCase().includes('success') ? ' nines-mobile-sheet__message--success' : ' nines-mobile-sheet__message--error'}`}
                >
                  {model.message}
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </section>
    )
  },
)
