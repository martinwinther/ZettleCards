import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import { router } from './routes'
import { CardsProvider } from './lib/CardsContext'
import ErrorBoundary from './components/ErrorBoundary'
import { ToastProvider } from './components/Toaster'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <CardsProvider>
          <RouterProvider router={router} />
        </CardsProvider>
      </ToastProvider>
    </ErrorBoundary>
  </StrictMode>,
)
