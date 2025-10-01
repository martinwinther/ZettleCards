import Dexie from 'dexie'

export interface Card {
  id: string
  question: string
  answerMD: string
  tags: string[]
  createdAt: number
  updatedAt: number
  box: number
  due: number
}

export class FlashDB extends Dexie {
  cards!: Dexie.Table<Card, string>

  constructor() {
    super('FlashDB')
    this.version(1).stores({
      cards: 'id, question, box, due, updatedAt, *tags'
    })
  }
}

export const db = new FlashDB()

