import { createContext } from 'react'
import type { CardsContextType } from './useCardsContext'

export const CardsContext = createContext<CardsContextType | undefined>(undefined)

