import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { parseMdFile } from '../lib/extractFromMd'
import { useCardsContext } from '../lib/CardsContext'
import { Card } from '../lib/types'

interface FilePreview {
  id: string
  filename: string
  question: string
  answerMD: string
  tags: string[]
  answerSnippet: string
}

function ImportPage() {
  const navigate = useNavigate()
  const { addCards } = useCardsContext()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [previews, setPreviews] = useState<FilePreview[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    document.title = 'Import - Flash Files'
  }, [])

  const processFiles = async (files: FileList) => {
    const mdFiles = Array.from(files).filter(file => file.name.endsWith('.md'))
    
    if (mdFiles.length === 0) {
      setError('Please select only .md (Markdown) files.')
      return
    }
    
    if (mdFiles.length !== files.length) {
      setError('Some files were skipped - only .md files are supported.')
    } else {
      setError('')
    }

    const newPreviews: FilePreview[] = []
    
    for (const file of mdFiles) {
      try {
        const text = await file.text()
        const parsed = parseMdFile(text, file.name)
        
        newPreviews.push({
          id: crypto.randomUUID(),
          filename: file.name,
          question: parsed.question,
          answerMD: parsed.answerMD,
          tags: parsed.tags,
          answerSnippet: parsed.answerMD.slice(0, 120) + (parsed.answerMD.length > 120 ? '...' : '')
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
    const normalizedTag = tag.toLowerCase().trim().replace(/^#/, '')
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

  const importCards = () => {
    const cards: Card[] = previews.map(preview => ({
      id: crypto.randomUUID(),
      question: preview.question,
      answerMD: preview.answerMD,
      tags: preview.tags,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      box: 1,
      due: Date.now()
    }))
    
    addCards(cards)
    navigate('/library')
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
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Import {previews.length} cards
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
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
}

function PreviewRow({ preview, onAddTag, onRemoveTag }: PreviewRowProps) {
  const [newTag, setNewTag] = useState('')

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault()
    if (newTag.trim()) {
      onAddTag(newTag.trim())
      setNewTag('')
    }
  }

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
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
