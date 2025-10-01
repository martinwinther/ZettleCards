import { useState, useEffect } from 'react'

function UpdateNotification() {
  const [showUpdate, setShowUpdate] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    // Listen for service worker update events
    const handleSWUpdate = () => {
      setShowUpdate(true)
    }

    // Check if service worker is available and register update listener
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        // Listen for waiting service worker (new version available)
        if (registration.waiting) {
          setShowUpdate(true)
        }

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setShowUpdate(true)
              }
            })
          }
        })
      })

      // Listen for controller change (new SW took over)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload()
      })
    }

    // Listen for Vite's PWA plugin update events
    window.addEventListener('sw:update', handleSWUpdate)

    return () => {
      window.removeEventListener('sw:update', handleSWUpdate)
    }
  }, [])

  const handleUpdate = async () => {
    setIsUpdating(true)
    
    try {
      // Try to skip waiting and activate new service worker
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' })
          return // controllerchange event will reload
        }
      }
      
      // Fallback: just reload
      window.location.reload()
    } catch (error) {
      console.error('Update failed:', error)
      // Fallback: reload anyway
      window.location.reload()
    }
  }

  const handleDismiss = () => {
    setShowUpdate(false)
  }

  if (!showUpdate) return null

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100 px-4 py-3 rounded-lg shadow-lg z-50 max-w-md">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span className="text-sm font-medium">
            New version available
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleUpdate}
            disabled={isUpdating}
            className="text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white px-3 py-1 rounded transition-colors"
          >
            {isUpdating ? 'Updating...' : 'Reload'}
          </button>
          <button
            onClick={handleDismiss}
            className="text-sm text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 px-2 py-1 transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )
}

export default UpdateNotification
