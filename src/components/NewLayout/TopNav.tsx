import React, { useMemo, useState } from 'react'
import { useRaceStore } from '../../state/raceStore'

const NAV_LINKS = ['Home', 'My Bets', 'Leaderboard', 'Replays', 'How to Play']

export const TopNav: React.FC = () => {
  const [active, setActive] = useState('Home')
  const { raceId, status } = useRaceStore()

  const statusText = useMemo(() => {
    if (status === 'running') return 'LIVE RACE'
    if (status === 'betsOpen') return 'ACCEPTING BETS'
    if (status === 'finished') return 'RESULTS'
    return 'CONNECTING'
  }, [status])

  return (
    <nav
      style={{
        background: 'linear-gradient(135deg, #4f8ef7 0%, #6c63ff 100%)',
        boxShadow: '0 4px 20px rgba(79,142,247,0.35)',
        fontFamily: "'Nunito', sans-serif",
      }}
      className="w-full px-8 py-0 flex items-center justify-between relative z-50"
    >
      <div className="flex items-center gap-3 py-2">
        <div
          style={{
            background: 'linear-gradient(135deg, #FFD700 0%, #FF8C00 100%)',
            boxShadow: '0 3px 0 #c96800, 0 5px 15px rgba(255,165,0,0.4)',
            borderRadius: '12px',
          }}
          className="px-3 py-1 flex items-center gap-1"
        >
          <span style={{ fontSize: '20px' }}>🏇</span>
          <span
            style={{
              color: '#fff',
              fontWeight: 900,
              fontSize: '18px',
              letterSpacing: '2px',
              textShadow: '0 2px 0 rgba(0,0,0,0.25)',
            }}
          >
            NINES
          </span>
        </div>
        <span
          style={{
            color: 'rgba(255,255,255,0.75)',
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '1px',
            textTransform: 'uppercase',
          }}
        >
          {raceId ?? 'Waiting for race'}
        </span>
      </div>

      <div className="flex items-center gap-1">
        {NAV_LINKS.map((link) => (
          <button
            key={link}
            onClick={() => setActive(link)}
            style={{
              fontWeight: 700,
              fontSize: '13px',
              borderRadius: '10px',
              padding: '6px 12px',
              transition: 'all 0.15s ease',
              background:
                active === link ? 'rgba(255,255,255,0.25)' : 'transparent',
              color: active === link ? '#fff' : 'rgba(255,255,255,0.75)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {link}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <div
          style={{
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '14px',
            border: '2px solid rgba(255,255,255,0.35)',
          }}
          className="flex items-center gap-2 px-3 py-1.5"
        >
          <span style={{ fontSize: '14px' }}>🟢</span>
          <div>
            <div
              style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: '9px',
                fontWeight: 700,
              }}
            >
              STATUS
            </div>
            <div style={{ color: '#fff', fontWeight: 900, fontSize: '14px' }}>
              {statusText}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: '-11px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, #ff4757 0%, #ff6b81 100%)',
          borderRadius: '20px',
          padding: '3px 12px',
          boxShadow: '0 4px 12px rgba(255,71,87,0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          border: '2px solid #fff',
        }}
      >
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#fff',
            animation: 'pulse 1.5s infinite',
          }}
        />
        <span
          style={{
            color: '#fff',
            fontWeight: 800,
            fontSize: '11px',
            letterSpacing: '1px',
          }}
        >
          {statusText}
        </span>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
      `}</style>
    </nav>
  )
}
