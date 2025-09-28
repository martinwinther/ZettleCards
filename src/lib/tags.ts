/**
 * Normalize tags to lowercase and remove duplicates
 */
export function normalizeTags(tags: string[]): string[] {
  return [...new Set(tags.map(tag => tag.toLowerCase().trim()).filter(Boolean))]
}

/**
 * Extract inline hashtags from markdown content
 * Excludes tags within code fences
 */
export function extractInlineTags(markdown: string): string[] {
  // Remove fenced code blocks (``` or ~~~) before scanning for hashtags
  const withoutFences = markdown
    .replace(/```[\s\S]*?```/g, "")
    .replace(/~~~[\s\S]*?~~~/g, "");
  
  // Find #tags, allowing hierarchies like foo/bar-baz and underscores
  const found = new Set<string>();
  const re = /(^|[^A-Za-z0-9/_-])#([A-Za-z0-9/_-]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(withoutFences))) {
    found.add(m[2]);
  }
  return normalizeTags([...found]);
}

/**
 * Merge frontmatter tags with inline tags and normalize
 */
export function mergeAndNormalizeTags(frontmatter: unknown, inline: string[]): string[] {
  const fmArray = Array.isArray(frontmatter)
    ? (frontmatter as unknown[]).map(String)
    : frontmatter ? [String(frontmatter)] : [];
  return normalizeTags([...(fmArray as string[]), ...inline]);
}
