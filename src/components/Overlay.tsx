import { useCallback, useEffect, useRef, useState } from 'react'
import type { AnnotationMode, BoundingBox, ElementInfo } from '../../types'
import { getElementInfo } from '../utils/selector'

interface HoverRect {
  top: number
  left: number
  width: number
  height: number
}

interface DragState {
  startX: number
  startY: number
  currentX: number
  currentY: number
  active: boolean
}

interface OverlayProps {
  mode: AnnotationMode
  onInspectCapture: (box: BoundingBox, elementInfo?: ElementInfo) => void
  onAreaCapture: (box: BoundingBox) => void
}

/** Drill through shadow DOM to find deepest element at coordinates */
function deepElementFromPoint(x: number, y: number): Element | null {
  let el: Element | null = document.elementFromPoint(x, y)
  while (el?.shadowRoot) {
    const deeper = el.shadowRoot.elementFromPoint(x, y)
    if (!deeper || deeper === el) break
    el = deeper
  }
  return el
}

/** Walk ancestors (crossing shadow roots) to find a matching selector */
function closestCrossingShadow(el: Element, selector: string): Element | null {
  let current: Element | null = el
  while (current) {
    if (current.matches?.(selector)) return current
    // Cross shadow root boundary
    const parent: Element | null =
      current.parentElement ?? ((current.getRootNode() as ShadowRoot)?.host as Element | undefined) ?? null
    current = parent
  }
  return null
}

export function Overlay({ mode, onInspectCapture, onAreaCapture }: OverlayProps) {
  const [hoverRect, setHoverRect] = useState<HoverRect | null>(null)
  const [drag, setDrag] = useState<DragState | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (mode !== 'inspect') return

      // Find element under the cursor (piercing through our own overlay)
      const overlayEl = overlayRef.current
      if (overlayEl) overlayEl.style.pointerEvents = 'none'
      const target = deepElementFromPoint(e.clientX, e.clientY)
      if (overlayEl) overlayEl.style.pointerEvents = ''

      if (!target || closestCrossingShadow(target, '[data-snapmark-ignore]')) {
        setHoverRect(null)
        return
      }

      const rect = target.getBoundingClientRect()
      setHoverRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height })
    },
    [mode]
  )

  const handleClick = useCallback(
    (e: MouseEvent) => {
      if (mode !== 'inspect') return
      e.preventDefault()
      e.stopPropagation()

      const overlayEl = overlayRef.current
      if (overlayEl) overlayEl.style.pointerEvents = 'none'
      const target = deepElementFromPoint(e.clientX, e.clientY)
      if (overlayEl) overlayEl.style.pointerEvents = ''

      if (!target || closestCrossingShadow(target, '[data-snapmark-ignore]')) return

      const rect = target.getBoundingClientRect()
      const box: BoundingBox = {
        x: rect.left + window.scrollX,
        y: rect.top + window.scrollY,
        width: rect.width,
        height: rect.height,
      }
      const elementInfo = getElementInfo(target)
      setHoverRect(null)
      onInspectCapture(box, elementInfo)
    },
    [mode, onInspectCapture]
  )

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (mode !== 'area') return
      e.preventDefault()
      setDrag({ startX: e.clientX, startY: e.clientY, currentX: e.clientX, currentY: e.clientY, active: true })
    },
    [mode]
  )

  const handleMouseMoveArea = useCallback(
    (e: MouseEvent) => {
      if (mode !== 'area') return
      setDrag((d) => (d ? { ...d, currentX: e.clientX, currentY: e.clientY } : null))
    },
    [mode]
  )

  const handleMouseUp = useCallback(
    (e: MouseEvent) => {
      if (mode !== 'area' || !drag) return
      e.preventDefault()

      const x = Math.min(drag.startX, e.clientX)
      const y = Math.min(drag.startY, e.clientY)
      const w = Math.abs(e.clientX - drag.startX)
      const h = Math.abs(e.clientY - drag.startY)

      setDrag(null)

      if (w < 5 || h < 5) return // ignore tiny accidental drags

      const box: BoundingBox = {
        x: x + window.scrollX,
        y: y + window.scrollY,
        width: w,
        height: h,
      }
      onAreaCapture(box)
    },
    [mode, drag, onAreaCapture]
  )

  useEffect(() => {
    const el = overlayRef.current
    if (!el) return

    el.addEventListener('mousemove', handleMouseMove)
    el.addEventListener('click', handleClick)
    el.addEventListener('mousedown', handleMouseDown)
    el.addEventListener('mousemove', handleMouseMoveArea)
    el.addEventListener('mouseup', handleMouseUp)

    return () => {
      el.removeEventListener('mousemove', handleMouseMove)
      el.removeEventListener('click', handleClick)
      el.removeEventListener('mousedown', handleMouseDown)
      el.removeEventListener('mousemove', handleMouseMoveArea)
      el.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleClick, handleMouseDown, handleMouseMoveArea, handleMouseUp])

  // Compute drag selection rect in viewport coordinates
  const selectionStyle =
    drag
      ? {
          left: Math.min(drag.startX, drag.currentX),
          top: Math.min(drag.startY, drag.currentY),
          width: Math.abs(drag.currentX - drag.startX),
          height: Math.abs(drag.currentY - drag.startY),
        }
      : null

  return (
    <>
      <div ref={overlayRef} className="dqa-overlay" data-snapmark-ignore />

      {mode === 'inspect' && hoverRect && (
        <div
          className="dqa-highlight"
          data-snapmark-ignore
          style={{
            top: hoverRect.top,
            left: hoverRect.left,
            width: hoverRect.width,
            height: hoverRect.height,
          }}
        />
      )}

      {mode === 'area' && selectionStyle && (
        <div
          className="dqa-selection-rect"
          data-snapmark-ignore
          style={selectionStyle}
        />
      )}
    </>
  )
}
