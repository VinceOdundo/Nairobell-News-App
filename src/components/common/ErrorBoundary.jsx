import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { DatabaseService } from '../../services/databaseService'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // Log error to database
    DatabaseService.logError(error, {
      component: this.props.componentName || 'Unknown',
      errorInfo: errorInfo.componentStack,
      props: this.props.errorContext || {}
    }).catch(logError => {
      console.error('Failed to log error to database:', logError)
    })

    // Log to console for development
    console.error('Error Boundary caught an error:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: this.state.retryCount + 1
    })
  }

  render() {
    if (this.state.hasError) {
      const isProductionError = process.env.NODE_ENV === 'production'
      
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Oops! Something went wrong
            </h2>
            
            <p className="text-gray-600 mb-6">
              {isProductionError 
                ? "We're sorry, but something unexpected happened. Our team has been notified."
                : this.state.error?.message || 'An unexpected error occurred'
              }
            </p>
            
            {!isProductionError && this.state.errorInfo && (
              <details className="text-left bg-gray-100 p-4 rounded-lg mb-4 text-xs">
                <summary className="cursor-pointer font-medium text-gray-700">
                  Technical Details
                </summary>
                <pre className="mt-2 text-gray-600 overflow-auto">
                  {this.state.error?.stack}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            
            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Reload Page
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="w-full px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Go Home
              </button>
            </div>
            
            <div className="mt-6 text-xs text-gray-400">
              Error ID: {Date.now().toString(36)}
              {this.state.retryCount > 0 && ` (Retry ${this.state.retryCount})`}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary