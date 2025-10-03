import Dexie from 'dexie'
import type { Card } from '../lib/types'

export interface ImportLog {
  id: string
  fileName: string
  contentHash: string
  cardId: string
  createdAt: number
}

export class FlashDB extends Dexie {
  cards!: Dexie.Table<Card, string>
  imports!: Dexie.Table<ImportLog, string>

  constructor() {
    super('FlashFilesDB')
    this.version(1).stores({
      cards: 'id, createdAt, updatedAt, due, box, *tags',
      imports: 'id, fileName, contentHash, cardId, createdAt'
    })
  }
}

export const db = new FlashDB()

