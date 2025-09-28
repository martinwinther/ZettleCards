import matter from 'gray-matter'

/**
 * Remove Zettelkasten UID prefix from filename
 * Patterns like: 202301010000, 20230101000000, followed by optional separator
 */
export function stripZkUid(name: string): string {
  return name.replace(/^\d{8,14}([-_ ]+)?/, '').trim()
}

/**
 * Extract question and answer from markdown content
 */
export function extractQA(raw: string, filename: string): { question: string; answerMD: string } {
  const parsed = matter(raw)
  const { data, content } = parsed
  
  let question = ''
  let answerMD = content
  
  // 1. Try frontmatter title first
  if (data.title && typeof data.title === 'string') {
    question = data.title.trim()
  } else {
    // 2. Try to find first H1
    const h1Match = content.match(/^\s*#\s+(.+?)\s*$/m)
    if (h1Match) {
      question = h1Match[1].trim()
      // Remove the H1 line from the answer
      answerMD = content.replace(/^\s*#\s+.+?\s*$/m, '').trim()
    } else {
      // 3. Try first non-empty line
      const lines = content.split('\n')
      const firstNonEmptyLine = lines.find(line => line.trim() !== '')
      
      if (firstNonEmptyLine) {
        question = firstNonEmptyLine.trim()
        // Remove the first non-empty line from the answer
        const firstLineIndex = lines.findIndex(line => line.trim() !== '')
        if (firstLineIndex !== -1) {
          lines.splice(firstLineIndex, 1)
          answerMD = lines.join('\n').trim()
        }
      } else {
        // 4. Use filename without extension, stripped of ZK UID
        const nameWithoutExt = filename.replace(/\.[^/.]+$/, '')
        question = stripZkUid(nameWithoutExt)
      }
    }
  }
  
  // Collapse extra whitespace in question
  question = question.replace(/\s+/g, ' ').trim()
  
  // If answer is empty, provide default
  if (!answerMD || answerMD.trim() === '') {
    answerMD = '_(No content)_'
  }
  
  return { question, answerMD }
}
