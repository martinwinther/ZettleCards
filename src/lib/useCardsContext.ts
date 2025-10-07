import { useContext } from 'react'
import { CardsContext } from './cardsContextInstance'
import type { Card } from './types'

export interface CardsContextType {
  cards: Card[]
  addCards: (newCards: Card[]) => Promise<void>
  addCard: (card: Card) => Promise<void>
  updateCard: (id: string, updates: Partial<Card>) => Promise<void>
  bulkUpdateCards: (ids: string[], updates: Partial<Card>) => Promise<void>
  removeCard: (id: string) => Promise<void>
  clearCards: () => Promise<void>
  replaceAll: (newCards: Card[]) => Promise<void>
  reload: () => Promise<void>
}

export function useCardsContext(): CardsContextType {
  const context = useContext(CardsContext)
  if (context === undefined) {
    throw new Error('useCardsContext must be used within a CardsProvider')
  }
  return context
}

