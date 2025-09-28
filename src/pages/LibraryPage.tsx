import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCardsContext } from '../lib/CardsContext'

function LibraryPage() {
  const { cards } = useCardsContext()

  useEffect(() => {
    document.title = 'Library - Flash Files'
  }, [])

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Library
        </h1>
        {cards.length > 0 && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {cards.length} card{cards.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {cards.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No cards yet
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
      ) : (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="grid gap-4 p-6">
              {cards.map((card) => (
                <div
                  key={card.id}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-medium text-gray-900 dark:text-white leading-relaxed">
                      {card.question}
                    </h3>
                    <div className="text-xs text-gray-500 dark:text-gray-400 ml-4 flex-shrink-0">
                      Box {card.box}
                    </div>
                  </div>
                  
                  {card.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {card.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-xs rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {card.answerMD.slice(0, 150)}
                    {card.answerMD.length > 150 && '...'}
                  </div>
                  
                  <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                    Created {new Date(card.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              You'll be able to filter by tags and search through your collection soon.
            </p>
            <Link
              to="/import"
              className="inline-block text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              Import more files →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default LibraryPage
