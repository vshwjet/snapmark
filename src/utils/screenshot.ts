import html2canvas from 'html2canvas'
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
  const ignoreEls = document.querySelectorAll<HTMLElement>('[data-design-qa-ignore]')
  const prevVisibility: string[] = []
  ignoreEls.forEach((el, i) => {
    prevVisibility[i] = el.style.visibility
    el.style.visibility = 'hidden'
  })

  try {
    const canvas = await html2canvas(document.body, {
      x: x + window.scrollX,
      y: y + window.scrollY,
      width,
      height,
      windowWidth: document.documentElement.scrollWidth,
      windowHeight: document.documentElement.scrollHeight,
      useCORS: true,
      logging: false,
      ignoreElements: (el) => el.hasAttribute('data-design-qa-ignore'),
    })
    return canvas.toDataURL('image/png')
  } finally {
    ignoreEls.forEach((el, i) => {
      el.style.visibility = prevVisibility[i]
    })
  }
}
