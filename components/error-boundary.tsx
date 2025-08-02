'use client'

import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return (
          <FallbackComponent
            error={this.state.error!}
            resetError={this.resetError}
          />
        )
      }

      return (
        <DefaultErrorFallback
          error={this.state.error!}
          resetError={this.resetError}
        />
      )
    }

    return this.props.children
  }
}

/**
 * Displays a user-friendly fallback UI when an error is caught by an error boundary.
 *
 * Shows error details for developers and provides options to refresh the page or retry rendering.
 *
 * @param error - The error object that was caught
 * @param resetError - Callback to reset the error state and attempt recovery
 */
function DefaultErrorFallback({
  error,
  resetError,
}: {
  error: Error
  resetError: () => void
}) {
  return (
    <div className='flex min-h-screen items-center justify-center p-6'>
      <Card className='cotton-candy-card w-full max-w-md rounded-2xl border-0 shadow-lg'>
        <CardContent className='p-8 text-center'>
          <AlertTriangle className='mx-auto mb-4 size-16 text-red-500' />
          <h2 className='mb-2 text-2xl font-bold text-gray-800'>
            Oops! Terjadi Kesalahan
          </h2>
          <p className='mb-4 text-gray-600'>
            Aplikasi mengalami masalah. Silakan coba refresh halaman atau
            hubungi administrator.
          </p>
          <details className='mb-6 text-left'>
            <summary className='cursor-pointer text-sm text-gray-500 hover:text-gray-700'>
              Detail Error (untuk developer)
            </summary>
            <pre className='mt-2 max-h-32 overflow-auto rounded bg-gray-100 p-2 text-xs'>
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
          <div className='flex gap-3'>
            <Button
              onClick={() => window.location.reload()}
              variant='outline'
              className='flex-1 border-pink-200 hover:bg-pink-50'
            >
              <RefreshCw className='mr-2 size-4' />
              Refresh Halaman
            </Button>
            <Button
              onClick={resetError}
              className='cotton-candy-button flex-1 from-pink-400 to-purple-400'
            >
              Coba Lagi
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Returns a callback for handling errors in functional React components.
 *
 * The returned function logs the provided error and optional component stack trace to the console.
 */
export function useErrorHandler() {
  return (error: Error, errorInfo?: { componentStack: string }) => {
    console.error('Error caught by useErrorHandler:', error, errorInfo)
    // Bisa ditambahkan error reporting service di sini
  }
}
