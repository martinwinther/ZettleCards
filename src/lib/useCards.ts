import { useState, useCallback, useEffect } from 'react'
import { db } from '../db'
import type { Card } from './types'

interface CardsState {
  cards: Card[]
  addCards: (newCards: Card[]) => Promise<void>
  addCard: (card: Card) => Promise<void>
  updateCard: (id: string, updates: Partial<Card>) => Promise<void>
  removeCard: (id: string) => Promise<void>
  clearCards: () => Promise<void>
  replaceAll: (newCards: Card[]) => Promise<void>
}

/**
 * Cards store hook with Dexie persistence
 */
export function useCards(): CardsState {
  const [cards, setCards] = useState<Card[]>([])

  // Load cards from Dexie on mount
  useEffect(() => {
    async function loadCards() {
      const allCards = await db.cards.toArray()
      setCards(allCards)
    }
    loadCards()
  }, [])

  const addCards = useCallback(async (newCards: Card[]) => {
    // Use put to handle duplicates (upsert)
    await db.cards.bulkPut(newCards)
    setCards(prev => {
      // Remove existing cards with same IDs, then add new ones
      const existingIds = new Set(newCards.map(c => c.id))
      const filtered = prev.filter(c => !existingIds.has(c.id))
      return [...filtered, ...newCards]
    })
  }, [])

  const addCard = useCallback(async (card: Card) => {
    await db.cards.put(card)
    setCards(prev => {
      // Remove if exists, then add
      const filtered = prev.filter(c => c.id !== card.id)
      return [...filtered, card]
    })
  }, [])

  const updateCard = useCallback(async (id: string, updates: Partial<Card>) => {
    const updatedData = { ...updates, updatedAt: Date.now() }
    await db.cards.update(id, updatedData)
    setCards(prev => prev.map(card => 
      card.id === id 
        ? { ...card, ...updatedData }
        : card
    ))
  }, [])

  const removeCard = useCallback(async (id: string) => {
    await db.cards.delete(id)
    setCards(prev => prev.filter(card => card.id !== id))
  }, [])

  const clearCards = useCallback(async () => {
    await db.cards.clear()
    setCards([])
  }, [])

  const replaceAll = useCallback(async (newCards: Card[]) => {
    await db.cards.clear()
    await db.cards.bulkPut(newCards)
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
