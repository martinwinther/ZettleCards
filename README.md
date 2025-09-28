# Flash Files (Obsidian) — User Guide

Flash Files turns your Obsidian/Zettelkasten Markdown notes into simple, private flashcards you can review in your browser—no account, no cloud.

## What it does

- **One note → one card**
- **Question** = the note's title
- **Answer** = the rest of the note
- **Tags** = categories for browsing and study (from frontmatter and inline `#tags`)
- **Review mode** with a lightweight Leitner system (Again / Good / Easy)
- **Works offline** after first visit; your data is stored locally in your browser

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

## Known limitations

- **Markdown only** (`.md`). No PDFs, images, or other formats.
- Obsidian `[[wiki links]]` show as inert links (not resolved to other notes).
- Large files import, but extremely big notes may feel slow in preview.

## Keyboard shortcuts

- **Review**: `Space` (flip), `1`/`2`/`3` (Again/Good/Easy)
- **Library & forms**: standard browser shortcuts (`Tab`/`Shift+Tab`, `Enter`, `Esc`)

---

> **Note**: If something looks off (e.g., a title wasn't detected), you can edit tags and card titles in the Library after import.

