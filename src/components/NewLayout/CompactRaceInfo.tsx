import React, { useEffect, useMemo, useState } from 'react'
import { useRaceStore } from '../../state/raceStore'

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

const Stat: React.FC<{
  label: string
  value: string
  color: string
  big?: boolean
}> = ({ label, value, color, big }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
    <span style={{ color: '#94a3b8', fontWeight: 700, fontSize: '10px' }}>
      {label}
    </span>
    <span
      style={{
        color,
        fontWeight: 900,
        fontSize: big ? '17px' : '14px',
        lineHeight: 1,
      }}
    >
      {value}
    </span>
  </div>
)

export const CompactRaceInfo: React.FC = () => {
  const { raceId, status, horses } = useRaceStore()
  const clockMs = useClockMs()

  const msUntil30 =
    clockMs <= 30_000 ? 30_000 - clockMs : 60_000 - clockMs + 30_000
  const racingActive = status === 'running'
  const totalPool =
    24000 + horses.reduce((acc, h) => acc + Math.round(h.position), 0)
  const housePct = 15
  const netPool = Math.round(totalPool * (1 - housePct / 100))

  const mm = String(Math.floor(msUntil30 / 1000 / 60)).padStart(2, '0')
  const ss = String(Math.floor(msUntil30 / 1000) % 60).padStart(2, '0')

  const pulseLabel = useMemo(() => {
    if (racingActive) return 'RACE IN PROGRESS'
    if (status === 'betsOpen') return 'ACCEPTING BETS'
    if (status === 'finished') return 'RACE COMPLETE'
    return 'SYNCING'
  }, [racingActive, status])

  return (
    <div
      style={{
        background:
          'linear-gradient(135deg, #fff9f0 0%, #fff 50%, #f0f7ff 100%)',
        borderRadius: '16px',
        border: '2px solid rgba(255,255,255,0.9)',
        boxShadow: '0 4px 16px rgba(79,142,247,0.1)',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          height: '4px',
          background:
            'linear-gradient(90deg, #4f8ef7, #6c63ff, #f472b6, #fb923c, #4ade80)',
        }}
      />

      <div
        style={{ display: 'flex', alignItems: 'center', padding: '8px 20px' }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            paddingRight: '20px',
            borderRight: '1.5px solid #e2e8f0',
          }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #4f8ef7, #6c63ff)',
              borderRadius: '12px',
              padding: '4px 12px',
              boxShadow: '0 2px 0 #3b5fc0',
            }}
          >
            <span style={{ color: '#fff', fontWeight: 900, fontSize: '11px' }}>
              {raceId ?? 'RACE'}
            </span>
          </div>
          <span style={{ color: '#64748b', fontWeight: 700, fontSize: '12px' }}>
            🏟️ Sunridge Downs · 1000m · {Math.max(horses.length, 1)} Runners
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '0 20px',
            borderRight: '1.5px solid #e2e8f0',
          }}
        >
          <span style={{ color: '#94a3b8', fontWeight: 700, fontSize: '11px' }}>
            {racingActive ? 'RACING' : 'STARTS IN'}
          </span>
          {racingActive ? (
            <span
              style={{
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                color: '#fff',
                fontWeight: 900,
                fontSize: '14px',
                borderRadius: '10px',
                padding: '4px 12px',
                boxShadow: '0 2px 0 #15803d',
              }}
            >
              🏁 LIVE
            </span>
          ) : (
            <span
              style={{
                background:
                  msUntil30 <= 10_000
                    ? 'linear-gradient(135deg, #ff4757, #ff6b81)'
                    : 'linear-gradient(135deg, #4f8ef7, #6c63ff)',
                color: '#fff',
                fontWeight: 900,
                fontSize: '22px',
                borderRadius: '12px',
                padding: '4px 14px',
              }}
            >
              {mm}:{ss}
            </span>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            padding: '0 20px',
            borderRight: '1.5px solid #e2e8f0',
            flex: 1,
          }}
        >
          <Stat
            label="TOTAL POOL"
            value={`$${totalPool.toLocaleString()}`}
            color="#4f8ef7"
            big
          />
          <Stat label="HOUSE TAKE" value={`${housePct}%`} color="#f97316" />
          <Stat
            label="NET POOL"
            value={`$${netPool.toLocaleString()}`}
            color="#22c55e"
            big
          />
          <Stat label="STATE" value={status.toUpperCase()} color="#a855f7" />
        </div>

        <div
          style={{
            paddingLeft: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: racingActive ? '#22c55e' : '#f97316',
              boxShadow: racingActive
                ? '0 0 0 3px rgba(34,197,94,0.25)'
                : '0 0 0 3px rgba(249,115,22,0.25)',
              animation: 'cpulse 1.4s infinite',
            }}
          />
          <span
            style={{
              color: racingActive ? '#22c55e' : '#f97316',
              fontWeight: 800,
              fontSize: '12px',
            }}
          >
            {pulseLabel}
          </span>
        </div>
      </div>

      <style>{`
        @keyframes cpulse {
          0%,100% { opacity:1; transform:scale(1); }
          50% { opacity:0.5; transform:scale(0.8); }
        }
      `}</style>
    </div>
  )
}
