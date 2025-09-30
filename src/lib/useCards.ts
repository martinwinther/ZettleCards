import { useState, useCallback } from 'react'
import type { Card } from './types'

interface CardsState {
  cards: Card[]
  addCards: (newCards: Card[]) => void
  addCard: (card: Card) => void
  updateCard: (id: string, updates: Partial<Card>) => void
  removeCard: (id: string) => void
  clearCards: () => void
  replaceAll: (newCards: Card[]) => void
}

/**
 * In-memory cards store hook
 */
export function useCards(): CardsState {
  const [cards, setCards] = useState<Card[]>([])

  const addCards = useCallback((newCards: Card[]) => {
    setCards(prev => [...prev, ...newCards])
  }, [])

  const addCard = useCallback((card: Card) => {
    setCards(prev => [...prev, card])
  }, [])

  const updateCard = useCallback((id: string, updates: Partial<Card>) => {
    setCards(prev => prev.map(card => 
      card.id === id 
        ? { ...card, ...updates, updatedAt: Date.now() }
        : card
    ))
  }, [])

  const removeCard = useCallback((id: string) => {
    setCards(prev => prev.filter(card => card.id !== id))
  }, [])

  const clearCards = useCallback(() => {
    setCards([])
  }, [])

  const replaceAll = useCallback((newCards: Card[]) => {
    setCards(newCards)
  }, [])

  return {
    cards,
    addCards,
    addCard,
    updateCard,
    removeCard,
    clearCards,
    replaceAll
  }
}
