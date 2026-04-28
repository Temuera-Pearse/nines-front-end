import React, { useEffect, useMemo, useState } from 'react'
import { formatUsdcBalance, useFundingStore } from '../../state/fundingStore'
import './AddFundsDrawer.css'

type FundingTab = 'overview' | 'add-funds' | 'settings'

const TABS: Array<{ id: FundingTab; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'add-funds', label: 'Add Funds' },
  { id: 'settings', label: 'Settings' },
]

function isFundingHash(hash: string): boolean {
  return hash === '#wallet'
}

function clearFundingHash(): void {
  const nextUrl = `${window.location.pathname}${window.location.search}`
  window.history.replaceState(null, '', nextUrl)
}

export const AddFundsDrawer: React.FC = React.memo(function AddFundsDrawer() {
  const activeTab = useFundingStore((state) => state.activeTab)
  const balanceUsdc = useFundingStore((state) => state.balanceUsdc)
  const depositAddress = useFundingStore((state) => state.depositAddress)
  const networkLabel = useFundingStore((state) => state.networkLabel)
  const setActiveTab = useFundingStore((state) => state.setActiveTab)
  const resetToAddFunds = useFundingStore((state) => state.resetToAddFunds)
  const addTestFunds = useFundingStore((state) => state.addTestFunds)

  const [isOpen, setIsOpen] = useState(() => isFundingHash(window.location.hash))
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')

  useEffect(() => {
    const handleHashChange = () => {
      const nextIsOpen = isFundingHash(window.location.hash)
      setIsOpen(nextIsOpen)
      if (nextIsOpen) {
        resetToAddFunds()
      }
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [resetToAddFunds])

  useEffect(() => {
    if (!isOpen) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        clearFundingHash()
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const copyButtonLabel = useMemo(() => {
    if (copyState === 'copied') return 'Copied'
    if (copyState === 'failed') return 'Copy failed'
    return 'Copy'
  }, [copyState])

  if (!isOpen) return null

  const handleClose = () => {
    clearFundingHash()
    setIsOpen(false)
  }

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(depositAddress)
      setCopyState('copied')
      window.setTimeout(() => setCopyState('idle'), 1500)
    } catch {
      setCopyState('failed')
      window.setTimeout(() => setCopyState('idle'), 1500)
    }
  }

  return (
    <div className="nines-funding-overlay" role="dialog" aria-modal="true" aria-labelledby="nines-add-funds-title">
      <button
        type="button"
        className="nines-funding-backdrop"
        onClick={handleClose}
        aria-label="Close Add Funds"
      />

      <aside className="nines-funding-drawer">
        <div className="nines-funding-header">
          <div>
            <div className="nines-funding-kicker">Funding</div>
            <h2 id="nines-add-funds-title" className="nines-funding-title">
              Add Funds
            </h2>
            <p className="nines-funding-subtitle">
              Fund your betting balance in USDC. This alpha drawer supports test
              funds now and keeps the real deposit flow clearly marked as a
              future step.
            </p>
          </div>

          <button
            type="button"
            className="nines-funding-close"
            onClick={handleClose}
            aria-label="Close Add Funds"
          >
            ×
          </button>
        </div>

        <div className="nines-funding-tabs" role="tablist" aria-label="Funding sections">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`nines-funding-tab${activeTab === tab.id ? ' nines-funding-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="nines-funding-body">
          {activeTab === 'overview' ? (
            <div className="nines-funding-stack">
              <section className="nines-funding-card nines-funding-balance-card">
                <div className="nines-funding-card-label">Betting balance</div>
                <div className="nines-funding-card-value">
                  {formatUsdcBalance(balanceUsdc)}
                </div>
                <div className="nines-funding-card-copy">
                  NINES uses USDC as the internal betting balance currency.
                </div>
              </section>

              <section className="nines-funding-grid">
                <div className="nines-funding-stat">
                  <div className="nines-funding-card-label">Currency</div>
                  <div className="nines-funding-stat-value">USDC only</div>
                </div>

                <div className="nines-funding-stat">
                  <div className="nines-funding-card-label">Deposit status</div>
                  <div className="nines-funding-stat-value">Alpha UI</div>
                </div>
              </section>

              <section className="nines-funding-card">
                <div className="nines-funding-section-title">
                  Deposit flow direction
                </div>
                <div className="nines-funding-section-copy">
                  This drawer is designed for funding, not trading. Multi-coin,
                  swap, and exchange-style workflows are intentionally excluded.
                </div>
              </section>
            </div>
          ) : null}

          {activeTab === 'add-funds' ? (
            <div className="nines-funding-stack">
              <section className="nines-funding-card">
                <div className="nines-funding-section-title">
                  Fund your balance
                </div>
                <div className="nines-funding-section-copy">
                  Send USDC on the supported network below. Live crypto deposits
                  are not enabled in this alpha view yet.
                </div>

                <div className="nines-funding-fields">
                  <div>
                    <label className="nines-funding-field-label">Currency</label>
                    <div className="nines-funding-field-value">USDC</div>
                  </div>

                  <div>
                    <label className="nines-funding-field-label">Network</label>
                    <div className="nines-funding-field-value">{networkLabel}</div>
                  </div>

                  <div>
                    <label className="nines-funding-field-label">
                      Deposit address
                    </label>
                    <div className="nines-funding-address-box">
                      <div className="nines-funding-address">{depositAddress}</div>
                      <button
                        type="button"
                        className="nines-funding-copy-button"
                        onClick={() => {
                          void handleCopyAddress()
                        }}
                      >
                        {copyButtonLabel}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="nines-funding-helper">
                  USDC is the NINES betting balance. When real deposits ship,
                  funded USDC will land here for betting use.
                </div>

                <div className="nines-funding-deposit-grid">
                  <div className="nines-funding-card">
                    <div className="nines-funding-card-label">Alpha note</div>
                    <div className="nines-funding-card-copy">
                      Deposit address and QR are placeholders for future live
                      crypto funding. This screen should not be treated as a live
                      deposit rail yet.
                    </div>
                  </div>

                  <div className="nines-funding-qr">
                    <div className="nines-funding-qr-copy">
                      QR placeholder
                      <br />
                      Future live deposit QR
                    </div>
                  </div>
                </div>

                <div className="nines-funding-alpha">
                  <div className="nines-funding-alpha-title">Alpha test funds</div>
                  <div className="nines-funding-alpha-copy">
                    For development only. Add test USDC to simulate funding the
                    NINES betting balance.
                  </div>

                  <div className="nines-funding-test-grid">
                    {[10, 50, 100].map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        className="nines-funding-test-button"
                        onClick={() => addTestFunds(amount)}
                      >
                        Add {amount} Test USDC
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          ) : null}

          {activeTab === 'settings' ? (
            <div className="nines-funding-stack">
              <section className="nines-funding-card">
                <div className="nines-funding-section-title">
                  Funding settings
                </div>
                <div className="nines-funding-section-copy">
                  Keep this area focused on deposit controls and operational
                  guidance, not exchange-style features.
                </div>

                <div className="nines-funding-settings-list">
                  <div className="nines-funding-settings-item">
                    <div className="nines-funding-settings-title">
                      Supported asset
                    </div>
                    <div className="nines-funding-settings-copy">
                      USDC is the only supported balance currency in this alpha.
                    </div>
                  </div>

                  <div className="nines-funding-settings-item">
                    <div className="nines-funding-settings-title">
                      Supported network
                    </div>
                    <div className="nines-funding-settings-copy">
                      A single network is shown to keep the flow clean until the
                      production deposit rail is live.
                    </div>
                  </div>

                  <div className="nines-funding-settings-item">
                    <div className="nines-funding-settings-title">
                      Live deposit rollout
                    </div>
                    <div className="nines-funding-settings-copy">
                      Real deposit address validation, QR generation, and
                      balance crediting are placeholders and should be wired
                      later.
                    </div>
                  </div>
                </div>
              </section>
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  )
})