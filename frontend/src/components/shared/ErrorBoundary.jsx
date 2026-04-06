// Description: Global error boundary — catches React render errors and displays a styled
// fallback with error message, stack trace (collapsed), and retry button.
// Wraps all route components to prevent full-page crashes.

import { Component } from 'react'
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      showStack: false,
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, showStack: false })
  }

  toggleStack = () => {
    this.setState((prev) => ({ showStack: !prev.showStack }))
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="flex flex-col items-center justify-center h-full w-full px-6"
          style={{ background: 'var(--bg-void)' }}
        >
          <div
            className="flex flex-col items-center gap-4 max-w-md w-full p-6 rounded-xl"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-dim)',
              boxShadow: '0 8px 40px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Error icon */}
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
              }}
            >
              <AlertTriangle size={24} style={{ color: 'var(--status-error)' }} />
            </div>

            <div className="text-center space-y-1">
              <h2
                className="text-base font-semibold"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: 'var(--text-primary)',
                }}
              >
                Something went wrong
              </h2>
              <p
                className="text-xs"
                style={{
                  fontFamily: 'var(--font-body)',
                  color: 'var(--text-secondary)',
                }}
              >
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
            </div>

            {/* Stack trace (collapsible) */}
            {this.state.error?.stack && (
              <div className="w-full">
                <button
                  onClick={this.toggleStack}
                  className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest transition-colors duration-150"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-dim)',
                  }}
                >
                  {this.state.showStack ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  Stack trace
                </button>

                {this.state.showStack && (
                  <pre
                    className="mt-2 p-3 rounded-lg text-[10px] leading-relaxed overflow-auto"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-dim)',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-dim)',
                      maxHeight: 200,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                    }}
                  >
                    {this.state.error.stack}
                  </pre>
                )}
              </div>
            )}

            {/* Retry button */}
            <button
              onClick={this.handleRetry}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
              style={{
                fontFamily: 'var(--font-display)',
                background: 'var(--accent-subtle)',
                color: 'var(--accent-bright)',
                border: '1px solid var(--accent)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(124, 58, 237, 0.15)'
                e.currentTarget.style.boxShadow = '0 0 20px var(--accent-glow)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--accent-subtle)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <RefreshCw size={14} />
              Try Again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
