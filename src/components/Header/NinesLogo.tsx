import React from 'react'

export const NinesLogo: React.FC = React.memo(function NinesLogo() {
  return (
    <a className="nines-logo" href="/" aria-label="Nines home">
      <span className="nines-logo-mark" aria-hidden="true">
        9
      </span>
      <span className="nines-logo-text">
        <span className="nines-logo-wordmark">NINES</span>
        <span className="nines-logo-subtitle">Premium racebook</span>
      </span>
    </a>
  )
})
