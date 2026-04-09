import html2canvas from 'html2canvas-pro'
import type { BoundingBox } from '../../types'

// Pixels of surrounding context to include around the selected region
const CONTEXT_PADDING = 80

export async function captureRegion(box: BoundingBox): Promise<string> {
  // Expand capture area to include surrounding context, clamped to document bounds
  const docWidth = document.documentElement.scrollWidth
  const docHeight = document.documentElement.scrollHeight
  const x = Math.max(0, box.x - CONTEXT_PADDING)
  const y = Math.max(0, box.y - CONTEXT_PADDING)
  const width = Math.min(docWidth - x, box.width + CONTEXT_PADDING * 2)
  const height = Math.min(docHeight - y, box.height + CONTEXT_PADDING * 2)

  // Hide all DesignQA overlay elements before capture
  const ignoreEls = document.querySelectorAll<HTMLElement>('[data-snapmark-ignore]')
  const prevVisibility: string[] = []
  ignoreEls.forEach((el, i) => {
    prevVisibility[i] = el.style.visibility
    el.style.visibility = 'hidden'
  })

  // Two rAF frames to ensure the real page is in a stable visual state before cloning
  await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))

  try {
    const canvas = await html2canvas(document.body, {
      // box coords are already document-relative (include scroll), do NOT add scrollX/Y again
      x,
      y,
      width,
      height,
      windowWidth: document.documentElement.scrollWidth,
      windowHeight: document.documentElement.scrollHeight,
      scale: window.devicePixelRatio || 1,
      useCORS: true,
      allowTaint: true,
      logging: false,
      ignoreElements: (el: Element) => el.hasAttribute('data-snapmark-ignore'),
      onclone: (_clonedDoc: Document) => {
        const s = _clonedDoc.createElement('style')
        s.textContent = `
          *, *::before, *::after {
            animation-duration:        0.01ms !important;
            animation-delay:           0ms    !important;
            animation-iteration-count: 1      !important;
            transition-duration:       0ms    !important;
            transition-delay:          0ms    !important;
          }
        `
        _clonedDoc.head.appendChild(s)
      },
    })
    return canvas.toDataURL('image/png')
  } finally {
    ignoreEls.forEach((el, i) => {
      el.style.visibility = prevVisibility[i]
    })
  }
}
