import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from './components/theme-provider.tsx'
import { IntervalTimer } from './components/interval-timer.tsx'

import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <IntervalTimer />
    </ThemeProvider>
  </StrictMode>,
)
