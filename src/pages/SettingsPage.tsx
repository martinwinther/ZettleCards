import { useEffect } from 'react'

function SettingsPage() {
  useEffect(() => {
    document.title = 'Settings - Flash Files'
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Settings
      </h1>
      <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
        Backup/restore, CSV export, and PWA will be added later. This will be your 
        control center for managing data export, application preferences, and offline 
        functionality.
      </p>
    </div>
  )
}

export default SettingsPage
