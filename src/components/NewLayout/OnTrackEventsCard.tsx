import React from 'react'
import { useRaceStore } from '../../state/raceStore'
import { selectRecentEventFeedEntries } from '../../state/raceSelectors'

export const OnTrackEventsCard: React.FC = () => {
  const eventFeed = useRaceStore(selectRecentEventFeedEntries)

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: '16px',
        border: '2px solid rgba(0,0,0,0.05)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        flex: '1 1 0',
        height: '100%',
        maxHeight: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #a855f7, #6c63ff)',
          padding: '8px 14px',
          color: '#fff',
          fontWeight: 900,
          fontSize: '13px',
          flexShrink: 0,
        }}
      >
        📣 On-Track Events
      </div>
      <div
        style={{
          padding: '14px',
          display: 'flex',
          flex: '1 1 0',
          flexDirection: 'column',
          gap: '14px',
          height: 0,
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            color: '#64748b',
            fontWeight: 700,
            fontSize: '12px',
            lineHeight: 1.5,
          }}
        >
          New events appear at the top and older calls move down the list.
        </div>

        <div
          style={{
            display: 'flex',
            flex: '1 1 0',
            flexDirection: 'column',
            gap: '8px',
            height: 0,
            minHeight: 0,
            maxHeight: '100%',
            overflowY: 'auto',
            paddingRight: '4px',
          }}
        >
          {eventFeed.length > 0 ? (
            eventFeed.map((eventEntry, index) => (
              <div
                key={eventEntry.id}
                style={{
                  background: eventEntry.usesHorseAccent
                    ? `${eventEntry.accentColor}1a`
                    : index === 0
                      ? 'rgba(148,163,184,0.18)'
                      : '#f8fafc',
                  border:
                    eventEntry.usesHorseAccent
                      ? `1px solid ${eventEntry.accentColor}55`
                      : '1px solid rgba(148,163,184,0.18)',
                  borderLeft: `4px solid ${eventEntry.accentColor}`,
                  borderRadius: '12px',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                }}
              >
                <span
                  style={{
                    color: eventEntry.accentColor,
                    fontWeight: 900,
                    fontSize: '10px',
                    letterSpacing: '0.08em',
                    lineHeight: '18px',
                    flexShrink: 0,
                  }}
                >
                  {index === 0
                    ? 'LIVE'
                    : `#${String(index + 1).padStart(2, '0')}`}
                </span>
                <span
                  style={{
                    color: eventEntry.usesHorseAccent
                      ? eventEntry.accentColor
                      : '#1e293b',
                    fontWeight: index === 0 ? 800 : 700,
                    fontSize: '13px',
                    lineHeight: 1.4,
                  }}
                >
                  {eventEntry.message}
                </span>
              </div>
            ))
          ) : (
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid rgba(148,163,184,0.18)',
                borderRadius: '12px',
                padding: '10px 12px',
                color: '#475569',
                fontWeight: 700,
                fontSize: '13px',
                lineHeight: 1.4,
              }}
            >
              Live event feed arms when the race starts.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
