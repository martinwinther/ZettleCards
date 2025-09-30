import { useMemo } from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import hljs from 'highlight.js'

// Import a clean, readable highlight.js theme and markdown styles
import 'highlight.js/styles/github.css'
import './markdown.css'

interface MarkdownProps {
  markdown: string
  className?: string
}

function Markdown({ markdown, className = '' }: MarkdownProps) {
  const htmlContent = useMemo(() => {
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
    const dirty = marked.parse(markdown) as string
    
    // Sanitize HTML to prevent XSS
    const clean = DOMPurify.sanitize(dirty, {
      USE_PROFILES: { html: true },
      ADD_ATTR: ['target', 'rel'],
      ALLOW_UNKNOWN_PROTOCOLS: false
    })
    
    return clean
  }, [markdown])

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

  return (
    <div
      className={`markdown-content text-base leading-relaxed text-gray-900 dark:text-gray-100 ${className}`}
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  )
}

export default Markdown
