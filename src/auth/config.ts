import { FRONTEND_AUTH_ENABLED } from '../config/features'
import {
  assertPlayerIntegrationConfiguration,
  PLAYER_INTEGRATION_CONFIG,
} from '../config/playerIntegration'

export interface Auth0RuntimeConfig {
  domain: string
  clientId: string
  audience: string
  ninesApiUrl: string
  cacheLocation: 'memory' | 'localstorage'
  isEnabled: boolean
}

assertPlayerIntegrationConfiguration()

export const AUTH0_CONFIG: Auth0RuntimeConfig = {
  domain: PLAYER_INTEGRATION_CONFIG.auth0Domain,
  clientId: PLAYER_INTEGRATION_CONFIG.auth0ClientId,
  audience: PLAYER_INTEGRATION_CONFIG.auth0Audience,
  ninesApiUrl: PLAYER_INTEGRATION_CONFIG.ninesApiUrl,
  cacheLocation: 'localstorage',
  isEnabled: FRONTEND_AUTH_ENABLED,
}
