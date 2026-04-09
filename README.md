# Snapmark

A drop-in design QA annotation tool for React frontends. Activate an overlay, click or drag to select any element or region, write feedback, and export everything as a structured Markdown document with inline screenshots.

**No backend. No accounts. No production impact — dev only.**

---

## Install

```bash
npm install snapmark
```

---

## Quick start

### Vite / CRA

```tsx
import { DesignQA } from 'snapmark'
import 'snapmark/style.css'

function App() {
  return (
    <>
      <YourApp />
      {import.meta.env.DEV && <DesignQA />}
    </>
  )
}
```

### Next.js App Router

Add to your root `app/layout.tsx`, inside `<body>`:

```tsx
import { DesignQA } from 'snapmark'
import 'snapmark/style.css'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        {process.env.NODE_ENV === 'development' && (
          <DesignQA imgbbApiKey={process.env.NEXT_PUBLIC_SNAPMARK_IMGBB_KEY} />
        )}
      </body>
    </html>
  )
}
```

Or use the CLI to set it up automatically:

```bash
cd your-project
npx snapmark
```

The CLI detects your framework, prompts for an imgBB key, writes it to `.env.local`, and shows you the exact snippet to paste.

---

## Keeping it out of production

Snapmark must never render in production. Use an env variable to gate it.

**Vite** — `import.meta.env.DEV` is `true` only during `vite dev`, `false` in `vite build`:

```tsx
{import.meta.env.DEV && <DesignQA />}
```

**Next.js** — `NODE_ENV` is set to `'production'` automatically on `next build`:

```tsx
{process.env.NODE_ENV === 'development' && <DesignQA />}
```

**Custom env variable** — if you want explicit control (e.g. enable in staging):

```tsx
{process.env.NEXT_PUBLIC_ENABLE_DESIGN_QA === 'true' && <DesignQA />}
```

```bash
# .env.development (committed — no secrets)
NEXT_PUBLIC_ENABLE_DESIGN_QA=true

# .env.production (or simply omit it — defaults to falsy)
NEXT_PUBLIC_ENABLE_DESIGN_QA=false
```

When the condition is false, React renders nothing and the component's event listeners, DOM nodes, and keyboard shortcuts are never registered.

---

## Usage

| Action | Result |
|---|---|
| `Cmd+Shift+A` / `Ctrl+Shift+A` | Toggle QA overlay on / off |
| **Hover** an element | Blue highlight shows the target bounds |
| **Click** an element | Capture it (inspect mode) |
| **Hold Shift + drag** | Draw a freehand region (area mode) |
| Fill in comment, category, priority → **Add** | Pin placed on page, annotation added to sidebar |
| **Copy Markdown** | Copies full report to clipboard |

---

## Props

| Prop | Type | Description |
|---|---|---|
| `imgbbApiKey` | `string` | Optional. imgBB API key for hosted image URLs in the Markdown export. Get one free at [imgbb.com](https://imgbb.com). Without it, screenshots are embedded as base64. |

---

## Markdown export

Clicking **Copy Markdown** produces a document like this:

```markdown
# Design QA — https://localhost:3000/
April 9, 2026 · 3 annotations · 1 blocking · 1 important · 1 suggestion

---

## #1 · 🔴 P1 · Spacing

![Annotation 1](https://i.ibb.co/...)

**Issue:** Button padding is inconsistent with the design spec — should be 12px vertical.

**Element:** `main > section > button.btn-primary`

---
```

Each annotation includes a cropped screenshot of the selected region, the comment, and the CSS selector path (inspect mode only).

---

## How it works

- **Inspect mode** — hover highlights DOM elements with a blue outline (like browser devtools). Click to snap to the element's bounding box.
- **Area mode** — drag a freehand rectangle over any part of the page.
- Screenshots are captured with [html2canvas-pro](https://github.com/niklasvh/html2canvas). The overlay UI is excluded from captures. All CSS animations are collapsed to their final state before capture so you always get a clean, fully-rendered frame.
- Pins (numbered circles) are placed on the page at each annotation's location. They persist while the overlay is active.
- All state is in memory. Nothing is written to disk or sent anywhere except optional imgBB uploads.

---

## Requirements

- React 18+
- Modern Chromium browser
- Dev environment only

---

## Development

```bash
git clone https://github.com/vshwjet/snapmark.git
cd snapmark
npm install

# Build the library
npm run build

# Run the Vite test app
npm run test-app:dev

# Run the Next.js test app
npm run test-app-next:dev
```
