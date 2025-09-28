import { useEffect } from 'react'

function ReviewPage() {
  useEffect(() => {
    document.title = 'Review - Flash Files'
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Review
      </h1>
      <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
        Leitner review sessions with tag filters will live here. You'll be able to 
        create focused study sessions based on specific topics or difficulty levels, 
        with spaced repetition algorithms to optimize your learning.
      </p>
    </div>
  )
}

export default ReviewPage
