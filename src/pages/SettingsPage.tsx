import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useCardsContext } from '../lib/useCardsContext'
import { BackupZ } from '../lib/schemas'
import { normalizeTags } from '../lib/tags'
import type { Backup } from '../lib/schemas'
import type { Card } from '../lib/types'

interface ImportSummary {
  total: number
  withTags: number
  withoutTags: number
  withBox: number
  newCount: number
  existingCount: number
}

function SettingsPage() {
  const { cards, replaceAll } = useCardsContext()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importData, setImportData] = useState<Card[] | null>(null)
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null)
  const [importError, setImportError] = useState<string[]>([])
  const [isImporting, setIsImporting] = useState(false)

  useEffect(() => {
    document.title = 'Settings - ZettleCards'
  }, [])

  // CSV escape function for proper CSV formatting
  const csvEscape = (s: string): string => {
    return `"${s.replace(/"/g, '""')}"`
  }

  // Export JSON backup
  const handleExportJSON = () => {
    const backup: Backup = {
      schemaVersion: 1 as const,
      exportedAt: Date.now(),
      cards
    }

    const blob = new Blob([JSON.stringify(backup, null, 2)], { 
      type: "application/json" 
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'zettlecards-backup.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Export CSV (Anki-friendly format)
  const handleExportCSV = () => {
    const rows = [
      ["Question", "Answer", "Tags"],
      ...cards.map(card => [
        card.question,
        card.answerMD,
        (card.tags ?? []).join(" ")
      ])
    ]
    
    const csv = rows.map(row => row.map(csvEscape).join(",")).join("\r\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'zettlecards-export.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Handle file selection for import
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImportFile(file)
    setImportData(null)
    setImportSummary(null)
    setImportError([])

    try {
      const text = await file.text()
      let parsed: unknown

      try {
        parsed = JSON.parse(text)
      } catch {
        setImportError(['Invalid JSON file format'])
        return
      }

      // Validate with zod schema
      const validation = BackupZ.safeParse(parsed)
      
      if (!validation.success) {
        const errors = validation.error.issues.map((err) => 
          `${err.path.join('.')}: ${err.message}`
        ).slice(0, 10) // Limit to first 10 errors
        
        if (validation.error.issues.length > 10) {
          errors.push(`... and ${validation.error.issues.length - 10} more errors`)
        }
        
        setImportError(errors)
        return
      }

      const backup = validation.data
      
      // Normalize cards
      const normalizedCards: Card[] = backup.cards.map(card => ({
        ...card,
        question: card.question.trim(),
        answerMD: card.answerMD.trim(),
        tags: normalizeTags(card.tags ?? []),
        createdAt: card.createdAt || Date.now(),
        updatedAt: card.updatedAt || Date.now(),
        box: card.box ?? 1,
        due: card.due ?? Date.now()
      }))

      // Remove duplicates within import (last one wins)
      const deduplicatedCards: Card[] = []
      const seenIds = new Set<string>()
      
      for (let i = normalizedCards.length - 1; i >= 0; i--) {
        const card = normalizedCards[i]
        if (!seenIds.has(card.id)) {
          seenIds.add(card.id)
          deduplicatedCards.unshift(card)
        }
      }

      setImportData(deduplicatedCards)

      // Compute dry-run summary
      const existingIds = new Set(cards.map(card => card.id))
      const withTags = deduplicatedCards.filter(card => card.tags && card.tags.length > 0).length
      const withBox = deduplicatedCards.filter(card => card.box != null).length
      const newCount = deduplicatedCards.filter(card => !existingIds.has(card.id)).length
      const existingCount = deduplicatedCards.filter(card => existingIds.has(card.id)).length

      setImportSummary({
        total: deduplicatedCards.length,
        withTags,
        withoutTags: deduplicatedCards.length - withTags,
        withBox,
        newCount,
        existingCount
      })

    } catch (err) {
      setImportError(['Failed to read file: ' + (err instanceof Error ? err.message : 'Unknown error')])
    }
  }

  // Merge import (overwrite by id)
  const handleMergeImport = async () => {
    if (!importData) return
    
    setIsImporting(true)
    
    try {
      // Merge: update existing cards, add new ones
      const mergedCards = [...cards]
      
      for (const importCard of importData) {
        const existingIndex = mergedCards.findIndex(card => card.id === importCard.id)
        if (existingIndex >= 0) {
          // Overwrite existing card entirely
          mergedCards[existingIndex] = importCard
        } else {
          // Add new card
          mergedCards.push(importCard)
        }
      }
      
      replaceAll(mergedCards)
      
      alert(`Successfully merged ${importData.length} cards`)
      
      // Reset import state
      setImportFile(null)
      setImportData(null)
      setImportSummary(null)
      setImportError([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
    } catch (err) {
      alert('Import failed: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setIsImporting(false)
    }
  }

  // Replace all import
  const handleReplaceAllImport = async () => {
    if (!importData) return
    
    if (!confirm(`This will REPLACE ALL ${cards.length} existing cards with ${importData.length} imported cards. This cannot be undone. Are you sure?`)) {
      return
    }
    
    setIsImporting(true)
    
    try {
      replaceAll(importData)
      
      alert(`Successfully replaced all cards with ${importData.length} imported cards`)
      
      // Reset import state
      setImportFile(null)
      setImportData(null)
      setImportSummary(null)
      setImportError([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
    } catch (err) {
      alert('Import failed: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <Link
          to="/library"
          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
        >
          Back to Library
        </Link>
      </div>

      <div className="space-y-8">
        {/* Export Section */}
        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Export Data
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
            Data lives only in your browser (IndexedDB). Export regularly if needed.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleExportJSON}
              disabled={cards.length === 0}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg font-medium transition-colors"
            >
              Export JSON Backup
            </button>
            <button
              onClick={handleExportCSV}
              disabled={cards.length === 0}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg font-medium transition-colors"
            >
              Export CSV (Anki)
            </button>
          </div>
          
          {cards.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              No cards to export. Import some cards first.
            </p>
          )}
        </section>

        {/* Import Section */}
        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Import Data
          </h2>
          
          <div className="space-y-4">
            {/* File Input */}
            <div>
              <label htmlFor="import-file" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Choose JSON backup file
              </label>
              <input
                ref={fileInputRef}
                id="import-file"
                type="file"
                accept="application/json"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-900 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Import Errors */}
            {importError.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-red-900 dark:text-red-100 mb-2">
                  Validation Errors:
                </h3>
                <ul className="text-sm text-red-700 dark:text-red-200 space-y-1">
                  {importError.map((error, i) => (
                    <li key={i} className="font-mono">• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Import Summary */}
            {importSummary && importData && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Import Preview ({importFile?.name}):
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-blue-700 dark:text-blue-200">
                  <div>
                    <span className="font-medium">{importSummary.total}</span> total cards
                  </div>
                  <div>
                    <span className="font-medium">{importSummary.newCount}</span> new cards
                  </div>
                  <div>
                    <span className="font-medium">{importSummary.existingCount}</span> existing cards
                  </div>
                  <div>
                    <span className="font-medium">{importSummary.withTags}</span> with tags
                  </div>
                  <div>
                    <span className="font-medium">{importSummary.withBox}</span> with progress
                  </div>
                  <div>
                    <span className="font-medium">{importSummary.withoutTags}</span> no tags
                  </div>
                </div>
                
                {importSummary.existingCount > 0 && (
                  <p className="text-xs text-blue-600 dark:text-blue-300 mt-2">
                    Note: Duplicate IDs within the file are resolved (last one wins).
                  </p>
                )}
              </div>
            )}

            {/* Import Actions */}
            {importData && importSummary && (
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleMergeImport}
                  disabled={isImporting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg font-medium transition-colors"
                >
                  {isImporting ? 'Importing...' : `Merge (${importSummary.newCount} new, ${importSummary.existingCount} updated)`}
                </button>
                <button
                  onClick={handleReplaceAllImport}
                  disabled={isImporting}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg font-medium transition-colors"
                >
                  {isImporting ? 'Replacing...' : `Replace All (${importSummary.total} cards)`}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Danger Zone */}
        <section className="bg-white dark:bg-gray-800 border-2 border-red-200 dark:border-red-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-900 dark:text-red-100 mb-2">
            ⚠️ Danger Zone
          </h2>
          <p className="text-red-700 dark:text-red-300 text-sm mb-4">
            <strong>Replace All</strong> will permanently delete all existing cards and replace them with imported data. 
            This action cannot be undone. Always export your data first as a backup.
          </p>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            <strong>Merge</strong> is safer: it adds new cards and overwrites existing ones by ID, 
            preserving any cards not in the import file.
          </p>
        </section>

        {/* PWA Section */}
        <section className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Offline Usage
          </h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600 dark:text-green-400">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22,4 12,14.01 9,11.01" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Offline mode enabled
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  The app caches your data and works without internet connection
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600 dark:text-blue-400">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7,10 12,15 17,10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Installable app
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Install ZettleCards to your device for quick access
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Info Section */}
        <section className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            About Data Storage
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
            ZettleCards stores all your data locally in your browser using IndexedDB. 
            No data is sent to external servers. Regular exports are recommended for backup purposes.
            CSV exports can be imported into Anki or other spaced repetition software.
          </p>
        </section>

        {/* Help & Documentation */}
        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Help & Documentation
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
            Learn how to format your notes for optimal importing and review.
          </p>
          
          <Link
            to="/help/schema"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>Note Schema Guide</span>
          </Link>
          
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
            Includes examples, best practices, and a live note parser to test your Markdown files.
          </p>
        </section>
      </div>
    </div>
  )
}

export default SettingsPage
