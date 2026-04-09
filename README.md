# Snapmark

A drop-in design QA annotation tool for React frontends. Activate an overlay, click or drag to select any element or region, write feedback, and export everything as a structured Markdown document with inline screenshots.

**No backend. No accounts. No production impact — dev only.**

---

## Setup

### Step 1 — Install

```bash
npm install snapmark
```

---

### Step 2 — CLI setup (optional)

The fastest way to finish setup. Run this inside your project:

```bash
npx snapmark
```

The CLI detects your framework (Vite, CRA, Next.js), prompts for an imgBB API key, writes it to `.env.local`, and outputs the exact snippet to paste into your app. If you use the CLI, you can skip steps 3–5.

---

### Step 3 — Get an imgBB API key

Snapmark uploads screenshots to [imgBB](https://api.imgbb.com/) so the exported Markdown contains real hosted image URLs instead of large base64 blobs. **imgBB is currently the only supported image host.**

1. Go to [https://api.imgbb.com/](https://api.imgbb.com/) and create a free account
2. Generate an API key from your dashboard
3. Keep it handy for the next step

> Without an API key, screenshots are embedded as base64 data URIs directly in the Markdown. This works but produces very large documents.

---

### Step 4 — Add the API key to your environment

Add the key to your local env file. **Do not commit this file.**

**Vite / CRA** — add to `.env.local`:

```bash
VITE_SNAPMARK_IMGBB_KEY=your_api_key_here
```

**Next.js** — add to `.env.local`:

```bash
NEXT_PUBLIC_SNAPMARK_IMGBB_KEY=your_api_key_here
```

Make sure `.env.local` is in your `.gitignore` (it is by default in Next.js and Vite projects).

---

### Step 5 — Add the imports

At the top of your root component file, add:

```tsx
import { DesignQA } from 'snapmark'
import 'snapmark/style.css'
```

---

### Step 6 — Add the component

Render `<DesignQA />` in dev only. Pass the API key as a prop.

**Vite / CRA** — in your root `App.tsx`:

```tsx
function App() {
  return (
    <>
      <YourApp />
      {import.meta.env.DEV && (
        <DesignQA imgbbApiKey={import.meta.env.VITE_SNAPMARK_IMGBB_KEY} />
      )}
    </>
  )
}
```

**Next.js App Router** — in your root `app/layout.tsx`, inside `<body>`:

```tsx
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

The `DEV` / `NODE_ENV` guard ensures the component — and all its event listeners and DOM nodes — is completely absent from production builds.

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
