'use client'

import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface MapErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface MapErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

class MapErrorBoundary extends React.Component<MapErrorBoundaryProps, MapErrorBoundaryState> {
  constructor(props: MapErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): MapErrorBoundaryState {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Map component error:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center p-6">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Không thể tải bản đồ
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Có lỗi xảy ra khi hiển thị bản đồ. Vui lòng thử lại.
            </p>
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Thử lại
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default MapErrorBoundary 