import { Component, type ErrorInfo, type ReactNode } from 'react'
import { postMessage } from '../lib/vscode-api'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  errorMessage: string
}

const INITIAL_STATE: ErrorBoundaryState = {
  hasError: false,
  errorMessage: '',
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = INITIAL_STATE

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'Unexpected error',
    }
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    postMessage({
      type: 'webviewError',
      payload: {
        message: error.message || 'Unexpected error',
        stack: error.stack,
        componentStack: errorInfo.componentStack ?? undefined,
      },
    })
  }

  private readonly handleRetry = (): void => {
    this.setState(INITIAL_STATE)
  }

  public override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="app">
          <div className="error-state" role="alert">
            <h2>Something went wrong</h2>
            <p className="error-message">{this.state.errorMessage}</p>
            <button type="button" className="retry-button" onClick={this.handleRetry}>
              Retry
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
