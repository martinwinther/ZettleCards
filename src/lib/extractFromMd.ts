import matter from 'gray-matter'
import { extractQA } from './extractQA'
import { extractInlineTags, mergeAndNormalizeTags } from './tags'

export interface ParsedMdFile {
  question: string
  answerMD: string
  tags: string[]
}

/**
 * Parse a markdown file and extract question, answer, and tags
 */
export function parseMdFile(raw: string, filename: string): ParsedMdFile {
  const parsed = matter(raw)
  const { data } = parsed
  
  // Extract question and answer
  const { question, answerMD } = extractQA(raw, filename)
  
  // Extract tags from frontmatter
  const frontmatterTags = data.tags
  
  // Extract inline tags from the answer content
  const inlineTags = extractInlineTags(answerMD)
  
  // Merge and normalize all tags
  const tags = mergeAndNormalizeTags(frontmatterTags, inlineTags)
  
  return {
    question,
    answerMD,
    tags
  }
}
