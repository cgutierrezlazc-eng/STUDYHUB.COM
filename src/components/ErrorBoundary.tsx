import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle } from './Icons'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-primary, #1a1a2e)',
          color: 'var(--text-primary, #e0e0e0)',
          flexDirection: 'column',
          gap: 16,
          padding: 24,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 48 }}>{AlertTriangle({ size: 48 })}</div>
          <h2 style={{ margin: 0, fontSize: 22 }}>Algo salió mal</h2>
          <p style={{ margin: 0, color: 'var(--text-secondary, #999)', maxWidth: 400 }}>
            Ha ocurrido un error inesperado. Puedes intentar recargar la página.
          </p>
          <button
            onClick={this.handleRetry}
            style={{
              padding: '10px 24px',
              background: 'var(--accent, #4f8cff)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 15,
              fontWeight: 600,
              marginTop: 8,
            }}
          >
            Intentar de nuevo
          </button>
          {this.state.error && (
            <details style={{ marginTop: 16, color: 'var(--text-secondary, #666)', fontSize: 12, maxWidth: 500 }}>
              <summary style={{ cursor: 'pointer' }}>Detalles del error</summary>
              <pre style={{ whiteSpace: 'pre-wrap', textAlign: 'left', marginTop: 8 }}>
                {this.state.error.message}
              </pre>
            </details>
          )}
        </div>
      )
    }

    return this.props.children
  }
}
