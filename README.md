# Flash Files (Obsidian) — User Guide

Flash Files turns your Obsidian/Zettelkasten Markdown notes into simple, private flashcards you can review in your browser—no account, no cloud.

## What it does

- **One note → one card**
- **Question** = the note's title
- **Answer** = the rest of the note
- **Tags** = categories for browsing and study (from frontmatter and inline `#tags`)
- **Review mode** with a lightweight Leitner system (Again / Good / Easy)
- **Works offline** after first visit; your data is stored locally in your browser
- **PWA installable** - install on your device for quick access and offline use

## How to use it

1. Go to **Import** and drag in your `.md` files (Obsidian notes only).
2. Check the preview: title → question, answer snippet, and detected tags.
   - You can add/remove tags per note before importing.
3. Click **Import**. Your cards appear in **Library**.
4. Filter by tags and search to find specific cards.
5. Open **Review** to study. Use:
   - `Space` to flip
   - `1` = Again, `2` = Good, `3` = Easy
6. Optional backups in **Settings** (export/import JSON or CSV for Anki).

## How titles & tags are detected

### Title priority (Question side)

1. **Frontmatter title**: `title: "My Question"`
2. **First Markdown H1**: `# My Question`
3. **First non-empty line**
4. **Filename** (extension removed), stripping ZK IDs like `202509280915 Title.md`

### Tags (Categories)

- **Frontmatter tags**: `tags: ["math", "physics"]` (string or array)
- **Inline #tags** found in the text (skipping code fences)
- **Normalized** to lowercase; leading `#` removed; hierarchies kept (e.g., `math/linear-algebra`)

### Answer side

Everything after the title/frontmatter. If empty → `_(No content)_`.

## Review system (simple Leitner)

- Each card lives in a **"box"** (1–5)
- **Again** → Box 1, due now
- **Good/Easy** advance the box with typical gaps:
  - **Box 1**: daily
  - **Box 2**: +1 day
  - **Box 3**: +3 days
  - **Box 4**: +7 days
  - **Box 5**: +21 days
- You can **filter review sessions by tags**

## Privacy & offline

- Your notes **never leave your device**. Data is stored in IndexedDB.
- The app can be **installed as a PWA** and used offline after the first load.
- Rendered Markdown is **sanitized** to prevent scripts from running.
- **PWA features**: Install prompt, update notifications, offline fallback

## PWA Installation & Offline Use

- **Install**: Click "Install app" button in the header or use browser's install option
- **Offline**: After first load, works completely offline - review cards, import files, manage library
- **Updates**: Automatic update notifications when new versions are available
- **Standalone**: Runs like a native app when installed

## Obsidian-Friendly Features

- **Wiki-link rendering**: `[[Link]]` and `[[Target|Alias]]` syntax is supported
  - Hover over wiki-links to see tooltip with linked card info
  - Click to navigate to linked cards within your library
  - Keyboard accessible (Tab + Enter)
- **Bulk tag editing**: Select multiple cards in Library for batch operations
  - Add/remove tags across multiple cards at once
  - Export selected cards as JSON
  - Undo support for bulk operations
- **Smart import deduplication**: Content-based duplicate detection
  - Skip, overwrite, or create new cards for duplicates
  - Based on SHA-256 hash of question + answer content

## Known limitations

- **Markdown only** (`.md`). No PDFs, images, or other formats.
- Wiki-links resolve to cards in your library; external notes aren't imported automatically.
- Large files import, but extremely big notes may feel slow in preview.

## Keyboard shortcuts

- **Review**: `Space` (flip), `1`/`2`/`3` (Again/Good/Easy)
- **Library & forms**: standard browser shortcuts (`Tab`/`Shift+Tab`, `Enter`, `Esc`)

## Production Deployment

### Quick Deploy to Vercel (Recommended)

1. Push this repo to GitHub/GitLab/Bitbucket
2. Visit [vercel.com](https://vercel.com) and import your repo
3. Vercel auto-detects settings from `vercel.json`
4. Click "Deploy" - your app will be live in ~1 minute with HTTPS

**Why Vercel?** HTTPS is required for PWA installation. Vercel provides it automatically.

See [DEPLOY_CHECKLIST.md](DEPLOY_CHECKLIST.md) for detailed deployment instructions and other hosting options.

### Local Production Build

```bash
npm run build      # Creates optimized build in dist/
npm run preview    # Preview at http://localhost:4173
```

**Note**: Local preview uses HTTP. For true PWA testing (installation, offline), deploy to a host with HTTPS.

### Production Checklist

Before deploying:

- ✅ Tailwind CSS v4 configured for production (unused styles purged)
- ✅ PWA manifest with 192/512/maskable icons
- ✅ Service Worker with `autoUpdate` registration
- ✅ Code-split bundles (React, DB, Markdown vendors separated)
- ✅ IndexedDB (Dexie) persists under production origin
- ✅ All tests passing: `npm run test:e2e`

Build output includes:
- `dist/index.html` - App entry point
- `dist/assets/` - Optimized JS/CSS bundles
- `dist/manifest.webmanifest` - PWA manifest
- `dist/sw.js` - Service Worker
- `dist/*.png` - PWA icons

## Technical Notes

- **Development**: Runs on `http://localhost` - PWA features require HTTPS in production
- **Data export**: Regular JSON backups recommended; CSV format compatible with Anki
- **Browser support**: Modern browsers with IndexedDB and Service Worker support
- **Bundle sizes**: ~1.5MB total (gzipped ~450KB), split into vendor chunks for optimal caching

## Polish & Testing

### Error Handling

The app includes comprehensive error boundaries:
- **Error boundary**: Catches React errors and provides reload/report options
- **Toast notifications**: Success/error feedback for imports, exports, and bulk operations
- **Dev mode**: Shows detailed error stack traces in development

To trigger error boundary (dev testing):
```javascript
// In browser console
throw new Error('Test error boundary')
```

### Running Tests

**Prerequisites**: Node.js 20+ and npm

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# E2E tests (Playwright)
npm run test:e2e           # Headless mode
npm run test:e2e:headed    # With browser UI
npm run test:e2e:ui        # Interactive UI mode

# Accessibility smoke tests
npm run a11y-check

# Lint code
npm run lint

# Build for production
npm run build
```

### Test Coverage

- **E2E tests**: Import flow, review sessions, keyboard navigation
- **A11y tests**: WCAG compliance, focus management, ARIA attributes
- **Smoke tests**: Page loads, heading structure, interactive elements

### CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`):
- Runs on push to `main`/`master` and pull requests
- Executes linting, build, e2e tests, and a11y checks
- Uploads Playwright test reports as artifacts

### Accessibility Features

- **Keyboard navigation**: Full keyboard support throughout the app
- **Skip link**: Jump to main content (Tab from page load)
- **Focus indicators**: Visible focus rings on all interactive elements
- **ARIA labels**: Screen reader friendly labels and roles
- **Dark mode**: System preference detection with manual toggle
- **Contrast**: WCAG AA compliant color contrasts

### Toast System

Lightweight, no-dependency toast notifications:
```typescript
import { useToast } from './components/Toaster'

const { toast } = useToast()

toast({
  type: 'success',  // 'success' | 'error' | 'info'
  title: 'Operation complete',
  message: 'Optional details here',
  duration: 5000  // auto-dismiss ms (default: 5000)
})
```

Toasts stack up to 4, auto-dismiss after 5 seconds, and support manual dismissal.

---

> **Note**: If something looks off (e.g., a title wasn't detected), you can edit tags and card titles in the Library after import. Use bulk operations to efficiently manage large sets of cards.