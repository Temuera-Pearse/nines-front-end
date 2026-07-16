import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AppAuthProvider } from './auth/AppAuthProvider'
import { AppErrorBoundary } from './components/ErrorBoundary/AppErrorBoundary'
import { redirectDisabledFrontendRoute } from './config/disabledRoutes'
import './index.css'

redirectDisabledFrontendRoute()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <AppAuthProvider>
        <App />
      </AppAuthProvider>
    </AppErrorBoundary>
  </React.StrictMode>,
)
