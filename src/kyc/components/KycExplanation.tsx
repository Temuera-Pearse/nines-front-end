import React from 'react'
import { IS_DEVELOPMENT } from '../../config/features'

export const KycExplanation: React.FC = () => (
  <div className="nines-kyc-explanation">
    <p>
      Identity verification is one account condition. Completing it does not
      guarantee access to any regulated feature.
    </p>
    {IS_DEVELOPMENT ? (
      <p className="nines-development-notice">
        Development verification only. No real identity check is performed.
      </p>
    ) : null}
  </div>
)
