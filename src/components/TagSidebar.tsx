import type { Card } from '../lib/types'

interface TagSidebarProps {
  cards: Card[]
  activeTags: string[]
  onToggleTag: (tag: string) => void
  onClearFilters: () => void
}

interface TagCount {
  tag: string
  count: number
}

function TagSidebar({ cards, activeTags, onToggleTag, onClearFilters }: TagSidebarProps) {
  // Compute tag counts
  const tagCounts = cards.reduce((acc, card) => {
    card.tags.forEach(tag => {
      acc[tag] = (acc[tag] || 0) + 1
    })
    return acc
  }, {} as Record<string, number>)

  // Convert to sorted array
  const sortedTags: TagCount[] = Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => {
      // Sort by count desc, then alphabetically
      if (a.count !== b.count) {
        return b.count - a.count
      }
      return a.tag.localeCompare(b.tag)
    })

  const totalCards = cards.length
  const hasActiveFilters = activeTags.length > 0

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 h-fit">
      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
        Filter by tags
      </h3>
      
      {/* All notes */}
      <button
        onClick={onClearFilters}
        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors mb-2 ${
          !hasActiveFilters
            ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-200'
            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span>All notes</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {totalCards}
          </span>
        </div>
      </button>

      {/* Clear filters button */}
      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className="w-full text-left px-3 py-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-3"
        >
          Clear filters
        </button>
      )}

      {/* Tag list */}
      {sortedTags.length > 0 ? (
        <div className="space-y-1">
          {sortedTags.map(({ tag, count }) => {
            const isActive = activeTags.includes(tag)
            return (
              <button
                key={tag}
                onClick={() => onToggleTag(tag)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-200'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate">#{tag}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
                    {count}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          No tags yet
        </p>
      )}
    </div>
  )
}

export default TagSidebar
