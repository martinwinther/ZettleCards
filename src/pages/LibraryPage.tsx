import { useEffect } from 'react'

function LibraryPage() {
  useEffect(() => {
    document.title = 'Library - Flash Files'
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Library
      </h1>
      <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
        Your cards will appear here. You'll be able to filter by tags and search 
        through your flashcard collection to quickly find the content you need to review.
      </p>
    </div>
  )
}

export default LibraryPage
