interface ParsedMatter {
  data: Record<string, unknown>
  content: string
}

/**
 * Simple browser-compatible front matter parser
 * Handles basic YAML front matter extraction
 */
export function parseFrontMatter(raw: string): ParsedMatter {
  const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/
  const match = raw.match(frontMatterRegex)
  
  if (!match) {
    return {
      data: {},
      content: raw
    }
  }
  
  const [, frontMatterStr, content] = match
  const data = parseFrontMatterData(frontMatterStr)
  
  return { data, content }
}

function parseFrontMatterData(yamlStr: string): Record<string, unknown> {
  const data: Record<string, unknown> = {}
  const lines = yamlStr.split('\n')
  
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    
    // Handle simple key: value pairs
    const colonIndex = trimmed.indexOf(':')
    if (colonIndex === -1) continue
    
    const key = trimmed.slice(0, colonIndex).trim()
    let value = trimmed.slice(colonIndex + 1).trim()
    
    // Remove quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    
    // Handle arrays (simple format: [item1, item2] or on separate lines)
    if (value.startsWith('[') && value.endsWith(']')) {
      const arrayContent = value.slice(1, -1)
      data[key] = arrayContent
        .split(',')
        .map(item => item.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean)
    } else if (value === '' || value === '[]') {
      // Check if next lines are array items (starting with -)
      const arrayItems: string[] = []
      let currentLineIndex = lines.indexOf(line) + 1
      
      while (currentLineIndex < lines.length) {
        const nextLine = lines[currentLineIndex].trim()
        if (nextLine.startsWith('-')) {
          let item = nextLine.slice(1).trim()
          // Remove quotes if present
          if ((item.startsWith('"') && item.endsWith('"')) || 
              (item.startsWith("'") && item.endsWith("'"))) {
            item = item.slice(1, -1)
          }
          arrayItems.push(item)
          currentLineIndex++
        } else if (nextLine === '') {
          currentLineIndex++
        } else {
          break
        }
      }
      
      if (arrayItems.length > 0) {
        data[key] = arrayItems
      } else {
        data[key] = value
      }
    } else {
      data[key] = value
    }
  }
  
  return data
}

