interface ParsedMatter {
  data: Record<string, unknown>
  content: string
}

/**
 * Simple browser-compatible front matter parser
 * Note: This is a lightweight YAML parser for basic frontmatter only.
 * It does not support the full YAML spec (no nested objects, no multiline values, etc.)
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
  const data = parseSimpleYamlToObject(frontMatterStr)
  
  return { data, content }
}

function removeQuotesIfPresent(value: string): string {
  if ((value.startsWith('"') && value.endsWith('"')) || 
      (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1)
  }
  return value
}

function parseYamlArrayValue(value: string, lines: string[], currentLine: string): string[] | null {
  // Handle inline array format: [item1, item2]
  if (value.startsWith('[') && value.endsWith(']')) {
    const arrayContent = value.slice(1, -1)
    return arrayContent
      .split(',')
      .map(item => removeQuotesIfPresent(item.trim()))
      .filter(Boolean)
  }
  
  // Handle multiline array format (items starting with -)
  if (value === '' || value === '[]') {
    const arrayItems: string[] = []
    let currentLineIndex = lines.indexOf(currentLine) + 1
    
    while (currentLineIndex < lines.length) {
      const nextLine = lines[currentLineIndex].trim()
      if (nextLine.startsWith('-')) {
        const item = nextLine.slice(1).trim()
        arrayItems.push(removeQuotesIfPresent(item))
        currentLineIndex++
      } else if (nextLine === '') {
        currentLineIndex++
      } else {
        break
      }
    }
    
    if (arrayItems.length > 0) {
      return arrayItems
    }
  }
  
  return null
}

function parseSimpleYamlToObject(yamlStr: string): Record<string, unknown> {
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
    
    value = removeQuotesIfPresent(value)
    
    const arrayValue = parseYamlArrayValue(value, lines, line)
    if (arrayValue !== null) {
      data[key] = arrayValue
    } else {
      data[key] = value
    }
  }
  
  return data
}

