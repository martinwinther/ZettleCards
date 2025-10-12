import { parseFrontMatter } from './parseFrontMatter'

/**
 * Remove Zettelkasten timestamp prefix from filename
 * Patterns like: 202301010000, 20230101000000, followed by optional separator
 */
export function removeZettelkastenTimestampFromFilename(name: string): string {
  return name.replace(/^\d{8,14}([-_ ]+)?/, '').trim()
}

function tryExtractQuestionFromFrontmatter(frontmatterData: Record<string, unknown>): string | null {
  if (frontmatterData.title && typeof frontmatterData.title === 'string') {
    return frontmatterData.title.trim()
  }
  return null
}

function tryExtractQuestionFromFirstHeading(content: string): { question: string; remainingContent: string } | null {
  const h1Match = content.match(/^\s*#\s+(.+?)\s*$/m)
  if (h1Match) {
    const question = h1Match[1].trim()
    const remainingContent = content.replace(/^\s*#\s+.+?\s*$/m, '').trim()
    return { question, remainingContent }
  }
  return null
}

function tryExtractQuestionFromFirstLine(content: string): { question: string; remainingContent: string } | null {
  const lines = content.split('\n')
  const firstNonEmptyLine = lines.find(line => line.trim() !== '')
  
  if (firstNonEmptyLine) {
    const question = firstNonEmptyLine.trim()
    const firstLineIndex = lines.findIndex(line => line.trim() !== '')
    if (firstLineIndex !== -1) {
      lines.splice(firstLineIndex, 1)
      const remainingContent = lines.join('\n').trim()
      return { question, remainingContent }
    }
  }
  return null
}

function fallbackToFilename(filename: string): string {
  const nameWithoutExtension = filename.replace(/\.[^/.]+$/, '')
  return removeZettelkastenTimestampFromFilename(nameWithoutExtension)
}

/**
 * Extract question and answer from markdown content
 * Uses a 4-step fallback strategy:
 * 1. Frontmatter 'title' field
 * 2. First H1 heading (# heading)
 * 3. First non-empty line
 * 4. Filename (with Zettelkasten timestamp removed)
 */
export function extractQA(raw: string, filename: string): { question: string; answerMD: string } {
  const parsed = parseFrontMatter(raw)
  const { data, content } = parsed
  
  let question = ''
  let answerMD = content
  
  const frontmatterQuestion = tryExtractQuestionFromFrontmatter(data)
  if (frontmatterQuestion) {
    question = frontmatterQuestion
  } else {
    const headingResult = tryExtractQuestionFromFirstHeading(content)
    if (headingResult) {
      question = headingResult.question
      answerMD = headingResult.remainingContent
    } else {
      const firstLineResult = tryExtractQuestionFromFirstLine(content)
      if (firstLineResult) {
        question = firstLineResult.question
        answerMD = firstLineResult.remainingContent
      } else {
        question = fallbackToFilename(filename)
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
