import React from 'react'
import { useRaceHeaderTiming } from '../../state/useRaceHeaderTiming'

export const HeaderRaceTimer: React.FC = React.memo(function HeaderRaceTimer() {
  const headerTiming = useRaceHeaderTiming()

  return (
    <div className="nines-header-race-block nines-header-race-block--compact">
      <span className="nines-header-race-muted">
        {headerTiming.timerLabel}
      </span>
      {headerTiming.isLive ? (
        <span className="nines-header-status-chip">Racing live</span>
      ) : (
        <span className="nines-header-countdown-chip">
          {headerTiming.timerValue}
        </span>
      )}
    </div>
  )
})
