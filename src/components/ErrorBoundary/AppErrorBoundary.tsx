import React from 'react'
import { IS_DEVELOPMENT } from '../../config/features'

interface AppErrorBoundaryState {
  error: Error | null
}

export class AppErrorBoundary extends React.Component<
  React.PropsWithChildren,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    error: null,
  }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[AppErrorBoundary] React startup/render error:', error, errorInfo)
  }

  render() {
    if (this.state.error) {
      return (
        <main className="nines-error-boundary" role="alert">
          <div className="nines-error-boundary__panel">
            <p className="nines-error-boundary__eyebrow">
              Nines could not start
            </p>
            <h1 className="nines-error-boundary__title">
              Something failed while loading the app.
            </h1>
            {IS_DEVELOPMENT ? (
              <pre className="nines-error-boundary__message">
                {this.state.error.message}
              </pre>
            ) : (
              <p className="nines-error-boundary__copy">
                Please reload the live race viewer.
              </p>
            )}
            <button
              className="nines-error-boundary__button"
              type="button"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          </div>
        </main>
      )
    }

    return this.props.children
  }
}
