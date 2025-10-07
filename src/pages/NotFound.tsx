import { useEffect } from 'react'
import { Link } from 'react-router-dom'

function NotFound() {
  useEffect(() => {
    document.title = '404 - Page Not Found - ZettleCards'
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 text-center">
      <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">
        404
      </h1>
      <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-6">
        Page Not Found
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link 
        to="/library"
        className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
      >
        Back to Library
      </Link>
    </div>
  )
}

export default NotFound
