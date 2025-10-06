import { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'

export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

interface ToastContextType {
  toast: (options: Omit<Toast, 'id'>) => void
  dismissToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast(): ToastContextType {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useCallback((options: Omit<Toast, 'id'>) => {
    const id = crypto.randomUUID()
    const newToast: Toast = {
      id,
      ...options,
      duration: options.duration ?? 5000
    }

    setToasts(prev => {
      const updated = [...prev, newToast]
      return updated.slice(-4) // Keep max 4 toasts
    })

    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => dismissToast(id), newToast.duration)
    }
  }, [dismissToast])

  return (
    <ToastContext.Provider value={{ toast, dismissToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  )
}

interface ToastContainerProps {
  toasts: Toast[]
  onDismiss: (id: string) => void
}

function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div 
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

interface ToastItemProps {
  toast: Toast
  onDismiss: (id: string) => void
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const getStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100'
      case 'error':
        return 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100'
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100'
    }
  }

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return '✓'
      case 'error':
        return '✕'
      case 'info':
        return 'ℹ'
    }
  }

  return (
    <div
      role="alert"
      className={`
        ${getStyles()}
        border rounded-lg shadow-lg p-4 pointer-events-auto
        animate-toast-in
      `}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center font-bold text-lg">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">
            {toast.title}
          </p>
          {toast.message && (
            <p className="mt-1 text-sm opacity-90">
              {toast.message}
            </p>
          )}
        </div>
        <button
          onClick={() => onDismiss(toast.id)}
          className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current rounded"
          aria-label="Dismiss notification"
        >
          <span className="text-lg">×</span>
        </button>
      </div>
    </div>
  )
}
