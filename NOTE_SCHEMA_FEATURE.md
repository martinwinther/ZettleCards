# Note Schema Documentation Feature

## Overview
Added an in-app documentation page at `/help/schema` that teaches users how to format their Obsidian/Zettelkasten Markdown notes for optimal Flash Files import.

## Implementation Summary

### Files Created
- `src/pages/NoteSchemaPage.tsx` - Comprehensive documentation page with interactive parser

### Files Modified
- `src/routes.tsx` - Added `/help/schema` route
- `src/pages/SettingsPage.tsx` - Added "Help & Documentation" section with link
- `src/layouts/AppLayout.tsx` - Added help link to footer

## Features Implemented

### 1. Documentation Sections
- **Overview** - High-level explanation of how parsing works
- **Title Extraction Rules** - Priority order with examples (frontmatter → H1 → first line → filename)
- **Tags (Categories)** - Frontmatter and inline tags with normalization rules
- **Zettelkasten UID Rules** - Automatic stripping of timestamp IDs from filenames
- **Code Blocks & Inline Tags** - Explains that tags in code blocks are ignored
- **Length & Splitting** - Best practices for note granularity
- **Sample Notes** - 4 ready-to-import examples demonstrating different formats
- **Best Practices** - Quick tips for effective note formatting
- **Troubleshooting** - Common issues and solutions
- **Feedback** - mailto link for user feedback

### 2. Interactive Features

#### Live Note Parser
- Large textarea for pasting note content
- Filename input field (for testing filename-based extraction)
- File upload support (.md files)
- "Parse Preview" button that shows:
  - Extracted question
  - Answer snippet (first 150 chars)
  - Tag chips with count
- Uses the same `parseMdFile` utility as Import page (no duplicate logic)

#### Import Sample
- "Import This Note to Library" button
- Adds parsed note directly to the app
- Includes duplicate detection via content hash
- Shows success/error toasts

#### Copy & Download Functionality
- Copy-to-clipboard buttons for each code example
- Copy individual sample notes
- "Download All Samples" - downloads all 4 sample .md files
- "Copy All to Clipboard" - concatenated samples for easy pasting

### 3. Navigation
- Link from Settings page (in "Help & Documentation" section)
- Link in footer (accessible from any page)
- Back link to Settings from help page

### 4. Accessibility & UX
- All buttons are keyboard operable
- Focus states with ring indicators
- aria-live region for parse results
- aria-labels on all interactive elements
- Proper heading hierarchy
- Dark mode fully supported
- Responsive layout (mobile-friendly)

### 5. Styling
- Consistent with app's minimalist design
- Tailwind v4 utilities only (no new dependencies)
- Color-coded sections:
  - Blue: informational
  - Green: best practices
  - Amber: warnings/guidelines
  - White/Gray: standard sections
- Code blocks with syntax highlighting
- Monospace font for code

## Sample Notes Included
1. `what-is-bhakti.md` - Simple note with inline tags
2. `202509301145 Supreme Person.md` - Zettelkasten UID example
3. `duty-and-detachment.md` - Frontmatter with title and tags array
4. `20250101_1430-three-modes.md` - H1 heading with hierarchical tags

## Technical Details

### Parser Integration
- Imports `parseMdFile` from `src/lib/extractFromMd.ts`
- Imports `useCardsContext` for adding cards
- Imports `useToast` for notifications
- Uses `sha256` for content hashing (duplicate detection)
- Accesses `db.imports` table for duplicate tracking

### Database Integration
- Uses existing `imports` table with schema:
  ```typescript
  {
    id: string
    fileName: string
    contentHash: string
    cardId: string
    createdAt: number
  }
  ```

### No New Dependencies
- All functionality uses existing utilities
- No npm packages added
- Pure Tailwind v4 for styling

## Testing
- No linting errors
- Uses same parsing logic as ImportPage (already tested)
- Parser correctly handles:
  - Frontmatter title extraction
  - H1 heading extraction
  - Filename fallback with ZK UID stripping
  - Tag normalization and deduplication
  - Code block tag exclusion

## User Flow
1. User visits Settings → sees "Help & Documentation" section
2. Clicks "Note Schema Guide" button
3. Reads documentation sections with examples
4. Copies sample note or pastes their own
5. Tests with live parser to see extracted Q/A and tags
6. Optionally imports test note to library
7. Downloads sample notes for reference
8. Returns to Import page to batch import their notes

## Next Steps (Optional Enhancements)
- Add more sample notes for different use cases
- Add video walkthrough or GIF demonstrations
- Add search/filter functionality for sections
- Add "Export Schema Cheatsheet" PDF
- Add inline validation/suggestions as user types
- Add support for testing multiple notes at once

## Maintenance Notes
- If parser logic changes in `extractFromMd.ts`, help page automatically reflects it
- Sample notes can be updated in the `sampleNotes` array
- Feedback email should be updated to actual support email
- Consider adding analytics to track which sections users visit most


