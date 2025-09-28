import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import { router } from './routes'
import { CardsProvider } from './lib/CardsContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CardsProvider>
      <RouterProvider router={router} />
    </CardsProvider>
  </StrictMode>,
)
