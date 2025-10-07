import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { parseMdFile } from '../lib/extractFromMd'
import { useCardsContext } from '../lib/CardsContext'
import { sha256 } from '../lib/hash'
import { normalizeTag } from '../lib/tags'
import { useToast } from '../components/Toaster'
import { Spinner } from '../components/Spinner'
import { db } from '../db'
import type { Card } from '../lib/types'

type DuplicateAction = 'skip' | 'overwrite' | 'duplicate'

interface DuplicateInfo {
  existingCardId: string
  existingQuestion: string
  existingUpdatedAt: number
}

interface FilePreview {
  id: string
  filename: string
  question: string
  answerMD: string
  tags: string[]
  answerSnippet: string
  contentHash: string
  duplicateInfo: DuplicateInfo | null
  action: DuplicateAction
}

function ImportPage() {
  const navigate = useNavigate()
  const { reload } = useCardsContext()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [previews, setPreviews] = useState<FilePreview[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string>('')
  const [isImporting, setIsImporting] = useState(false)

  useEffect(() => {
    document.title = 'Import - ZettleCards'
  }, [])

  const processFiles = async (files: FileList) => {
    const MAX_FILE_SIZE = 10 * 1024 // 10KB in bytes
    const mdFiles = Array.from(files).filter(file => file.name.endsWith('.md'))
    
    if (mdFiles.length === 0) {
      setError('Please select only .md (Markdown) files.')
      return
    }
    
    // Check file sizes and filter out files that are too large
    const validFiles: File[] = []
    const oversizedFiles: string[] = []
    
    for (const file of mdFiles) {
      if (file.size > MAX_FILE_SIZE) {
        oversizedFiles.push(file.name)
      } else {
        validFiles.push(file)
      }
    }
    
    // Set error messages
    if (validFiles.length === 0 && oversizedFiles.length > 0) {
      setError(`All files exceed the 10KB size limit. Please use smaller notes.`)
      return
    }
    
    if (oversizedFiles.length > 0) {
      setError(`${oversizedFiles.length} file(s) skipped (over 10KB): ${oversizedFiles.join(', ')}`)
    } else if (mdFiles.length !== files.length) {
      setError('Some files were skipped - only .md files are supported.')
    } else {
      setError('')
    }

    const newPreviews: FilePreview[] = []
    
    for (const file of validFiles) {
      try {
        const text = await file.text()
        const parsed = parseMdFile(text, file.name)
        
        const contentHash = await sha256(parsed.question + '\n\n' + parsed.answerMD)
        
        const existingImport = await db.imports.where('contentHash').equals(contentHash).first()
        let duplicateInfo: DuplicateInfo | null = null
        
        if (existingImport) {
          const existingCard = await db.cards.get(existingImport.cardId)
          if (existingCard) {
            duplicateInfo = {
              existingCardId: existingCard.id,
              existingQuestion: existingCard.question,
              existingUpdatedAt: existingCard.updatedAt
            }
          }
        }
        
        newPreviews.push({
          id: crypto.randomUUID(),
          filename: file.name,
          question: parsed.question,
          answerMD: parsed.answerMD,
          tags: parsed.tags,
          answerSnippet: parsed.answerMD.slice(0, 120) + (parsed.answerMD.length > 120 ? '...' : ''),
          contentHash,
          duplicateInfo,
          action: duplicateInfo ? 'skip' : 'duplicate'
        })
      } catch (err) {
        console.error(`Error processing ${file.name}:`, err)
      }
    }
    
    setPreviews(prev => [...prev, ...newPreviews])
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files)
    }
  }

  const addTag = (previewId: string, tag: string) => {
    const normalizedTag = normalizeTag(tag)
    if (!normalizedTag) return
    
    setPreviews(prev => prev.map(p => 
      p.id === previewId && !p.tags.includes(normalizedTag)
        ? { ...p, tags: [...p.tags, normalizedTag] }
        : p
    ))
  }

  const removeTag = (previewId: string, tagToRemove: string) => {
    setPreviews(prev => prev.map(p => 
      p.id === previewId 
        ? { ...p, tags: p.tags.filter(tag => tag !== tagToRemove) }
        : p
    ))
  }

  const clearPreviews = () => {
    setPreviews([])
    setError('')
  }

  const setPreviewAction = (previewId: string, action: DuplicateAction) => {
    setPreviews(prev => prev.map(p => 
      p.id === previewId ? { ...p, action } : p
    ))
  }

  const setBulkAction = (action: DuplicateAction) => {
    setPreviews(prev => prev.map(p => 
      p.duplicateInfo ? { ...p, action } : p
    ))
  }

  const importCards = async () => {
    const now = Date.now()
    const toImport = previews.filter(p => p.action !== 'skip')
    
    if (toImport.length === 0) {
      toast({
        type: 'info',
        title: 'No cards to import',
        message: 'All cards were skipped'
      })
      return
    }

    setIsImporting(true)

    try {
      for (const preview of toImport) {
        let cardId: string
        
        if (preview.action === 'overwrite' && preview.duplicateInfo) {
          cardId = preview.duplicateInfo.existingCardId
          await db.cards.update(cardId, {
            question: preview.question,
            answerMD: preview.answerMD,
            tags: preview.tags,
            updatedAt: now
          })
        } else {
          cardId = crypto.randomUUID()
          const newCard: Card = {
            id: cardId,
            question: preview.question,
            answerMD: preview.answerMD,
            tags: preview.tags,
            createdAt: now,
            updatedAt: now,
            box: 1,
            due: now
          }
          await db.cards.put(newCard)
        }
        
        await db.imports.put({
          id: crypto.randomUUID(),
          fileName: preview.filename,
          contentHash: preview.contentHash,
          cardId,
          createdAt: now
        })
      }
      
      await reload()
      toast({
        type: 'success',
        title: 'Import successful',
        message: `Imported ${toImport.length} card(s)`
      })
      navigate('/library')
    } catch (error) {
      console.error('Import error:', error)
      toast({
        type: 'error',
        title: 'Import failed',
        message: error instanceof Error ? error.message : 'An error occurred'
      })
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Import (Obsidian Markdown only)
      </h1>
      
      {/* Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive 
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="space-y-4">
          <div className="text-4xl">📄</div>
          <div>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              Drop your Obsidian .md files here
            </p>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              or click to browse files
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Maximum file size: 10KB per file
            </p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Select Files
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".md"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Preview Table */}
      {previews.length > 0 && (
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Preview ({previews.length} files)
            </h2>
            <div className="space-x-3">
              <button
                onClick={clearPreviews}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
              >
                Clear
              </button>
              <button
                onClick={importCards}
                disabled={isImporting}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                {isImporting && <Spinner size="sm" />}
                {isImporting ? 'Importing...' : `Import ${previews.filter(p => p.action !== 'skip').length} cards`}
              </button>
            </div>
          </div>

          {previews.some(p => p.duplicateInfo) && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-yellow-800 dark:text-yellow-200 font-medium">
                    ⚠️ {previews.filter(p => p.duplicateInfo).length} duplicate(s) detected
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setBulkAction('skip')}
                    className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Skip All
                  </button>
                  <button
                    onClick={() => setBulkAction('overwrite')}
                    className="px-3 py-1 text-sm bg-orange-200 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200 rounded hover:bg-orange-300 dark:hover:bg-orange-900/70 transition-colors"
                  >
                    Overwrite All
                  </button>
                  <button
                    onClick={() => setBulkAction('duplicate')}
                    className="px-3 py-1 text-sm bg-blue-200 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded hover:bg-blue-300 dark:hover:bg-blue-900/70 transition-colors"
                  >
                    Duplicate All
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Filename
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Question
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Tags
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Answer Preview
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {previews.map((preview) => (
                    <PreviewRow
                      key={preview.id}
                      preview={preview}
                      onAddTag={(tag) => addTag(preview.id, tag)}
                      onRemoveTag={(tag) => removeTag(preview.id, tag)}
                      onSetAction={(action) => setPreviewAction(preview.id, action)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface PreviewRowProps {
  preview: FilePreview
  onAddTag: (tag: string) => void
  onRemoveTag: (tag: string) => void
  onSetAction: (action: DuplicateAction) => void
}

function PreviewRow({ preview, onAddTag, onRemoveTag, onSetAction }: PreviewRowProps) {
  const [newTag, setNewTag] = useState('')

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault()
    if (newTag.trim()) {
      onAddTag(newTag.trim())
      setNewTag('')
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
      <td className="px-4 py-4 text-sm">
        {preview.duplicateInfo ? (
          <div className="space-y-2">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-yellow-700 dark:text-yellow-300">
                Duplicate
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Updated: {formatDate(preview.duplicateInfo.existingUpdatedAt)}
              </span>
            </div>
            <select
              value={preview.action}
              onChange={(e) => onSetAction(e.target.value as DuplicateAction)}
              className="w-full text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="skip">Skip</option>
              <option value="overwrite">Overwrite</option>
              <option value="duplicate">Create New</option>
            </select>
          </div>
        ) : (
          <span className="inline-flex items-center px-2 py-1 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 text-xs rounded-full font-medium">
            New
          </span>
        )}
      </td>
      <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
        <div className="font-medium">{preview.filename}</div>
      </td>
      <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
        <div className="max-w-xs">
          {preview.question}
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1">
            {preview.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-xs rounded-full"
              >
                #{tag}
                <button
                  onClick={() => onRemoveTag(tag)}
                  className="hover:text-blue-600 dark:hover:text-blue-300"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <form onSubmit={handleAddTag} className="flex gap-1">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add tag..."
              className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </form>
        </div>
      </td>
      <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
        <div className="max-w-xs">
          {preview.answerSnippet}
        </div>
      </td>
    </tr>
  )
}

export default ImportPage
