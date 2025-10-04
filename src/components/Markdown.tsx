import { useMemo, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import hljs from 'highlight.js'
import { useCardsContext } from '../lib/CardsContext'
import { extractWikiLinks, resolveWikiLink } from '../lib/wikiLinks'
import type { WikiLinkResolution } from '../lib/wikiLinks'

// Import a clean, readable highlight.js theme and markdown styles
import 'highlight.js/styles/github.css'
import './markdown.css'

interface MarkdownProps {
  markdown: string
  className?: string
}

interface TooltipState {
  target: string
  resolution: WikiLinkResolution
  x: number
  y: number
}


function Markdown({ markdown, className = '' }: MarkdownProps) {
  const { cards } = useCardsContext()
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  
  const wikiLinkData = useMemo(() => {
    const links = extractWikiLinks(markdown)
    return links.map(link => ({
      ...link,
      resolution: resolveWikiLink(link.target, cards)
    }))
  }, [markdown, cards])

  const htmlContent = useMemo(() => {
    let processed = markdown
    
    // Replace wiki-links with placeholders before markdown parsing
    const placeholders: Map<string, { target: string; displayText: string; index: number }> = new Map()
    wikiLinkData.forEach((linkData, index) => {
      const placeholder = `__WIKILINK_${index}__`
      const displayText = linkData.alias || linkData.target
      placeholders.set(placeholder, { 
        target: linkData.target, 
        displayText, 
        index 
      })
      processed = processed.replace(linkData.match, placeholder)
    })
    
    // Configure marked parser with GFM support
    const renderer = new marked.Renderer()
    
    // Override code block rendering for syntax highlighting
    renderer.code = function({ text, lang }: { text: string; lang?: string }) {
      let highlighted: string
      try {
        highlighted = lang ? hljs.highlight(text, { language: lang }).value : hljs.highlightAuto(text).value
      } catch {
        highlighted = hljs.highlightAuto(text).value
      }
      return `<pre><code class="hljs${lang ? ` language-${lang}` : ''}">${highlighted}</code></pre>`
    }

    // Configure marked options
    marked.use({
      gfm: true,
      breaks: true,
      renderer: renderer
    })

    // Convert markdown to HTML
    let dirty = marked.parse(processed) as string
    
    // Replace placeholders with wiki-link HTML
    placeholders.forEach((data, placeholder) => {
      const wikiLinkHtml = `<a href="#" class="wiki-link" data-target="${data.target}" data-index="${data.index}" tabindex="0">${data.displayText}</a>`
      dirty = dirty.replace(placeholder, wikiLinkHtml)
    })
    
    // Sanitize HTML to prevent XSS
    const clean = DOMPurify.sanitize(dirty, {
      USE_PROFILES: { html: true },
      ADD_ATTR: ['target', 'rel', 'data-target', 'data-index', 'tabindex'],
      ALLOW_UNKNOWN_PROTOCOLS: false
    })
    
    return clean
  }, [markdown, wikiLinkData])

  // Post-process to handle external links
  const processedContent = useMemo(() => {
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = htmlContent
    
    // Add target="_blank" and security attributes to external links
    const links = tempDiv.querySelectorAll('a[href]')
    links.forEach(link => {
      const href = link.getAttribute('href')
      if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
        link.setAttribute('target', '_blank')
        link.setAttribute('rel', 'noopener noreferrer')
      }
    })
    
    return tempDiv.innerHTML
  }, [htmlContent])

  // Attach event handlers to wiki-links
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleWikiLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.classList.contains('wiki-link')) {
        e.preventDefault()
        const index = parseInt(target.getAttribute('data-index') || '0')
        const linkData = wikiLinkData[index]
        if (linkData?.resolution.found) {
          navigate(`/library/${linkData.resolution.id}`)
        }
      }
    }

    const handleWikiLinkKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.classList.contains('wiki-link') && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault()
        const index = parseInt(target.getAttribute('data-index') || '0')
        const linkData = wikiLinkData[index]
        if (linkData?.resolution.found) {
          navigate(`/library/${linkData.resolution.id}`)
        }
      }
    }

    const handleWikiLinkMouseEnter = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.classList.contains('wiki-link')) {
        const index = parseInt(target.getAttribute('data-index') || '0')
        const linkData = wikiLinkData[index]
        if (linkData) {
          const rect = target.getBoundingClientRect()
          setTooltip({
            target: linkData.target,
            resolution: linkData.resolution,
            x: rect.left + rect.width / 2,
            y: rect.bottom + 8
          })
        }
      }
    }

    const handleWikiLinkMouseLeave = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.classList.contains('wiki-link')) {
        setTooltip(null)
      }
    }

    const handleWikiLinkFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement
      if (target.classList.contains('wiki-link')) {
        const index = parseInt(target.getAttribute('data-index') || '0')
        const linkData = wikiLinkData[index]
        if (linkData) {
          const rect = target.getBoundingClientRect()
          setTooltip({
            target: linkData.target,
            resolution: linkData.resolution,
            x: rect.left + rect.width / 2,
            y: rect.bottom + 8
          })
        }
      }
    }

    const handleWikiLinkBlur = () => {
      setTooltip(null)
    }

    container.addEventListener('click', handleWikiLinkClick)
    container.addEventListener('keydown', handleWikiLinkKeyDown)
    container.addEventListener('mouseenter', handleWikiLinkMouseEnter, true)
    container.addEventListener('mouseleave', handleWikiLinkMouseLeave, true)
    container.addEventListener('focusin', handleWikiLinkFocus, true)
    container.addEventListener('focusout', handleWikiLinkBlur, true)

    return () => {
      container.removeEventListener('click', handleWikiLinkClick)
      container.removeEventListener('keydown', handleWikiLinkKeyDown)
      container.removeEventListener('mouseenter', handleWikiLinkMouseEnter, true)
      container.removeEventListener('mouseleave', handleWikiLinkMouseLeave, true)
      container.removeEventListener('focusin', handleWikiLinkFocus, true)
      container.removeEventListener('focusout', handleWikiLinkBlur, true)
    }
  }, [wikiLinkData, navigate])

  // Close tooltip on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setTooltip(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <>
      <div
        ref={containerRef}
        className={`markdown-content text-base leading-relaxed text-gray-900 dark:text-gray-100 ${className}`}
        dangerouslySetInnerHTML={{ __html: processedContent }}
      />
      
      {tooltip && (
        <WikiLinkTooltip
          target={tooltip.target}
          resolution={tooltip.resolution}
          x={tooltip.x}
          y={tooltip.y}
          onNavigate={(id) => {
            setTooltip(null)
            navigate(`/library/${id}`)
          }}
        />
      )}
    </>
  )
}

interface WikiLinkTooltipProps {
  target: string
  resolution: WikiLinkResolution
  x: number
  y: number
  onNavigate: (id: string) => void
}

function WikiLinkTooltip({ target, resolution, x, y, onNavigate }: WikiLinkTooltipProps) {
  return (
    <div
      role="tooltip"
      className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-3 max-w-xs"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: 'translateX(-50%)'
      }}
    >
      {resolution.found ? (
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {resolution.question}
          </div>
          {resolution.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {resolution.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-block px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-xs rounded"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
          <button
            onClick={() => onNavigate(resolution.id)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            Open →
          </button>
        </div>
      ) : (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Linked note not in library: <span className="font-medium">{target}</span>
        </div>
      )}
    </div>
  )
}

export default Markdown
