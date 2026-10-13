import React, { useEffect, useMemo, useState } from 'react'
import { useAppAuth } from '../../auth/AppAuthProvider'
import { formatNinesMinor } from '../../gameplay/money'
import { isBettingOpen, wagerOutcome } from '../../gameplay/lifecycle'
import { usePlayerGameplay } from '../../gameplay/PlayerGameplayProvider'
import { RaceStatus, useRaceStore } from '../../state/raceStore'
import { getHorseIdentity } from '../../utils/raceHelpers'
import { useCurrentPlayer } from '../../player/hooks/useCurrentPlayer'
import './PlayerGameplayPanel.css'

function statusLabel(status: RaceStatus): string {
  switch (status) {
    case RaceStatus.BETS_OPEN: return 'OPEN'
    case RaceStatus.BETS_CLOSED: return 'CLOSED'
    case RaceStatus.RUNNING: return 'RACING'
    case RaceStatus.FINISHED:
    case RaceStatus.RESULTS: return 'RESULTS / SETTLEMENT'
    default: return 'RESETTING'
  }
}

function formatCountdown(closesAt: string, now: number): string {
  const remaining = Math.max(0, Date.parse(closesAt) - now)
  return `${Math.ceil(remaining / 1000)}s`
}

export const PlayerGameplayPanel: React.FC = React.memo(function PlayerGameplayPanel() {
  const { hasConfirmedPlayer, login } = useAppAuth()
  const { state, status, error, submitting, lastSubmission, placeWager } = usePlayerGameplay()
  const player = useCurrentPlayer()
  const raceRef = useRaceStore((value) => value.raceRef)
  const raceStatus = useRaceStore((value) => value.status)
  const closesAt = useRaceStore((value) => value.betsCloseAtUtc)
  const horses = useRaceStore((value) => value.horses)
  const winner = useRaceStore((value) => value.winner)
  const [selected, setSelected] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => {
      const next = Date.now()
      setNow(next)
      if (closesAt && next >= Date.parse(closesAt) &&
          useRaceStore.getState().status === RaceStatus.BETS_OPEN) {
        useRaceStore.getState().setStatus(RaceStatus.BETS_CLOSED)
      }
    }, 250)
    return () => window.clearInterval(timer)
  }, [closesAt])

  useEffect(() => { setSelected(null); setAmount(''); setMessage(null) }, [raceRef])

  const currentWager = useMemo(() => state?.wagers.find((wager) => wager.raceRef === raceRef) ?? null,
    [raceRef, state])
  const acceptedSubmission = lastSubmission?.raceRef === raceRef &&
    lastSubmission.result !== 'rejected' ? lastSubmission : null
  const positionSelectionId = currentWager?.selectionId ?? acceptedSubmission?.selectionId ?? null
  const positionStakeMinor = currentWager?.stakeMinor ?? acceptedSubmission?.stake.minorUnits ?? null
  const hasPosition = positionSelectionId !== null && positionStakeMinor !== null
  const permitted = player.data?.permissions.placeWager === true
  const bettingOpen = permitted && isBettingOpen(raceStatus, closesAt, now)
  const outcome = currentWager ? wagerOutcome(currentWager, winner) : null
  const won = outcome === 'won'
  const lost = outcome === 'lost'
  const settlementPending = outcome === 'settlement_pending'

  const submit = async () => {
    setMessage(null)
    if (!selected) { setMessage('Select a horse first'); return }
    try {
      const result = await placeWager(selected, amount)
      setMessage(result.result === 'replayed' ? 'Wager already accepted' : 'Wager accepted and stake locked')
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Wager submission failed')
    }
  }

  if (!hasConfirmedPlayer) {
    return (
      <section className="player-gameplay-card">
        <h2>Play with NINES</h2>
        <p>Sign in to view your authoritative balance and place a wager.</p>
        <button type="button" className="player-gameplay-card__bet" onClick={() => void login()}>Log in</button>
      </section>
    )
  }

  return (
    <section className="player-gameplay-card" aria-label="NINES wagering">
      <header className="player-gameplay-card__header">
        <div><span className="player-gameplay-card__eyebrow">Race {raceRef ?? '—'}</span><h2>NINES wager</h2></div>
        <span className={`player-gameplay-card__status player-gameplay-card__status--${bettingOpen ? 'open' : 'closed'}`}>
          {statusLabel(raceStatus)}
        </span>
      </header>

      <div className="player-gameplay-card__balances">
        <div><span>Available</span><strong>{state ? formatNinesMinor(state.balance.availableMinor) : '—'} NINES</strong></div>
        <div><span>Locked</span><strong>{state ? formatNinesMinor(state.balance.lockedMinor) : '—'} NINES</strong></div>
      </div>

      <div className="player-gameplay-card__cutoff">
        {!permitted && player.status === 'success' ? 'Wagering is not available for this account' :
          bettingOpen ? `Closes in ${formatCountdown(closesAt, now)}` : `Betting ${statusLabel(raceStatus).toLowerCase()}`}
      </div>

      <div className="player-gameplay-card__entrants">
        {horses.map((horse) => {
          const identity = getHorseIdentity(horse.id)
          return <button key={horse.id} type="button" disabled={!bettingOpen || hasPosition}
            className={selected === horse.id ? 'is-selected' : ''} onClick={() => setSelected(horse.id)}>
            <span style={{ background: identity.hex }} />{identity.number}. {identity.name}
          </button>
        })}
      </div>

      {!hasPosition ? (
        <div className="player-gameplay-card__form">
          <label htmlFor="nines-stake">Stake (NINES)</label>
          <input id="nines-stake" inputMode="decimal" value={amount}
            onChange={(event) => setAmount(event.target.value)} placeholder="0.000000"
            disabled={!bettingOpen || submitting} />
          <button type="button" className="player-gameplay-card__bet"
            disabled={!bettingOpen || !selected || !amount || submitting || status === 'loading'}
            onClick={() => void submit()}>{submitting ? 'Submitting…' : 'BET'}</button>
        </div>
      ) : (
        <div className="player-gameplay-card__position">
          <strong>Your position</strong>
          <span>{getHorseIdentity(positionSelectionId).name} · {formatNinesMinor(positionStakeMinor)} NINES</span>
          <span>Status: {won ? 'Won' : lost ? 'Lost' : settlementPending ? 'Settlement pending' :
            currentWager ? currentWager.status.replace(/_/g, ' ') : 'Accepted · balance syncing'}</span>
          {won && currentWager?.payoutMinor !== null && currentWager?.payoutMinor !== undefined
            ? <span>Payout: {formatNinesMinor(currentWager.payoutMinor)} NINES</span> : null}
          {winner ? <span>Winner: {getHorseIdentity(winner).name}</span> : null}
        </div>
      )}

      {(message || error || lastSubmission?.result === 'rejected') ? (
        <p className="player-gameplay-card__message" role="status">{message ?? error ?? lastSubmission?.rejectionCode}</p>
      ) : null}
    </section>
  )
})
