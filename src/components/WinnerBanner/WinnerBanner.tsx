import React from 'react'
import './WinnerBanner.css'

interface WinnerBannerProps {
  winnerName: string
  accentColor: string
  visible: boolean
  subtitle?: string
}

export const WinnerBanner: React.FC<WinnerBannerProps> = ({
  winnerName,
  accentColor,
  visible,
}) => {
  if (!visible) return null

  return (
    <div
      className="winner-banner-card winner-banner-card--visible"
      style={{ borderColor: accentColor }}
      role="status"
      aria-live="polite"
    >
      <div className="winner-banner-card__kicker">🏆 WINNER</div>
      <div className="winner-banner-card__name" style={{ color: accentColor }}>
        {winnerName}
      </div>
    </div>
  )
}
