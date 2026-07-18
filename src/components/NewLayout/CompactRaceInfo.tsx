import React from 'react'
import { HORSE_COUNT } from '../../constants/raceParticipants'
import { useRaceStore } from '../../state/raceStore'
import { useRaceHeaderTiming } from '../../state/useRaceHeaderTiming'
import { formatRaceRef } from '../../utils/raceRef'

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
  const { raceRef, horses } = useRaceStore()
  const headerTiming = useRaceHeaderTiming()

  const runnerCount = horses.length > 0 ? horses.length : HORSE_COUNT
  const totalPool = 0
  const housePct = 15
  const netPool = Math.round(totalPool * (1 - housePct / 100))

  return (
    <div
      className="compact-race-info"
      style={{
        background:
          'linear-gradient(135deg, #fff9f0 0%, #fff 50%, #f0f7ff 100%)',
        borderRadius: '14px',
        border: '2px solid rgba(255,255,255,0.9)',
        boxShadow: '0 3px 12px rgba(79,142,247,0.08)',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          height: '3px',
          background:
            'linear-gradient(90deg, #4f8ef7, #6c63ff, #f472b6, #fb923c, #4ade80)',
        }}
      />

      <div
        className="compact-race-info__content"
        style={{ display: 'flex', alignItems: 'center', padding: '6px 14px' }}
      >
        <div
          className="compact-race-info__race-block"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            paddingRight: '14px',
            borderRight: '1.5px solid #e2e8f0',
          }}
        >
          <div
            className="compact-race-info__race-chip"
            style={{
              background: 'linear-gradient(135deg, #4f8ef7, #6c63ff)',
              borderRadius: '12px',
              padding: '3px 10px',
              boxShadow: '0 2px 0 #3b5fc0',
            }}
          >
            <span
              className="compact-race-info__race-chip-text"
              style={{ color: '#fff', fontWeight: 900, fontSize: '10px' }}
              title={formatRaceRef(raceRef)}
            >
              {formatRaceRef(raceRef)}
            </span>
          </div>
          <span style={{ color: '#64748b', fontWeight: 700, fontSize: '11px' }}>
            {runnerCount} Runners
          </span>
        </div>

        <div
          className="compact-race-info__timer-block"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '0 14px',
            borderRight: '1.5px solid #e2e8f0',
          }}
        >
          <span style={{ color: '#94a3b8', fontWeight: 700, fontSize: '10px' }}>
            {headerTiming.timerLabel}
          </span>
          {headerTiming.isLive ? (
            <span
              style={{
                background: headerTiming.accent,
                color: '#fff',
                fontWeight: 900,
                fontSize: '12px',
                borderRadius: '10px',
                padding: '3px 10px',
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
                fontSize: '18px',
                borderRadius: '12px',
                padding: '3px 12px',
              }}
            >
              {headerTiming.timerValue}
            </span>
          )}
        </div>

        <div
          className="compact-race-info__pool-block"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '0 14px',
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
          className="compact-race-info__state-block"
          style={{
            paddingLeft: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
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
              fontSize: '11px',
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
