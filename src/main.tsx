import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { ErrorBoundary } from './components/error-boundary.tsx'
import { IntervalTimer } from './components/interval-timer.tsx'
import { ThemeProvider } from './components/theme-provider.tsx'

import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <IntervalTimer />
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
)
