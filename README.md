# Design QA

A drop-in design QA annotation tool for React frontends. Click or drag to annotate elements, capture screenshots, write feedback, and export a structured Markdown doc.

**Dev-only. No backend. No accounts. Zero production impact.**

---

## Setup (for your dev)

Copy `src/DesignQA.tsx` and the `src/utils/` folder into your project, then:

```tsx
import { DesignQA } from './DesignQA'

function App() {
  return (
    <>
      <YourApp />
      {process.env.NODE_ENV === 'development' && <DesignQA />}
    </>
  )
}
```

Install the one dependency:

```bash
npm install html2canvas -D
```

That's it.

---

## Usage

- **`Cmd+Shift+A`** — toggle QA overlay on/off
- **Click** an element → annotate it (snaps to element bounds)
- **Drag** any region → annotate that area
- Fill in comment, category, priority → **Add**
- **Copy Markdown** → paste into Notion, Slack, or Jira description

---

## Development (this repo)

```bash
# Clone agentation as reference (gitignored, not committed)
mkdir reference && cd reference
git clone https://github.com/benjitaylor/agentation.git
cd ..

# Install deps
npm install

# Run the test app
npm run dev
```

Claude Code uses `CLAUDE.md` for full context on what to build and what to reference from Agentation.

---

## Requirements

- React 18+
- Chrome (desktop)
- Dev mode only
