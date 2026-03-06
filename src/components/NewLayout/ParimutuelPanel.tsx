import React, { useMemo, useState } from 'react'
import { useBetStore } from '../../state/betStore'
import { useRaceStore } from '../../state/raceStore'
import { getHorseIdentity } from '../../utils/raceHelpers'

const QUICK_BETS = [5, 10, 25, 50, 100]
const HOUSE_PCT = 0.15

export const ParimutuelPanel: React.FC = () => {
  const { horses, status } = useRaceStore()
  const { selectedHorse, amount, setSelectedHorse, setAmount, placeBet } =
    useBetStore()
  const [placing, setPlacing] = useState(false)
  const [message, setMessage] = useState<string>('')

  const pools = useMemo(() => {
    const rows = horses.length
      ? horses
      : Array.from({ length: 10 }, (_, i) => ({
          id: `horse-${i}`,
          position: 0,
        }))

    return rows.map((h, i) => ({
      id: h.id,
      amount: 500 + (i + 1) * 220 + Math.round(h.position * 1.5),
    }))
  }, [horses])

  const total = pools.reduce((a, b) => a + b.amount, 0)
  const net = Math.round(total * (1 - HOUSE_PCT))

  const selectedPool = pools.find((p) => p.id === selectedHorse)?.amount ?? 0
  const estReturn =
    selectedPool > 0 && amount > 0
      ? ((amount / selectedPool) * net).toFixed(2)
      : '0.00'

  const onPlace = async () => {
    setMessage('')
    setPlacing(true)
    try {
      await placeBet()
      setMessage('Bet placed successfully')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Failed to place bet')
    } finally {
      setPlacing(false)
    }
  }

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: '20px',
        border: '2px solid rgba(0,0,0,0.05)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #4f8ef7 0%, #6c63ff 100%)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>🏆</span>
          <span style={{ color: '#fff', fontWeight: 900, fontSize: '15px' }}>
            Win Pool
          </span>
          <span
            style={{
              background: 'rgba(255,255,255,0.25)',
              borderRadius: '8px',
              padding: '2px 8px',
              color: '#fff',
              fontWeight: 700,
              fontSize: '11px',
            }}
          >
            PARIMUTUEL
          </span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: '10px',
              fontWeight: 700,
            }}
          >
            NET POOL
          </div>
          <div
            style={{
              color: '#fff',
              fontWeight: 900,
              fontSize: '18px',
              lineHeight: 1,
            }}
          >
            ${net.toLocaleString()}
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '34px 1fr 52px 68px 58px',
          gap: '4px',
          padding: '7px 12px 5px',
          borderBottom: '1.5px solid #f1f5f9',
        }}
      >
        {['#', 'HORSE', 'POOL %', 'AMOUNT', 'PAYOUT'].map((h) => (
          <span
            key={h}
            style={{
              color: '#94a3b8',
              fontWeight: 800,
              fontSize: '10px',
              textAlign: h === 'HORSE' || h === '#' ? 'left' : 'right',
            }}
          >
            {h}
          </span>
        ))}
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {pools.map((entry) => {
          const identity = getHorseIdentity(entry.id)
          const pct =
            total > 0 ? ((entry.amount / total) * 100).toFixed(1) : '0.0'
          const payout =
            entry.amount > 0 ? (net / entry.amount).toFixed(2) : '0.0'
          const isSelected = selectedHorse === entry.id
          return (
            <button
              key={entry.id}
              onClick={() => setSelectedHorse(isSelected ? null : entry.id)}
              style={{
                width: '100%',
                display: 'grid',
                gridTemplateColumns: '34px 1fr 52px 68px 58px',
                gap: '4px',
                padding: '8px 12px',
                border: 'none',
                borderBottom: '1px solid #f8fafc',
                textAlign: 'left',
                cursor: 'pointer',
                background: isSelected ? `${identity.hex}18` : 'transparent',
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '8px',
                  background: identity.hex,
                  color: '#fff',
                  fontWeight: 900,
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {identity.number}
              </div>
              <div>
                <div
                  style={{
                    color: '#1e293b',
                    fontWeight: 800,
                    fontSize: '12px',
                  }}
                >
                  {identity.name}
                </div>
              </div>
              <div
                style={{
                  textAlign: 'right',
                  color: '#475569',
                  fontWeight: 800,
                  fontSize: '12px',
                }}
              >
                {pct}%
              </div>
              <div
                style={{
                  textAlign: 'right',
                  color: '#64748b',
                  fontWeight: 700,
                  fontSize: '11px',
                }}
              >
                ${entry.amount.toLocaleString()}
              </div>
              <div
                style={{
                  textAlign: 'right',
                  color: '#16a34a',
                  fontWeight: 900,
                  fontSize: '13px',
                }}
              >
                {payout}x
              </div>
            </button>
          )
        })}
      </div>

      <div style={{ padding: '12px 14px', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ marginBottom: '8px' }}>
          <input
            type="number"
            value={amount || ''}
            onChange={(e) => setAmount(Number(e.target.value || 0))}
            placeholder="Stake amount"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '2px solid #e2e8f0',
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '16px',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
          {QUICK_BETS.map((v) => (
            <button
              key={v}
              onClick={() => setAmount(v)}
              style={{
                flex: 1,
                padding: '6px 0',
                background: amount === v ? '#4f8ef7' : '#f1f5f9',
                color: amount === v ? '#fff' : '#475569',
                border: 'none',
                borderRadius: '9px',
                fontWeight: 800,
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              ${v}
            </button>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px',
          }}
        >
          <span style={{ color: '#64748b', fontWeight: 700, fontSize: '12px' }}>
            📈 Est. Return
          </span>
          <span style={{ color: '#16a34a', fontWeight: 900, fontSize: '18px' }}>
            ${estReturn}
          </span>
        </div>

        <button
          onClick={onPlace}
          disabled={
            placing || status !== 'betsOpen' || !selectedHorse || amount <= 0
          }
          style={{
            width: '100%',
            padding: '10px 14px',
            background:
              status === 'betsOpen'
                ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                : 'linear-gradient(135deg, #94a3b8, #64748b)',
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            fontWeight: 900,
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          {placing
            ? 'Placing...'
            : status === 'betsOpen'
              ? 'Place Bet'
              : 'Bets Closed'}
        </button>

        {!!message && (
          <div
            style={{
              marginTop: '8px',
              fontSize: '12px',
              fontWeight: 700,
              color: message.toLowerCase().includes('success')
                ? '#16a34a'
                : '#ef4444',
            }}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  )
}
