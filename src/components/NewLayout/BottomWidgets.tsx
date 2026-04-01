import React, { useMemo } from 'react'
import { useBetStore } from '../../state/betStore'
import { useRaceStore } from '../../state/raceStore'
import { getHorseIdentity } from '../../utils/raceHelpers'

const Card: React.FC<{
  title: string
  headerBg: string
  children: React.ReactNode
}> = ({ title, headerBg, children }) => (
  <div
    style={{
      background: '#fff',
      borderRadius: '16px',
      border: '2px solid rgba(0,0,0,0.05)',
      boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
      overflow: 'hidden',
    }}
  >
    <div
      style={{
        background: headerBg,
        padding: '8px 14px',
        color: '#fff',
        fontWeight: 900,
        fontSize: '13px',
      }}
    >
      {title}
    </div>
    <div style={{ padding: '10px 14px' }}>{children}</div>
  </div>
)

export const BottomWidgets: React.FC = () => {
  const { selectedHorse, amount } = useBetStore()
  const { winner, lastResult, status } = useRaceStore()

  const winnerIdentity = useMemo(() => {
    const id = winner ?? lastResult?.winner
    return id ? getHorseIdentity(id) : null
  }, [winner, lastResult])

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '10px',
        flexShrink: 0,
      }}
    >
      <Card
        title="🎫 Your Active Bet"
        headerBg="linear-gradient(135deg, #f97316, #fb923c)"
      >
        {selectedHorse ? (
          <>
            <div
              style={{ color: '#1e293b', fontWeight: 800, fontSize: '12px' }}
            >
              {getHorseIdentity(selectedHorse).name}
            </div>
            <div
              style={{ color: '#64748b', fontWeight: 700, fontSize: '11px' }}
            >
              Stake: ${amount.toFixed(2)}
            </div>
          </>
        ) : (
          <div style={{ color: '#64748b', fontWeight: 700, fontSize: '12px' }}>
            Select a horse to place a bet.
          </div>
        )}
      </Card>

      <Card
        title="🏁 Recent Results"
        headerBg="linear-gradient(135deg, #22c55e, #16a34a)"
      >
        {winnerIdentity ? (
          <>
            <div
              style={{ color: '#1e293b', fontWeight: 800, fontSize: '12px' }}
            >
              Winner: {winnerIdentity.name}
            </div>
            <div
              style={{ color: '#64748b', fontSize: '11px', fontWeight: 700 }}
            >
              Status: {status}
            </div>
          </>
        ) : (
          <div style={{ color: '#64748b', fontSize: '12px', fontWeight: 700 }}>
            No finished race yet.
          </div>
        )}
      </Card>
    </div>
  )
}
