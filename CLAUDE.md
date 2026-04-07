# Design QA Tool — Claude Code Instructions

## What this is

A dev-only React component (`<DesignQA />`) that lets a product designer visually annotate
a running frontend, capture cropped screenshots of selected elements/regions, write feedback
comments, and export everything as a single structured Markdown document with inline screenshots.

It is a **single-file drop-in** — no backend, no server, no MCP, no accounts.
Everything lives in the browser. State is in memory (optionally persisted to localStorage).

---

## Reference codebase

`./reference/agentation/` contains the Agentation open source repo.
Use it as reference — **do not copy wholesale**. Specifically:

### Borrow from Agentation:
- `reference/agentation/` — element hover highlight logic (how they detect + outline hovered DOM nodes)
- `reference/agentation/` — bounding box capture (`getBoundingClientRect` usage)
- `reference/agentation/` — click handler that snaps to element bounds
- `reference/agentation/` — keyboard shortcut toggle pattern (how they activate/deactivate the overlay)

### Do NOT borrow from Agentation:
- Anything related to MCP, sessions, or server communication
- The AFS schema or annotation threading/status system
- React fiber traversal (we don't need component tree paths)
- CSS selector generation for agent grep purposes
- The SCSS build pipeline (use plain CSS modules or inline styles)
- The monorepo / pnpm workspace structure

---

## Core concept

Two annotation modes feed the same list:

1. **Inspect mode** — user clicks an element. Tool snaps to its bounding box.
2. **Area mode** — user drags a freehand rectangle over any region.

Both modes:
- Capture a cropped screenshot of the selected region using `html2canvas`
- Show a popover for the user to write a comment, pick a category and priority
- Add a numbered pin on the page at the annotation location
- Append to the annotation list in the sidebar

---

## Annotation data model

```ts
type Priority = 'p1' | 'p2' | 'p3'

type Category =
  | 'spacing'
  | 'typography'
  | 'color'
  | 'interaction'
  | 'copy'
  | 'missing'
  | 'other'

type BoundingBox = {
  x: number       // px from left of viewport
  y: number       // px from top of document (includes scroll)
  width: number
  height: number
}

type Annotation = {
  id: string               // nanoid or crypto.randomUUID()
  index: number            // 1, 2, 3... for display
  screenshot: string       // base64 PNG — cropped to boundingBox
  comment: string
  category: Category
  priority: Priority
  boundingBox: BoundingBox
  elementPath?: string     // CSS selector, only in inspect mode (nice to have)
  pageUrl: string
  timestamp: number
}
```

---

## UX behaviour

### Overlay activation
- Keyboard shortcut: `Cmd+Shift+A` (Mac) / `Ctrl+Shift+A` (Win) toggles the overlay
- When active: cursor changes to crosshair, a thin top bar indicates "QA Mode Active"
- When inactive: component is invisible, zero impact on the page

### Inspect mode (default when overlay active)
- Hovering an element shows a blue highlight border around it (like browser devtools)
- Clicking captures that element's bounding box
- Proceed to popover

### Area mode (hold Shift or toggle in toolbar)
- Cursor is crosshair
- Click and drag draws a selection rectangle
- On mouse up: capture region, proceed to popover

### Popover
- Appears near the selection (avoid going off-screen)
- Shows a small thumbnail preview of the captured screenshot
- Text area for comment (required)
- Category dropdown (default: 'spacing')
- Priority selector: P1 / P2 / P3 pill buttons (default: P2)
- Cancel + Add buttons
- Escape key = cancel

### Pins on page
- After adding, a numbered circle pin (e.g. `1`, `2`) is placed at the top-left of the bounding box
- Pins persist while overlay is active
- Hovering a pin highlights the corresponding annotation in the sidebar
- Clicking a pin opens the annotation detail

### Sidebar
- Fixed right panel, visible when overlay is active
- Shows all annotations as a vertical list
- Each item: index number, priority badge, category, comment preview, small screenshot thumbnail
- Hover shows delete button
- Bottom: "Copy Markdown" button + "Clear All" button

---

## Screenshot capture

Use `html2canvas`. Capture the full page, then crop to the annotation's bounding box.

```ts
import html2canvas from 'html2canvas'

async function captureRegion(box: BoundingBox): Promise<string> {
  const canvas = await html2canvas(document.body, {
    x: box.x + window.scrollX,
    y: box.y + window.scrollY,
    width: box.width,
    height: box.height,
    windowWidth: document.documentElement.scrollWidth,
    windowHeight: document.documentElement.scrollHeight,
    useCORS: true,
    logging: false,
  })
  return canvas.toDataURL('image/png')
}
```

Important: temporarily hide the DesignQA overlay UI before calling html2canvas, then restore it.
Use a `data-design-qa-ignore` attribute on all overlay elements and exclude via html2canvas `ignoreElements`.

---

## Markdown export format

When "Copy Markdown" is clicked, generate and copy this format:

```markdown
# Design QA — {pageUrl}
{date} · {count} annotations

---

## #{index} · {PRIORITY} · {Category} 

![Annotation {index}]({base64 screenshot data uri})

**Issue:** {comment}

**Element:** `{elementPath if available}`

---
```

Priority labels: P1 → `🔴 P1`, P2 → `🟡 P2`, P3 → `🟢 P3`
Category capitalised: `Spacing`, `Typography`, etc.
Date format: `March 26, 2026`
Include a summary line at top: `6 annotations · 2 blocking · 3 important · 1 suggestion`

---

## File structure to create

```
src/
  DesignQA.tsx          ← main component, entry point
  types.ts              ← all TypeScript types
  utils/
    screenshot.ts       ← html2canvas capture logic
    markdown.ts         ← markdown generation
    selector.ts         ← CSS selector generation (inspect mode)
  components/
    Overlay.tsx         ← the transparent full-page capture layer
    Popover.tsx         ← comment form that appears after selection
    Pin.tsx             ← numbered circle placed on page
    Sidebar.tsx         ← right panel with annotation list
    Toolbar.tsx         ← top bar showing mode + controls
  styles/
    design-qa.css       ← all styles, scoped with .dqa- prefix to avoid collisions
```

---

## Styling rules

- All CSS classes prefixed with `.dqa-` to avoid collision with host app styles
- Use CSS custom properties scoped under `.dqa-root` for theming
- Overlay and sidebar should use a dark theme (dark bg, white text) to contrast with any host app
- Sidebar width: 320px fixed right
- Fonts: system-ui — never inherit from host app (use explicit font-family)
- Z-index: start from 999000 to sit above any host app modals

---

## What NOT to build

- No backend, server, or API calls
- No user accounts or authentication
- No real-time sync or sessions
- No MCP integration
- No Jira integration (Phase 2)
- No mobile support
- No annotation threading or replies
- No agent-facing output (this is human → human)
- No npm publishing setup

---

## Dev environment

```bash
# Install deps
npm install

# The component is meant to be imported into a host React app
# For development/testing, create a simple test app in src/test-app/
# that renders <DesignQA /> alongside some dummy UI

npm run dev   # runs test app with vite
npm run build # bundles DesignQA as a single importable file
```

Dependencies to install:
- `html2canvas` — screenshot capture
- `nanoid` — unique IDs (or just use `crypto.randomUUID()` to avoid the dep)

Dev dependencies:
- `vite` + `@vitejs/plugin-react` — for the test app
- `typescript`

---

## Definition of done (MVP)

- [ ] Overlay activates/deactivates with keyboard shortcut
- [ ] Inspect mode: hover highlight + click to capture element bounds
- [ ] Area mode: drag to draw region
- [ ] html2canvas captures cropped screenshot of selected area
- [ ] Popover: comment field + category + priority + add/cancel
- [ ] Numbered pins appear on page after annotation added
- [ ] Sidebar shows all annotations with thumbnail, comment, category, priority
- [ ] Delete individual annotation
- [ ] Clear all annotations
- [ ] Copy Markdown copies formatted doc with inline base64 screenshots
- [ ] Overlay UI is excluded from screenshots
- [ ] Zero console errors in normal use
- [ ] Works in Chrome on localhost (that's all we need for now)
