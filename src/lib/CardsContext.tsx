import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import { useCards } from './useCards'
import type { Card } from './types'

interface CardsContextType {
  cards: Card[]
  addCards: (newCards: Card[]) => Promise<void>
  addCard: (card: Card) => Promise<void>
  updateCard: (id: string, updates: Partial<Card>) => Promise<void>
  removeCard: (id: string) => Promise<void>
  clearCards: () => Promise<void>
  replaceAll: (newCards: Card[]) => Promise<void>
}

const CardsContext = createContext<CardsContextType | undefined>(undefined)

export function CardsProvider({ children }: { children: ReactNode }) {
  const cardsState = useCards()
  
  return (
    <CardsContext.Provider value={cardsState}>
      {children}
    </CardsContext.Provider>
  )
}

export function useCardsContext(): CardsContextType {
  const context = useContext(CardsContext)
  if (context === undefined) {
    throw new Error('useCardsContext must be used within a CardsProvider')
  }
  return context
}
