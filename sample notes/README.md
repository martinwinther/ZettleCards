# Sample Notes - Format Examples

All notes are based on the Bhagavad Gita. Each demonstrates a different format supported by Flash Files.

## Files & Formats

1. **duty-and-detachment.md** - Format 1
   - Frontmatter with `title` and `tags` array
   - Most explicit format

2. **02-three-gunas.md** - Format 2
   - Frontmatter `tags` + H1 heading
   - Common Obsidian pattern

3. **03-arjunas-dilemma.md** - Format 3
   - H1 heading + inline `#tags` at end
   - Good for quick notes

4. **04-eternal-soul.md** - Format 4
   - Simple H1 heading only
   - No tags, clean and minimal

5. **05-what-is-bhakti.md** - Format 5
   - First line becomes question (no H1)
   - Inline tags in content

6. **06-field-and-knower.md** - Format 6
   - Frontmatter with single string tag (not array)
   - Shows `tags: tagname` format

7. **07-renunciation-vs-action.md** - Format 7
   - Multi-line YAML array tags
   - Shows list format with dashes

8. **202509301145 Supreme Person.md** - Format 8
   - Zettelkasten-style filename with timestamp prefix
   - Demonstrates filename fallback (timestamp stripped from question)
   - Inline tags in content

## Test Instructions

Import all files at once to see how each format is parsed:
- Check that questions are extracted correctly
- Verify tags are detected from both frontmatter and inline
- Note that the H1 is removed from answers when used as the question
- ZK timestamp should be stripped from the filename-based question

All formats should work seamlessly! 🎯




