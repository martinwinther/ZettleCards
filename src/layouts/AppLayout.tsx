import { useState, useEffect } from 'react'
import { NavLink, Link, Outlet } from 'react-router-dom'

function AppLayout() {
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
      {/* Skip to content link for accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-lg z-50"
      >
        Skip to content
      </a>

      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/20 dark:border-gray-700/30 px-6 py-3 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Navigation - Centered */}
          <nav className="flex-1 flex justify-center">
            <div className="flex items-center space-x-1 bg-gray-100/50 dark:bg-gray-800/50 rounded-full p-1 backdrop-blur-sm">
              <NavLink 
                to="/import"
                className={({ isActive }) => 
                  `px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50'
                  }`
                }
              >
                Import
              </NavLink>
              <NavLink 
                to="/library"
                className={({ isActive }) => 
                  `px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50'
                  }`
                }
              >
                Library
              </NavLink>
              <NavLink 
                to="/review"
                className={({ isActive }) => 
                  `px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50'
                  }`
                }
              >
                Review
              </NavLink>
              <NavLink 
                to="/settings"
                className={({ isActive }) => 
                  `px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50'
                  }`
                }
              >
                Settings
              </NavLink>
            </div>
          </nav>
          
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2.5 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow-md"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-t border-gray-200/30 dark:border-gray-700/30 px-6 py-6">
        <div className="max-w-7xl mx-auto text-center text-xs text-gray-500 dark:text-gray-500">
          Transform your Obsidian notes into flashcards
        </div>
      </footer>
    </div>
  )
}

export default AppLayout
