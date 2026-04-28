import React from 'react'

const Card: React.FC<{
  title: string
  headerBg: string
  children: React.ReactNode
}> = ({ title, headerBg, children }) => (
  <div
    style={{
      background:
        'linear-gradient(180deg, rgba(15,23,42,0.96), rgba(17,24,39,0.94))',
      borderRadius: '16px',
      border: '1px solid rgba(148,163,184,0.18)',
      boxShadow: '0 18px 40px rgba(2,6,23,0.28)',
      overflow: 'hidden',
    }}
  >
    <div
      style={{
        background: headerBg,
        padding: '4px 10px',
        color: '#fff',
        fontWeight: 900,
        fontSize: '11px',
      }}
    >
      {title}
    </div>
    <div style={{ padding: '6px 10px' }}>{children}</div>
  </div>
)

export const BottomWidgets: React.FC = () => {
  return (
    <div
      style={{
        display: 'block',
        flexShrink: 0,
      }}
    >
      <Card
        title="📢 Sponsored"
        headerBg="linear-gradient(135deg, #0f172a, #1d4ed8)"
      >
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '10px',
            minHeight: '184px',
            display: 'flex',
            alignItems: 'center',
            background:
              'linear-gradient(90deg, rgba(15,23,42,0.92), rgba(30,41,59,0.96), rgba(15,23,42,0.92))',
            border: '1px solid rgba(96,165,250,0.2)',
            padding: '14px 0',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              gap: '48px',
              whiteSpace: 'nowrap',
              paddingLeft: '100%',
              animation: 'bottom-widget-marquee 12s linear infinite',
              color: '#93c5fd',
              fontSize: '22px',
              fontWeight: 900,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            <span>Your ad here</span>
            <span>Your ad here</span>
            <span>Your ad here</span>
          </div>
        </div>

        <style>{`
          @keyframes bottom-widget-marquee {
            0% {
              transform: translate3d(-100%, 0, 0);
            }
            100% {
              transform: translate3d(0, 0, 0);
            }
          }
        `}</style>
      </Card>
    </div>
  )
}
