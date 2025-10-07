import type { ReactNode } from 'react'
import { useCards } from './useCards'
import { CardsContext } from './cardsContextInstance'

export function CardsProvider({ children }: { children: ReactNode }) {
  const cardsState = useCards()
  
  return (
    <CardsContext.Provider value={cardsState}>
      {children}
    </CardsContext.Provider>
  )
}
