import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useCardsContext } from '../lib/useCardsContext'
import { normalizeTag } from '../lib/tags'
import TagSidebar from '../components/TagSidebar'
import type { Card } from '../lib/types'

type SortOption = 'newest' | 'oldest' | 'title-asc' | 'title-desc'

interface SnackbarState {
  message: string
  onUndo: () => void
}

function LibraryPage() {
  const { cards, updateCard, removeCard } = useCardsContext()
  const [activeTags, setActiveTags] = useState<string[]>([])
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [editingCard, setEditingCard] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkTagInput, setBulkTagInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null)

  useEffect(() => {
    document.title = 'Library - ZettleCards'
  }, [])

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput)
    }, 200)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Filter and sort cards
  const filteredCards = useMemo(() => {
    let filtered = cards

    // Filter by active tags (AND logic)
    if (activeTags.length > 0) {
      filtered = filtered.filter(card =>
        activeTags.every(activeTag => 
          card.tags.some(cardTag => cardTag.toLowerCase() === activeTag.toLowerCase())
        )
      )
    }

    // Filter by search text
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase()
      filtered = filtered.filter(card =>
        card.question.toLowerCase().includes(searchLower) ||
        card.answerMD.toLowerCase().includes(searchLower)
      )
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.updatedAt - a.updatedAt
        case 'oldest':
          return a.updatedAt - b.updatedAt
        case 'title-asc':
          return a.question.localeCompare(b.question)
        case 'title-desc':
          return b.question.localeCompare(a.question)
        default:
          return 0
      }
    })

    return sorted
  }, [cards, activeTags, debouncedSearch, sortBy])

  const handleToggleTag = (tag: string) => {
    setActiveTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const handleClearFilters = () => {
    setActiveTags([])
    setSearchInput('')
  }

  const handleEditTitle = (card: Card) => {
    setEditingCard(card.id)
    setEditTitle(card.question)
  }

  const handleSaveTitle = (cardId: string) => {
    if (editTitle.trim()) {
      updateCard(cardId, { question: editTitle.trim() })
    }
    setEditingCard(null)
    setEditTitle('')
  }

  const handleCancelEdit = () => {
    setEditingCard(null)
    setEditTitle('')
  }

  const handleDeleteCard = (cardId: string) => {
    if (confirm('Are you sure you want to delete this card?')) {
      removeCard(cardId)
    }
  }

  const handleSelectAll = () => {
    if (selectedIds.size === filteredCards.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredCards.map(c => c.id)))
    }
  }

  const handleSelectCard = (cardId: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(cardId)) {
      newSelected.delete(cardId)
    } else {
      newSelected.add(cardId)
    }
    setSelectedIds(newSelected)
  }

  const hideSnackbar = () => {
    setSnackbar(null)
  }

  const handleBulkAddTag = async () => {
    if (!bulkTagInput.trim() || selectedIds.size === 0) return

    const tag = normalizeTag(bulkTagInput)
    const selectedCards = cards.filter(c => selectedIds.has(c.id))
    
    setIsProcessing(true)

    const previousTags = new Map(
      selectedCards.map(card => [card.id, [...card.tags]])
    )

    try {
      for (const card of selectedCards) {
        const newTags = Array.from(new Set([...card.tags, tag]))
        await updateCard(card.id, { tags: newTags })
      }

      setBulkTagInput('')
      setSnackbar({
        message: `Added tag #${tag} to ${selectedIds.size} card(s)`,
        onUndo: async () => {
          for (const [id, tags] of previousTags) {
            await updateCard(id, { tags })
          }
          hideSnackbar()
        }
      })

      setTimeout(hideSnackbar, 6000)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBulkRemoveTag = async (tagToRemove: string) => {
    if (selectedIds.size === 0) return

    const selectedCards = cards.filter(c => selectedIds.has(c.id))
    setIsProcessing(true)

    const previousTags = new Map(
      selectedCards.map(card => [card.id, [...card.tags]])
    )

    try {
      for (const card of selectedCards) {
        const newTags = card.tags.filter(t => t !== tagToRemove)
        await updateCard(card.id, { tags: newTags })
      }

      setSnackbar({
        message: `Removed tag #${tagToRemove} from ${selectedIds.size} card(s)`,
        onUndo: async () => {
          for (const [id, tags] of previousTags) {
            await updateCard(id, { tags })
          }
          hideSnackbar()
        }
      })

      setTimeout(hideSnackbar, 6000)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleExportSelected = () => {
    if (selectedIds.size === 0) return

    const selectedCards = cards.filter(c => selectedIds.has(c.id))
    const dataStr = JSON.stringify(selectedCards, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `flashcards-export-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const selectedCardsTags = useMemo(() => {
    const selectedCards = cards.filter(c => selectedIds.has(c.id))
    const tagSet = new Set<string>()
    selectedCards.forEach(card => {
      card.tags.forEach(tag => tagSet.add(tag))
    })
    return Array.from(tagSet).sort()
  }, [cards, selectedIds])

  if (cards.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Library
        </h1>
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
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <TagSidebar
            cards={cards}
            activeTags={activeTags}
            onToggleTag={handleToggleTag}
            onClearFilters={handleClearFilters}
          />
        </div>

        {/* Main content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Library
            </h1>
            <Link
              to="/import"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
            >
              Import Files
            </Link>
          </div>

          {/* Search and Sort */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="search" className="sr-only">
                Search cards
              </label>
              <input
                id="search"
                type="text"
                placeholder="Search title or answer…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="sort" className="sr-only">
                Sort cards
              </label>
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="title-asc">Title A–Z</option>
                <option value="title-desc">Title Z–A</option>
              </select>
            </div>
          </div>

          {/* Results count */}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {filteredCards.length} result{filteredCards.length !== 1 ? 's' : ''}
            {activeTags.length > 0 && (
              <span className="ml-2">
                · Filtered by: {activeTags.map(tag => `#${tag}`).join(', ')}
              </span>
            )}
          </div>

          {/* Bulk action bar */}
          {selectedIds.size > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-blue-900 dark:text-blue-100">
                    {selectedIds.size} selected
                  </span>
                  <button
                    onClick={() => setSelectedIds(new Set())}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    Clear
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 flex-1">
                  <div className="flex gap-1">
                    <label htmlFor="bulk-tag-add" className="sr-only">
                      Add tag to selected cards
                    </label>
                    <input
                      id="bulk-tag-add"
                      type="text"
                      value={bulkTagInput}
                      onChange={(e) => setBulkTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleBulkAddTag()
                        }
                      }}
                      placeholder="Add tag..."
                      disabled={isProcessing}
                      className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleBulkAddTag}
                      disabled={isProcessing || !bulkTagInput.trim()}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
                    >
                      Add
                    </button>
                  </div>

                  {selectedCardsTags.length > 0 && (
                    <div className="flex gap-1">
                      <label htmlFor="bulk-tag-remove" className="sr-only">
                        Remove tag from selected cards
                      </label>
                      <select
                        id="bulk-tag-remove"
                        onChange={(e) => {
                          if (e.target.value) {
                            handleBulkRemoveTag(e.target.value)
                            e.target.value = ''
                          }
                        }}
                        disabled={isProcessing}
                        className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Remove tag...</option>
                        {selectedCardsTags.map(tag => (
                          <option key={tag} value={tag}>#{tag}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <button
                    onClick={handleExportSelected}
                    disabled={isProcessing}
                    className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
                  >
                    Export JSON
                  </button>
                </div>

                {isProcessing && selectedIds.size > 50 && (
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Updating {selectedIds.size} cards...
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Cards list */}
          {filteredCards.length > 0 ? (
            <div className="space-y-4">
              {/* Select all checkbox */}
              <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <input
                  type="checkbox"
                  checked={selectedIds.size === filteredCards.length && filteredCards.length > 0}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500"
                  aria-label="Select all cards"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Select all
                </span>
              </div>

              {filteredCards.map((card) => (
                <div
                  key={card.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(card.id)}
                      onChange={() => handleSelectCard(card.id)}
                      className="mt-1 w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500"
                      aria-label={`Select card ${card.question}`}
                    />
                    <div className="flex-1">
                      {editingCard === card.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveTitle(card.id)
                              if (e.key === 'Escape') handleCancelEdit()
                            }}
                            className="flex-1 px-3 py-1 text-lg font-medium border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveTitle(card.id)}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <Link
                          to={`/library/${card.id}`}
                          className="text-lg font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          {card.question}
                        </Link>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Box {card.box}
                      </span>
                    </div>
                  </div>

                  {/* Tags */}
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

                  {/* Answer preview */}
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {card.answerMD.slice(0, 200)}
                    {card.answerMD.length > 200 && '...'}
                  </div>

                  {/* Meta and actions */}
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>
                      Updated {new Date(card.updatedAt).toLocaleString()}
                    </span>
                    <div className="flex items-center gap-3">
                      <Link
                        to={`/library/${card.id}`}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleEditTitle(card)}
                        className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                      >
                        Edit title
                      </button>
                      <button
                        onClick={() => handleDeleteCard(card.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No matches found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Try adjusting your search terms or clearing the filters.
              </p>
              <button
                onClick={handleClearFilters}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Undo snackbar */}
      {snackbar && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-6 py-3 rounded-lg shadow-lg flex items-center gap-4">
          <span className="text-sm">{snackbar.message}</span>
          <button
            onClick={snackbar.onUndo}
            className="text-sm font-medium underline hover:no-underline"
          >
            Undo
          </button>
          <button
            onClick={hideSnackbar}
            className="text-sm opacity-75 hover:opacity-100"
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}

export default LibraryPage
