import { useEffect, useState, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useCardsContext } from '../lib/CardsContext'
import Markdown from '../components/Markdown'
import type { Card } from '../lib/types'

type Rating = "again" | "good" | "easy"

interface SessionStats {
  reviewed: number
  again: number
  good: number
  easy: number
}

function ReviewPage() {
  const { cards, updateCard } = useCardsContext()
  
  // Session state
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [includeNew, setIncludeNew] = useState(true)
  const [newPerSession, setNewPerSession] = useState(20)
  const [queue, setQueue] = useState<string[]>([])
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [stats, setStats] = useState<SessionStats>({ reviewed: 0, again: 0, good: 0, easy: 0 })
  const [sessionActive, setSessionActive] = useState(false)

  useEffect(() => {
    document.title = 'Review - ZettleCards'
  }, [])

  // Helper function for Leitner scheduling
  const nextBoxAndDue = useCallback((prevBox: number | undefined, rating: Rating, now: number): { box: 1|2|3|4|5, due: number } => {
    const box = Math.max(1, Math.min(5, prevBox ?? 1))
    if (rating === "again") return { box: 1, due: now }
    const next = Math.max(1, Math.min(5, box + (rating === "easy" ? 2 : 1)))
    const days = { 1: 1, 2: 1, 3: 3, 4: 7, 5: 21 } as const
    const intervalDays = days[next as keyof typeof days]
    return { box: next as 1|2|3|4|5, due: now + intervalDays * 24 * 60 * 60 * 1000 }
  }, [])

  // Compute tag counts from all cards
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    cards.forEach(card => {
      card.tags.forEach(tag => {
        counts[tag] = (counts[tag] || 0) + 1
      })
    })
    return Object.entries(counts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
  }, [cards])

  // Statistics for HUD
  const hudStats = useMemo(() => {
    const endOfToday = new Date()
    endOfToday.setHours(23, 59, 59, 999)
    
    const dueToday = cards.filter(card => (card.due ?? 0) <= endOfToday.getTime()).length
    const newAvailable = cards.filter(card => card.box == null).length
    
    return {
      dueToday,
      newAvailable,
      queueSize: queue.length,
      reviewed: stats.reviewed
    }
  }, [cards, queue.length, stats.reviewed])

  // Build review queue
  const buildQueue = useCallback(() => {
    
    // Filter cards by selected tags (must have ALL selected tags)
    let pool = cards
    if (selectedTags.length > 0) {
      pool = cards.filter(card =>
        selectedTags.every(selectedTag =>
          card.tags.some(cardTag => cardTag.toLowerCase() === selectedTag.toLowerCase())
        )
      )
    }

    // Get due cards (sorted by box asc, due asc, updatedAt desc)
    const now = Date.now()
    const due = pool
      .filter(card => (card.due ?? 0) <= now && card.box != null)
      .sort((a, b) => {
        const boxA = a.box ?? 1
        const boxB = b.box ?? 1
        if (boxA !== boxB) return boxA - boxB
        
        const dueA = a.due ?? 0
        const dueB = b.due ?? 0
        if (dueA !== dueB) return dueA - dueB
        
        return b.updatedAt - a.updatedAt
      })

    // Get new cards if enabled
    const fresh = includeNew 
      ? pool.filter(card => card.due == null || card.box == null).slice(0, newPerSession)
      : []

    const ids = [...due.map(card => card.id), ...fresh.map(card => card.id)]
    
    setQueue(ids)
    setCurrentId(ids[0] ?? null)
    setShowAnswer(false)
    setStats({ reviewed: 0, again: 0, good: 0, easy: 0 })
    setSessionActive(true)
  }, [cards, selectedTags, includeNew, newPerSession])

  // Get current card
  const currentCard = useMemo(() => {
    return currentId ? cards.find(card => card.id === currentId) ?? null : null
  }, [currentId, cards])

  // Handle rating a card
  const handleRating = useCallback(async (rating: Rating) => {
    if (!currentCard || !showAnswer) return

    const now = Date.now()
    const { box, due } = nextBoxAndDue(currentCard.box, rating, now)
    
    // Update the card
    await updateCard(currentCard.id, { box, due, updatedAt: now })
    
    // Update stats
    setStats(prev => ({
      reviewed: prev.reviewed + 1,
      again: prev.again + (rating === 'again' ? 1 : 0),
      good: prev.good + (rating === 'good' ? 1 : 0),
      easy: prev.easy + (rating === 'easy' ? 1 : 0)
    }))

    // Advance queue
    const newQueue = queue.slice(1)
    setQueue(newQueue)
    setCurrentId(newQueue[0] ?? null)
    setShowAnswer(false)

    // End session if queue is empty
    if (newQueue.length === 0) {
      setSessionActive(false)
    }
  }, [currentCard, showAnswer, queue, nextBoxAndDue, updateCard])

  // Keyboard event handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!sessionActive) return

    switch (e.key) {
      case ' ':
        e.preventDefault()
        setShowAnswer(prev => !prev)
        break
      case '1':
        if (showAnswer) handleRating('again')
        break
      case '2':
        if (showAnswer) handleRating('good')
        break
      case '3':
        if (showAnswer) handleRating('easy')
        break
      case 'Escape':
        if (showAnswer) {
          setShowAnswer(false)
        } else if (confirm('End session? Your progress will be saved.')) {
          setSessionActive(false)
          setQueue([])
          setCurrentId(null)
          setShowAnswer(false)
        }
        break
    }
  }, [sessionActive, showAnswer, handleRating])

  // Attach keyboard listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Handle tag toggle
  const handleTagToggle = useCallback((tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }, [])

  // Clear all tag filters
  const clearTagFilters = useCallback(() => {
    setSelectedTags([])
  }, [])

  if (cards.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Review
        </h1>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No cards to review
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Start by importing your Obsidian markdown files to create your first flashcards.
          </p>
          <Link
            to="/import"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Import Files
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Review
        </h1>
        <Link
          to="/library"
          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
        >
          Back to Library
        </Link>
      </div>

      {/* HUD Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{hudStats.dueToday}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Due today</div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{hudStats.newAvailable}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">New available</div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{hudStats.queueSize}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">In queue</div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{hudStats.reviewed}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Reviewed</div>
        </div>
      </div>

      {!sessionActive ? (
        <div className="space-y-8">
          {/* Session Setup */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Session Setup
            </h2>

            {/* Tag Filters */}
            {tagCounts.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Filter by tags (optional)
                </h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {tagCounts.map(({ tag, count }) => (
                    <button
                      key={tag}
                      onClick={() => handleTagToggle(tag)}
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm transition-colors ${
                        selectedTags.includes(tag)
                          ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-200'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <span>#{tag}</span>
                      <span className="text-xs opacity-75">{count}</span>
                    </button>
                  ))}
                </div>
                {selectedTags.length > 0 && (
                  <button
                    onClick={clearTagFilters}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}

            {/* New Cards Settings */}
            <div className="space-y-4 mb-6">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={includeNew}
                  onChange={(e) => setIncludeNew(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Include new cards
                </span>
              </label>

              {includeNew && (
                <div className="flex items-center gap-3 ml-7">
                  <label htmlFor="newPerSession" className="text-sm text-gray-600 dark:text-gray-400">
                    New per session:
                  </label>
                  <input
                    id="newPerSession"
                    type="number"
                    min="0"
                    max="100"
                    value={newPerSession}
                    onChange={(e) => setNewPerSession(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>

            {/* Start Session Button */}
            <button
              onClick={buildQueue}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              Start Session
            </button>
          </div>

          {/* Session Complete Summary */}
          {stats.reviewed > 0 && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
              <div className="text-2xl mb-2">🎉</div>
              <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                Session Complete!
              </h3>
              <p className="text-green-700 dark:text-green-200 mb-4">
                Reviewed {stats.reviewed} cards: Again {stats.again} • Good {stats.good} • Easy {stats.easy}
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={buildQueue}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Start New Session
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <ReviewSession
          currentCard={currentCard}
          showAnswer={showAnswer}
          onToggleAnswer={() => setShowAnswer(!showAnswer)}
          onRating={handleRating}
          queuePosition={queue.length - (queue.findIndex(id => id === currentId) + 1) + 1}
          queueTotal={queue.length}
        />
      )}
    </div>
  )
}

interface ReviewSessionProps {
  currentCard: Card | null
  showAnswer: boolean
  onToggleAnswer: () => void
  onRating: (rating: Rating) => void
  queuePosition: number
  queueTotal: number
}

function ReviewSession({ currentCard, showAnswer, onToggleAnswer, onRating, queuePosition, queueTotal }: ReviewSessionProps) {
  if (!currentCard) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">🔍</div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Nothing to review
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          No cards match your current filters, or nothing is due right now.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="text-center text-sm text-gray-600 dark:text-gray-400">
        Card {queuePosition} of {queueTotal}
      </div>

      {/* Card Display */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8">
        {/* Question */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white leading-relaxed mb-4">
            {currentCard.question}
          </h1>
          
          {/* Tags */}
          {currentCard.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center">
              {currentCard.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-sm rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Answer */}
        {showAnswer && (
          <div className="border-t border-gray-200 dark:border-gray-600 pt-8 mb-8">
            <Markdown markdown={currentCard.answerMD} />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col items-center space-y-4">
          {!showAnswer ? (
            <button
              onClick={onToggleAnswer}
              className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-8 rounded-lg font-medium transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              Show Answer <span className="text-blue-200">(Space)</span>
            </button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
              <button
                onClick={() => onRating('again')}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-medium transition-colors focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              >
                Again <span className="text-red-200">(1)</span>
              </button>
              <button
                onClick={() => onRating('good')}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              >
                Good <span className="text-green-200">(2)</span>
              </button>
              <button
                onClick={() => onRating('easy')}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              >
                Easy <span className="text-blue-200">(3)</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        <p>Use keyboard: <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Space</kbd> to flip, <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">1</kbd>/<kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">2</kbd>/<kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">3</kbd> to rate, <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Esc</kbd> to end</p>
      </div>
    </div>
  )
}

export default ReviewPage