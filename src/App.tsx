import { useState, useEffect } from 'react'

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    // Set initial dark mode state based on system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    setIsDarkMode(prefersDark)
    if (prefersDark) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode
    setIsDarkMode(newDarkMode)
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors">
      {/* Header */}
      <header className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* App Title */}
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Flash Files (Obsidian)
          </h1>
          
          {/* Navigation */}
          <nav className="flex space-x-6">
            <a 
              href="#" 
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Import
            </a>
            <a 
              href="#" 
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Library
            </a>
            <a 
              href="#" 
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Review
            </a>
            <a 
              href="#" 
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Settings
            </a>
          </nav>
          
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex items-center justify-center h-[calc(100vh-5rem)]">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
            Welcome to Flash Files
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Transform your Obsidian notes into flashcards
          </p>
        </div>
      </main>
    </div>
  )
}

export default App