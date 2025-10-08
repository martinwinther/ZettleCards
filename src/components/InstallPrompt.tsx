import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
}

function InstallPrompt() {
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showInstallSuccess, setShowInstallSuccess] = useState(false)

  useEffect(() => {
    // Check if already installed
    const checkInstalled = () => {
      // Check for standalone mode (iOS Safari, Android Chrome)
      const nav = window.navigator as Navigator & { standalone?: boolean }
      const isStandalone = nav.standalone || 
                          window.matchMedia('(display-mode: standalone)').matches ||
                          window.matchMedia('(display-mode: fullscreen)').matches

      setIsInstalled(isStandalone)
    }

    checkInstalled()

    // Listen for install prompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault()
      setInstallPromptEvent(e as BeforeInstallPromptEvent)
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      setInstallPromptEvent(null)
      setIsInstalled(true)
      setShowInstallSuccess(true)
      setTimeout(() => setShowInstallSuccess(false), 5000)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!installPromptEvent) return

    try {
      // Show the install prompt
      await installPromptEvent.prompt()
      
      // Wait for the user to respond
      const { outcome } = await installPromptEvent.userChoice
      
      if (outcome === 'accepted') {
        setInstallPromptEvent(null)
      }
    } catch (error) {
      console.error('Install prompt failed:', error)
    }
  }

  // Don't show if already installed or no install prompt available
  if (isInstalled || !installPromptEvent) {
    return showInstallSuccess ? (
      <div className="fixed top-20 right-4 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 text-green-800 dark:text-green-200 px-4 py-2 rounded-lg shadow-lg z-50 text-sm">
        App installed — you can use it offline
      </div>
    ) : null
  }

  return (
    <button
      onClick={handleInstallClick}
      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
      title="Install this app to review your notes offline"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7,10 12,15 17,10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      Install app
    </button>
  )
}

export default InstallPrompt
