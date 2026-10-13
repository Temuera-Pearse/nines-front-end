import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AppAuthProvider } from './auth/AppAuthProvider'
import { AppErrorBoundary } from './components/ErrorBoundary/AppErrorBoundary'
import { redirectDisabledFrontendRoute } from './config/disabledRoutes'
import { PlayerAccountProvider } from './player/PlayerAccountProvider'
import { PlayerGameplayProvider } from './gameplay/PlayerGameplayProvider'
import './index.css'

redirectDisabledFrontendRoute()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <AppAuthProvider>
        <PlayerAccountProvider>
          <PlayerGameplayProvider>
            <App />
          </PlayerGameplayProvider>
        </PlayerAccountProvider>
      </AppAuthProvider>
    </AppErrorBoundary>
  </React.StrictMode>,
)
