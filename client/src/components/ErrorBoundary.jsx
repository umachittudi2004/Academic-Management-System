// client/src/components/ErrorBoundary.jsx
import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('❌ Error caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container" style={{ paddingTop: 40 }}>
          <div className="card" style={{ 
            background: 'rgba(255,107,107,0.1)', 
            borderColor: 'rgba(255,107,107,0.3)',
            textAlign: 'center'
          }}>
            <h2 style={{ color: '#ffb0b0', marginBottom: 16 }}>
              ⚠️ Something went wrong
            </h2>
            <p className="muted" style={{ marginBottom: 24 }}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button 
              className="btn"
              onClick={() => window.location.reload()}
            >
              🔄 Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}