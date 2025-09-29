import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useCardsContext } from '../lib/CardsContext'

function CardView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { cards, updateCard, removeCard } = useCardsContext()
  const [editingTitle, setEditingTitle] = useState(false)
  const [editTitle, setEditTitle] = useState('')

  const card = cards.find(c => c.id === id)

  useEffect(() => {
    if (card) {
      document.title = `${card.question} - Flash Files`
    } else {
      document.title = 'Card Not Found - Flash Files'
    }
  }, [card])

  const handleEditTitle = () => {
    if (card) {
      setEditTitle(card.question)
      setEditingTitle(true)
    }
  }

  const handleSaveTitle = () => {
    if (card && editTitle.trim()) {
      updateCard(card.id, { question: editTitle.trim() })
      setEditingTitle(false)
      setEditTitle('')
    }
  }

  const handleCancelEdit = () => {
    setEditingTitle(false)
    setEditTitle('')
  }

  const handleDelete = () => {
    if (card && confirm('Are you sure you want to delete this card?')) {
      removeCard(card.id)
      navigate('/library')
    }
  }

  const handleCopyQA = async () => {
    if (card) {
      const text = `Q: ${card.question}\n\nA: ${card.answerMD}`
      try {
        await navigator.clipboard.writeText(text)
        // Could add a toast notification here
      } catch (err) {
        console.error('Failed to copy to clipboard:', err)
      }
    }
  }

  if (!card) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Card Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The card you're looking for doesn't exist or may have been deleted.
          </p>
          <Link
            to="/library"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Back to Library
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/library"
          className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors mb-4"
        >
          ← Back to Library
        </Link>
        
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          {/* Title */}
          <div className="mb-6">
            {editingTitle ? (
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTitle()
                    if (e.key === 'Escape') handleCancelEdit()
                  }}
                  className="flex-1 px-4 py-2 text-2xl font-bold border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  autoFocus
                />
                <button
                  onClick={handleSaveTitle}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {card.question}
              </h1>
            )}
          </div>

          {/* Tags */}
          {card.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {card.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-sm rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Metadata */}
          <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400 mb-6 border-b border-gray-200 dark:border-gray-600 pb-4">
            <span>Box {card.box}</span>
            <span>Created {new Date(card.createdAt).toLocaleDateString()}</span>
            <span>Updated {new Date(card.updatedAt).toLocaleString()}</span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={handleCopyQA}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
            >
              Copy Q/A
            </button>
            <button
              onClick={handleEditTitle}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
            >
              Edit Title
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
            >
              Delete Card
            </button>
          </div>

          {/* Answer Content */}
          <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Answer
            </h2>
            <article className="prose prose-gray dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
{card.answerMD}
              </pre>
            </article>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CardView
