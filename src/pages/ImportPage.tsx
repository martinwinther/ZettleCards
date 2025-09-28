import { useEffect } from 'react'

function ImportPage() {
  useEffect(() => {
    document.title = 'Import - Flash Files'
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Import (Obsidian Markdown only)
      </h1>
      <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
        In a future update, you'll be able to drag and drop your Obsidian markdown files (.md) 
        directly into this area. We'll parse Obsidian-style titles and tags to automatically 
        create flashcards with proper categorization. Support for Zettelkasten-style note 
        linking and tag hierarchies is also planned.
      </p>
    </div>
  )
}

export default ImportPage
