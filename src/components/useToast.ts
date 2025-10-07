import { useContext } from 'react'
import { ToastContext } from './ToastContext'

export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

export interface ToastContextType {
  toast: (options: Omit<Toast, 'id'>) => void
  dismissToast: (id: string) => void
}

export function useToast(): ToastContextType {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

