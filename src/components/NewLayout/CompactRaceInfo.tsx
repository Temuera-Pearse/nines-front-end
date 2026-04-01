import React from 'react'
import { useRaceStore } from '../../state/raceStore'
import { useRaceHeaderTiming } from '../../state/useRaceHeaderTiming'

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
  const { raceId, horses } = useRaceStore()
  const headerTiming = useRaceHeaderTiming()

  const runnerCount = horses.length > 0 ? horses.length : 10
  const totalPool = 0
  const housePct = 15
  const netPool = Math.round(totalPool * (1 - housePct / 100))

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
            {runnerCount} Runners
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
            {headerTiming.timerLabel}
          </span>
          {headerTiming.isLive ? (
            <span
              style={{
                background: headerTiming.accent,
                color: '#fff',
                fontWeight: 900,
                fontSize: '14px',
                borderRadius: '10px',
                padding: '4px 12px',
                boxShadow: '0 2px 0 #15803d',
              }}
            >
              RACING LIVE
            </span>
          ) : (
            <span
              style={{
                background: headerTiming.accent,
                color: '#fff',
                fontWeight: 900,
                fontSize: '22px',
                borderRadius: '12px',
                padding: '4px 14px',
              }}
            >
              {headerTiming.timerValue}
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
          <Stat label="STATE" value={headerTiming.stateLabel} color="#a855f7" />
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
              background: headerTiming.pulseColor,
              boxShadow: `0 0 0 3px ${headerTiming.pulseColor}40`,
              animation: 'cpulse 1.4s infinite',
            }}
          />
          <span
            style={{
              color: headerTiming.pulseColor,
              fontWeight: 800,
              fontSize: '12px',
            }}
          >
            {headerTiming.stateLabel}
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
