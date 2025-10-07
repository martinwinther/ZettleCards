import { createContext } from 'react'
import type { ToastContextType } from './useToast'

export const ToastContext = createContext<ToastContextType | undefined>(undefined)

