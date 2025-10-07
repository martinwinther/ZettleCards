import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { parseMdFile } from '../lib/extractFromMd'
import { useCardsContext } from '../lib/CardsContext'
import { useToast } from '../components/Toaster'
import { sha256 } from '../lib/hash'
import { db } from '../db'
import type { Card } from '../lib/types'

interface ParsedResult {
  question: string
  answerMD: string
  tags: string[]
  answerSnippet: string
}

const sampleNotes = [
  {
    filename: 'what-is-bhakti.md',
    content: `What is Bhakti Yoga?

Bhakti Yoga is the path of loving devotion to the Supreme. Krishna declares it the highest and most accessible path to liberation.

"Always think of Me, become My devotee, worship Me, and offer your homage unto Me. Thus you will come to Me without fail."

Key practices include:
- Constant remembrance of the Divine
- Surrender of the ego and personal will
- Service and worship with love
- Seeing the Divine in all beings

Unlike jnana (knowledge) or karma (action), bhakti requires no special qualifications—only sincere love and devotion.

#gita #bhakti #devotion #yoga`
  },
  {
    filename: '202509301145 Supreme Person.md',
    content: `In Chapter 15, Krishna reveals the concept of the Purushottama—the Supreme Person who transcends both the perishable material world and the imperishable soul.

There are two types of beings: the perishable (all material bodies) and the imperishable (the eternal souls). But beyond both is the Supreme Person, who enters the three worlds and maintains them.

This is the ultimate reality—not just the unchanging Brahman, but the personal Divine who is the source of both matter and spirit.

#gita #purushottama #metaphysics`
  },
  {
    filename: 'duty-and-detachment.md',
    content: `---
title: How can we act without attachment?
tags: [gita, karma-yoga, action]
---

Krishna teaches that we must perform our duty without attachment to results. This is the essence of Karma Yoga.

"You have a right to perform your prescribed duty, but you are not entitled to the fruits of action."

Act with:
1. Full engagement in the present moment
2. Detachment from outcomes
3. Dedication of all actions to the Divine

This way, action becomes worship and does not bind us.`
  },
  {
    filename: '20250101_1430-three-modes.md',
    content: `# What are the three modes of material nature?

The three gunas (modes) are:

1. **Sattva (Goodness)** - purity, knowledge, harmony
2. **Rajas (Passion)** - activity, desire, attachment  
3. **Tamas (Ignorance)** - inertia, darkness, delusion

All material existence operates through these three forces. Understanding them helps us transcend material conditioning.

#gita #gunas #philosophy #chapter/14`
  }
]

function NoteSchemaPage() {
  const { addCard } = useCardsContext()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [testNote, setTestNote] = useState('')
  const [testFilename, setTestFilename] = useState('test-note.md')
  const [parsedResult, setParsedResult] = useState<ParsedResult | null>(null)
  const [isImporting, setIsImporting] = useState(false)

  useEffect(() => {
    document.title = 'Note Schema - Flash Files'
  }, [])

  const handleParsePreview = () => {
    if (!testNote.trim()) {
      toast({
        type: 'error',
        title: 'No content',
        message: 'Please enter some note content to parse'
      })
      return
    }

    try {
      const parsed = parseMdFile(testNote, testFilename)
      const snippet = parsed.answerMD.slice(0, 150) + (parsed.answerMD.length > 150 ? '...' : '')
      
      setParsedResult({
        question: parsed.question,
        answerMD: parsed.answerMD,
        tags: parsed.tags,
        answerSnippet: snippet
      })

      toast({
        type: 'success',
        title: 'Parsed successfully',
        message: 'See the result below'
      })
    } catch (err) {
      toast({
        type: 'error',
        title: 'Parse failed',
        message: err instanceof Error ? err.message : 'Unknown error'
      })
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.md')) {
      toast({
        type: 'error',
        title: 'Invalid file type',
        message: 'Please upload a .md (Markdown) file'
      })
      return
    }

    try {
      const content = await file.text()
      setTestNote(content)
      setTestFilename(file.name)
      
      // Auto-parse
      const parsed = parseMdFile(content, file.name)
      const snippet = parsed.answerMD.slice(0, 150) + (parsed.answerMD.length > 150 ? '...' : '')
      
      setParsedResult({
        question: parsed.question,
        answerMD: parsed.answerMD,
        tags: parsed.tags,
        answerSnippet: snippet
      })

      toast({
        type: 'success',
        title: 'File loaded and parsed',
        message: file.name
      })
    } catch (err) {
      toast({
        type: 'error',
        title: 'Failed to read file',
        message: err instanceof Error ? err.message : 'Unknown error'
      })
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleImportSample = async () => {
    if (!parsedResult) return

    setIsImporting(true)
    try {
      const contentHash = await sha256(parsedResult.question + '\n\n' + parsedResult.answerMD)
      
      // Check for duplicate
      const existingImport = await db.imports.where('contentHash').equals(contentHash).first()
      if (existingImport) {
        toast({
          type: 'info',
          title: 'Duplicate detected',
          message: 'This note appears to be already imported'
        })
        setIsImporting(false)
        return
      }

      const now = Date.now()
      const newCard: Card = {
        id: crypto.randomUUID(),
        question: parsedResult.question,
        answerMD: parsedResult.answerMD,
        tags: parsedResult.tags,
        createdAt: now,
        updatedAt: now,
        box: 1,
        due: now
      }

      await addCard(newCard)
      await db.imports.add({
        id: crypto.randomUUID(),
        fileName: testFilename,
        cardId: newCard.id,
        contentHash,
        createdAt: now
      })

      toast({
        type: 'success',
        title: 'Card added to library',
        message: 'You can review it anytime'
      })

      // Clear the form
      setTestNote('')
      setParsedResult(null)
      setTestFilename('test-note.md')
    } catch (err) {
      toast({
        type: 'error',
        title: 'Import failed',
        message: err instanceof Error ? err.message : 'Unknown error'
      })
    } finally {
      setIsImporting(false)
    }
  }

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        type: 'success',
        title: 'Copied to clipboard',
        message: label
      })
    } catch (err) {
      toast({
        type: 'error',
        title: 'Copy failed',
        message: 'Please copy manually'
      })
    }
  }

  const downloadAllSamples = () => {
    sampleNotes.forEach(note => {
      const blob = new Blob([note.content], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = note.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    })

    toast({
      type: 'success',
      title: 'Downloading samples',
      message: `${sampleNotes.length} files`
    })
  }

  const copyAllSamples = async () => {
    const combined = sampleNotes
      .map(note => `--- ${note.filename} ---\n\n${note.content}`)
      .join('\n\n\n')
    
    await copyToClipboard(combined, 'All sample notes')
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Note Schema Guide
        </h1>
        <Link
          to="/settings"
          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors text-sm"
        >
          Back to Settings
        </Link>
      </div>

      {/* Introduction */}
      <section className="mb-12">
        <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
          Learn how Flash Files extracts questions, answers, and tags from your Obsidian or Zettelkasten Markdown notes. 
          Follow these conventions for reliable parsing and a smooth review experience.
        </p>
      </section>

      <div className="space-y-12">
        {/* Overview */}
        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Overview
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Flash Files reads your Markdown notes and extracts:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 mb-4">
            <li><strong>Question:</strong> Derived from frontmatter title, first H1, first line, or filename</li>
            <li><strong>Answer:</strong> The body content (minus the extracted title line)</li>
            <li><strong>Tags:</strong> From frontmatter <code className="text-sm bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">tags</code> field and inline <code className="text-sm bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">#hashtags</code></li>
          </ul>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            This approach works seamlessly with Obsidian vaults and Zettelkasten workflows.
          </p>
        </section>

        {/* Title Extraction Rules */}
        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Title Extraction Rules
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Flash Files uses this priority order to determine the question:
          </p>
          <ol className="list-decimal list-inside space-y-3 text-gray-700 dark:text-gray-300 mb-6">
            <li><strong>Frontmatter <code className="text-sm bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">title</code> field</strong> — highest priority</li>
            <li><strong>First <code className="text-sm bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded"># H1</code> heading</strong></li>
            <li><strong>First non-empty line</strong> of the content</li>
            <li><strong>Filename</strong> (without extension, with Zettelkasten UID stripped)</li>
          </ol>

          <div className="space-y-6">
            {/* Example 1: Frontmatter title */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2 flex items-center justify-between">
                Example: Frontmatter title
                <button
                  onClick={() => copyToClipboard(`---
title: How can we act without attachment?
tags: [gita, karma-yoga]
---

Krishna teaches that we must perform our duty without attachment to results.`, 'Frontmatter example')}
                  className="text-sm px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                  aria-label="Copy frontmatter example"
                >
                  Copy
                </button>
              </h3>
              <pre className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg p-4 text-sm overflow-x-auto">
                <code className="text-gray-800 dark:text-gray-200">{`---
title: How can we act without attachment?
tags: [gita, karma-yoga]
---

Krishna teaches that we must perform our duty without attachment to results.`}</code>
              </pre>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                → Question: <strong>How can we act without attachment?</strong>
              </p>
            </div>

            {/* Example 2: H1 heading */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2 flex items-center justify-between">
                Example: First H1 heading
                <button
                  onClick={() => copyToClipboard(`# What are the three modes of nature?

The three gunas are sattva, rajas, and tamas.

#gita #gunas`, 'H1 example')}
                  className="text-sm px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                  aria-label="Copy H1 example"
                >
                  Copy
                </button>
              </h3>
              <pre className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg p-4 text-sm overflow-x-auto">
                <code className="text-gray-800 dark:text-gray-200">{`# What are the three modes of nature?

The three gunas are sattva, rajas, and tamas.

#gita #gunas`}</code>
              </pre>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                → Question: <strong>What are the three modes of nature?</strong> (H1 is removed from answer)
              </p>
            </div>

            {/* Example 3: Filename */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Example: Filename fallback
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                If a note has no frontmatter title, no H1, and content starts blank, the filename is used:
              </p>
              <pre className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg p-4 text-sm overflow-x-auto">
                <code className="text-gray-800 dark:text-gray-200">{`Filename: 202509301145 Supreme Person.md
→ Question: Supreme Person`}</code>
              </pre>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Note: Zettelkasten UIDs (see below) are automatically stripped from filenames.
              </p>
            </div>
          </div>
        </section>

        {/* Tags */}
        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Tags (Categories)
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Tags help organize your cards. Flash Files recognizes two tag sources:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 mb-6">
            <li><strong>Frontmatter <code className="text-sm bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">tags</code>:</strong> Can be an array <code className="text-sm bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">[gita, karma]</code> or a string</li>
            <li><strong>Inline hashtags:</strong> Like <code className="text-sm bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">#gita</code> or <code className="text-sm bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">#chapter/2</code> anywhere in the note</li>
          </ul>

          <div className="space-y-6">
            {/* Tags Example */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2 flex items-center justify-between">
                Example: Combining frontmatter and inline tags
                <button
                  onClick={() => copyToClipboard(`---
tags: [gita, chapter/2]
---

# Arjuna's Dilemma

Arjuna faces a moral crisis on the battlefield of Kurukshetra.

#bhagavad-gita #philosophy`, 'Tags example')}
                  className="text-sm px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                  aria-label="Copy tags example"
                >
                  Copy
                </button>
              </h3>
              <pre className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg p-4 text-sm overflow-x-auto">
                <code className="text-gray-800 dark:text-gray-200">{`---
tags: [gita, chapter/2]
---

# Arjuna's Dilemma

Arjuna faces a moral crisis on the battlefield of Kurukshetra.

#bhagavad-gita #philosophy`}</code>
              </pre>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                → Tags: <strong>gita, chapter/2, bhagavad-gita, philosophy</strong> (merged and deduplicated)
              </p>
            </div>

            {/* Normalization */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Tag Normalization
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Converted to lowercase</li>
                <li>• Leading <code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">#</code> symbols stripped</li>
                <li>• Hierarchies like <code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">chapter/2</code> are preserved</li>
                <li>• Duplicates automatically removed</li>
                <li>• Whitespace trimmed and collapsed</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Zettelkasten UID Rules */}
        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Zettelkasten UID Rules
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            If you use Zettelkasten-style unique identifiers in filenames, Flash Files automatically strips them when deriving the question from the filename.
          </p>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Recognized UID patterns (8-14 digits, optionally followed by <code className="text-sm bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">-</code>, <code className="text-sm bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">_</code>, or space):
          </p>

          <div className="space-y-4">
            <pre className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg p-4 text-sm overflow-x-auto">
              <code className="text-gray-800 dark:text-gray-200">{`202509301145 Supreme Person.md       → Supreme Person
20250930_1145-Three Gunas.md          → Three Gunas
202509301145-Karma Yoga.md            → Karma Yoga
20250930091500 Field and Knower.md    → Field and Knower`}</code>
            </pre>

            <p className="text-sm text-gray-600 dark:text-gray-400">
              This ensures your question titles remain clean and readable, even with timestamp-based note IDs.
            </p>
          </div>
        </section>

        {/* Code Blocks & Inline Tags */}
        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Code Blocks & Inline Tags
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Inline hashtags inside fenced code blocks (triple backticks <code className="text-sm bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">```</code> or tildes <code className="text-sm bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">~~~</code>) are <strong>ignored</strong>.
          </p>

          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2 flex items-center justify-between">
              Example: Tags in code blocks are ignored
              <button
                onClick={() => copyToClipboard(`# How to write Python comments?

In Python, use the # symbol for comments:

\`\`\`python
# This is a comment
print("Hello")  #inline-comment
\`\`\`

#python #programming`, 'Code block example')}
                className="text-sm px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                aria-label="Copy code block example"
              >
                Copy
              </button>
            </h3>
            <pre className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg p-4 text-sm overflow-x-auto">
              <code className="text-gray-800 dark:text-gray-200">{`# How to write Python comments?

In Python, use the # symbol for comments:

\`\`\`python
# This is a comment
print("Hello")  #inline-comment
\`\`\`

#python #programming`}</code>
            </pre>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              → Tags: <strong>python, programming</strong> (only tags outside code blocks are extracted)
            </p>
          </div>
        </section>

        {/* Length & Splitting */}
        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Note Length & Splitting
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            For optimal spaced repetition, keep notes concise and focused on a single idea.
          </p>
          
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2">
              Recommended Guidelines
            </h3>
            <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
              <li>• <strong>Ideal:</strong> 500-1000 characters per note</li>
              <li>• <strong>Maximum:</strong> ~2-3 KB (2000-3000 characters)</li>
              <li>• <strong>One idea per note:</strong> Makes reviewing more effective</li>
            </ul>
          </div>

          <p className="text-gray-700 dark:text-gray-300 mb-4">
            If a note is too long, consider splitting it:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>Create separate notes for each concept or sub-topic</li>
            <li>Use hierarchical tags (e.g., <code className="text-sm bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">#gita/chapter/2</code>) to maintain relationships</li>
            <li>Link related notes using <code className="text-sm bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">[[wiki-links]]</code> in your Obsidian vault</li>
          </ul>
        </section>

        {/* Sample Notes */}
        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Sample Notes
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Here are ready-to-import examples demonstrating different formats:
          </p>

          <div className="space-y-6">
            {sampleNotes.map((note, index) => (
              <div key={index}>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2 flex items-center justify-between">
                  <code className="text-sm bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">{note.filename}</code>
                  <button
                    onClick={() => copyToClipboard(note.content, note.filename)}
                    className="text-sm px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                    aria-label={`Copy ${note.filename}`}
                  >
                    Copy
                  </button>
                </h3>
                <pre className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg p-4 text-sm overflow-x-auto">
                  <code className="text-gray-800 dark:text-gray-200">{note.content}</code>
                </pre>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <button
              onClick={downloadAllSamples}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
            >
              Download All Samples ({sampleNotes.length} files)
            </button>
            <button
              onClick={copyAllSamples}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
            >
              Copy All to Clipboard
            </button>
          </div>
        </section>

        {/* Best Practices */}
        <section className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-green-900 dark:text-green-100 mb-4">
            Best Practices
          </h2>
          <ul className="space-y-3 text-green-800 dark:text-green-200">
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span><strong>One idea per note:</strong> Each note should capture a single concept or question</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span><strong>Use frontmatter <code className="text-sm bg-green-100 dark:bg-green-900 px-1 py-0.5 rounded">tags</code>:</strong> More reliable than inline tags for categorization</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span><strong>Hierarchical tags:</strong> Use <code className="text-sm bg-green-100 dark:bg-green-900 px-1 py-0.5 rounded">#subject/subtopic</code> to organize related notes</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span><strong>Clear questions:</strong> Use H1 headings or frontmatter titles that read as questions</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span><strong>Concise answers:</strong> Keep explanations focused and review-friendly</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span><strong>Test before batch import:</strong> Use the live parser below to verify parsing</span>
            </li>
          </ul>
        </section>

        {/* Live Parser */}
        <section className="bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-700 rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Test Your Note
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Paste a note or upload a file to see how Flash Files will parse it. This uses the same extraction logic as the Import page.
          </p>

          <div className="space-y-6">
            {/* Filename input */}
            <div>
              <label htmlFor="test-filename" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filename (optional, for testing filename-based title extraction):
              </label>
              <input
                id="test-filename"
                type="text"
                value={testFilename}
                onChange={(e) => setTestFilename(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="202509301145 Supreme Person.md"
              />
            </div>

            {/* File upload */}
            <div>
              <label htmlFor="test-file-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Or upload a .md file:
              </label>
              <input
                ref={fileInputRef}
                id="test-file-upload"
                type="file"
                accept=".md"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-900 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Textarea */}
            <div>
              <label htmlFor="test-textarea" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Note content:
              </label>
              <textarea
                id="test-textarea"
                value={testNote}
                onChange={(e) => setTestNote(e.target.value)}
                rows={12}
                className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Paste your Markdown note here..."
              />
            </div>

            {/* Parse button */}
            <button
              onClick={handleParsePreview}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Parse Preview
            </button>

            {/* Results */}
            {parsedResult && (
              <div 
                className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6"
                role="region"
                aria-live="polite"
                aria-label="Parse results"
              >
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
                  Parsed Result
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">Question:</p>
                    <p className="text-gray-900 dark:text-white font-medium">{parsedResult.question}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">Answer snippet:</p>
                    <p className="text-gray-700 dark:text-gray-300 text-sm">{parsedResult.answerSnippet}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">Tags ({parsedResult.tags.length}):</p>
                    {parsedResult.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {parsedResult.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600 dark:text-gray-400 italic">No tags found</p>
                    )}
                  </div>

                  <button
                    onClick={handleImportSample}
                    disabled={isImporting}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  >
                    {isImporting ? 'Importing...' : 'Import This Note to Library'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Troubleshooting */}
        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Troubleshooting
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                ❓ No title detected / Wrong title extracted?
              </h3>
              <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
                <li>Check if your frontmatter has a <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">title:</code> field</li>
                <li>Ensure your H1 heading starts with <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded"># </code> (hash + space)</li>
                <li>Verify the filename doesn't have special characters</li>
                <li>Use the live parser above to test and debug</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                🏷️ Tags missing or not detected?
              </h3>
              <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
                <li>Check if inline tags are inside code blocks (they're ignored there)</li>
                <li>Use frontmatter <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">tags: [tag1, tag2]</code> for reliability</li>
                <li>Ensure hashtags follow the format <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">#tag-name</code> (alphanumeric, hyphens, underscores, slashes)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                🔁 Duplicate imports?
              </h3>
              <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
                <li>Flash Files tracks imported notes by content hash</li>
                <li>If you reimport the same content, the Import page will show duplicate warnings</li>
                <li>You can choose to skip, overwrite, or create duplicates</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                📝 Content not rendering correctly in review?
              </h3>
              <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
                <li>Flash Files renders Markdown using CommonMark spec</li>
                <li>Check for unsupported syntax or extensions</li>
                <li>Use the Card View (click a card in Library) to preview rendering</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Feedback */}
        <section className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Feedback & Support
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Found an edge case or have suggestions for better parsing? We'd love to hear from you!
          </p>
          <a
            href="mailto:feedback@example.com?subject=Flash%20Files%20Note%20Parser%20Feedback&body=Please%20describe%20your%20issue%20or%20suggestion%20here."
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Send Feedback
          </a>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
            You can also share problematic note examples to help improve the parser.
          </p>
        </section>
      </div>
    </div>
  )
}

export default NoteSchemaPage

