import * as React from 'react'
import { AlertTriangleIcon, RotateCcwIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ErrorBoundaryProps = {
  children: React.ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className={cn(
            'bg-background text-foreground flex min-h-dvh w-full flex-col items-center justify-center gap-6 px-6',
          )}
        >
          <div
            className={cn(
              'bg-destructive/10 text-destructive flex h-16 w-16 items-center justify-center rounded-full',
            )}
          >
            <AlertTriangleIcon className={cn('h-8 w-8')} />
          </div>

          <div className={cn('text-center')}>
            <h1 className={cn('text-xl font-semibold')}>Something went wrong</h1>
            <p className={cn('text-muted-foreground mt-2 max-w-md text-sm')}>
              An unexpected error occurred. You can try resetting the app or reloading the page.
            </p>
          </div>

          {this.state.error && (
            <pre
              className={cn(
                'bg-muted text-muted-foreground max-w-md overflow-auto rounded-lg p-4 text-xs',
              )}
            >
              {this.state.error.message}
            </pre>
          )}

          <div className={cn('flex items-center gap-3')}>
            <Button onClick={this.handleReset} variant="outline">
              <RotateCcwIcon className={cn('h-4 w-4')} />
              Try again
            </Button>
            <Button onClick={this.handleReload}>Reload page</Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
