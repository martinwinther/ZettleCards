import type { Card } from './types'

export interface WikiLinkMatch {
  found: true
  id: string
  question: string
  tags: string[]
}

export interface WikiLinkNoMatch {
  found: false
}

export type WikiLinkResolution = WikiLinkMatch | WikiLinkNoMatch

/**
 * Normalize text for wiki-link matching: lowercase, strip special chars, collapse whitespace
 */
function normalizeForMatching(text: string): string {
  return text
    .toLowerCase()
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Resolve a wiki-link target to an existing card
 * Matching strategy:
 * 1. Exact match on question (case-insensitive)
 * 2. Exact match on normalized question
 * 3. Fuzzy match using includes (normalized)
 * Returns the best match or not found
 */
export function resolveWikiLink(target: string, cards: Card[]): WikiLinkResolution {
  const normalizedTarget = normalizeForMatching(target)
  
  // Try exact match first (case-insensitive)
  const exactMatch = cards.find(c => 
    c.question.toLowerCase() === target.toLowerCase()
  )
  if (exactMatch) {
    return {
      found: true,
      id: exactMatch.id,
      question: exactMatch.question,
      tags: exactMatch.tags
    }
  }
  
  // Try normalized exact match
  const normalizedMatch = cards.find(c => 
    normalizeForMatching(c.question) === normalizedTarget
  )
  if (normalizedMatch) {
    return {
      found: true,
      id: normalizedMatch.id,
      question: normalizedMatch.question,
      tags: normalizedMatch.tags
    }
  }
  
  // Try fuzzy match (includes)
  const fuzzyMatch = cards.find(c => 
    normalizeForMatching(c.question).includes(normalizedTarget) ||
    normalizedTarget.includes(normalizeForMatching(c.question))
  )
  if (fuzzyMatch) {
    return {
      found: true,
      id: fuzzyMatch.id,
      question: fuzzyMatch.question,
      tags: fuzzyMatch.tags
    }
  }
  
  return { found: false }
}

/**
 * Extract wiki-link data from markdown text
 * Supports [[Target]] and [[Target|Alias]] formats
 */
export function extractWikiLinks(markdown: string): Array<{
  match: string
  target: string
  alias: string | null
}> {
  const wikiLinkRegex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g
  const links: Array<{ match: string; target: string; alias: string | null }> = []
  
  let match: RegExpExecArray | null
  while ((match = wikiLinkRegex.exec(markdown))) {
    links.push({
      match: match[0],
      target: match[1].trim(),
      alias: match[2]?.trim() || null
    })
  }
  
  return links
}

