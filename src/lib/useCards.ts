import { useState, useCallback, useEffect } from 'react'
import { db } from '../db'
import type { Card } from './types'

interface CardsState {
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

function normalizeCard(card: Card): Card {
  const now = Date.now()
  return {
    ...card,
    createdAt: card.createdAt || now,
    updatedAt: card.updatedAt || now,
    tags: Array.isArray(card.tags) ? card.tags : []
  }
}

/**
 * Cards store hook with Dexie persistence
 */
export function useCards(): CardsState {
  const [cards, setCards] = useState<Card[]>([])

  const reload = useCallback(async () => {
    const allCards = await db.cards.orderBy('createdAt').reverse().toArray()
    const normalized = allCards.map(normalizeCard)
    
    const needsUpdate = normalized.some((card, idx) => 
      card.createdAt !== allCards[idx].createdAt || 
      card.updatedAt !== allCards[idx].updatedAt
    )
    
    if (needsUpdate) {
      await db.cards.bulkPut(normalized)
    }
    
    setCards(normalized)
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const addCards = useCallback(async (newCards: Card[]) => {
    const normalized = newCards.map(normalizeCard)
    await db.cards.bulkPut(normalized)
    await reload()
  }, [reload])

  const addCard = useCallback(async (card: Card) => {
    const normalized = normalizeCard(card)
    await db.cards.put(normalized)
    await reload()
  }, [reload])

  const updateCard = useCallback(async (id: string, updates: Partial<Card>) => {
    const updatedData = { ...updates, updatedAt: Date.now() }
    await db.cards.update(id, updatedData)
    await reload()
  }, [reload])

  const bulkUpdateCards = useCallback(async (ids: string[], updates: Partial<Card>) => {
    const now = Date.now()
    const cardsToUpdate = await db.cards.bulkGet(ids)
    const updatedCards = cardsToUpdate
      .filter((card): card is Card => card !== undefined)
      .map(card => ({ ...card, ...updates, updatedAt: now }))
    
    if (updatedCards.length > 0) {
      await db.cards.bulkPut(updatedCards)
      await reload()
    }
  }, [reload])

  const removeCard = useCallback(async (id: string) => {
    await db.cards.delete(id)
    await reload()
  }, [reload])

  const clearCards = useCallback(async () => {
    await db.cards.clear()
    await reload()
  }, [reload])

  const replaceAll = useCallback(async (newCards: Card[]) => {
    const normalized = newCards.map(normalizeCard)
    await db.cards.clear()
    await db.cards.bulkPut(normalized)
    await reload()
  }, [reload])

  return {
    cards,
    addCards,
    addCard,
    updateCard,
    bulkUpdateCards,
    removeCard,
    clearCards,
    replaceAll,
    reload
  }
}
