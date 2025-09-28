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
