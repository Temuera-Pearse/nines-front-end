import React from 'react'
import { AppAuthUser } from '../../auth/AppAuthProvider'

interface UserHeaderProps {
  user: AppAuthUser | null
  balancePreview?: string
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return 'N'
  if (words.length === 1) return words[0].slice(0, 1).toUpperCase()
  return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase()
}

export const UserHeader: React.FC<UserHeaderProps> = React.memo(
  function UserHeader({ user, balancePreview }) {
    const displayName = user?.name ?? 'Nines Player'
    const email = user?.email ?? 'Signed in'
    const initials = getInitials(displayName)

    return (
      <div className="nines-dropdown-user-header" aria-hidden="true">
        <div className="nines-dropdown-user-avatar">{initials}</div>

        <div className="nines-dropdown-user-copy">
          <div className="nines-dropdown-user-name">{displayName}</div>
          <div className="nines-dropdown-user-email">{email}</div>
          {balancePreview ? (
            <div className="nines-dropdown-user-balance">{balancePreview}</div>
          ) : null}
        </div>
      </div>
    )
  },
)
