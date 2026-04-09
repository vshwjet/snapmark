import React, { useEffect, useRef, useState } from 'react'
import type { BoundingBox, Category, Priority } from '../../types'
import { CATEGORY_LABELS } from '../../types'

interface PopoverProps {
  box: BoundingBox
  screenshot: string
  onAdd: (comment: string, category: Category, priority: Priority) => void
  onCancel: () => void
}

const CATEGORIES: Category[] = ['spacing', 'typography', 'color', 'interaction', 'copy', 'missing', 'other']

export function Popover({ box, screenshot, onAdd, onCancel }: PopoverProps) {
  const [comment, setComment] = useState('')
  const [category, setCategory] = useState<Category>('spacing')
  const [priority, setPriority] = useState<Priority>('p2')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  // Escape key cancels
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onCancel])

  // Compute position: prefer below the box, clamp to viewport
  const POPOVER_WIDTH = 300
  const POPOVER_HEIGHT = 300 // approximate
  const GAP = 8

  // viewport-relative box coords (box stores document coords)
  const boxLeft = box.x - window.scrollX
  const boxTop = box.y - window.scrollY
  const boxBottom = boxTop + box.height

  let left = boxLeft
  let top = boxBottom + GAP

  // Clamp horizontally
  const vw = window.innerWidth
  if (left + POPOVER_WIDTH > vw - 8) left = vw - POPOVER_WIDTH - 8
  if (left < 8) left = 8

  // If no room below, try above
  const vh = window.innerHeight
  if (top + POPOVER_HEIGHT > vh - 8) {
    top = boxTop - POPOVER_HEIGHT - GAP
  }
  if (top < 48) top = 48 // below toolbar

  const handleAdd = () => {
    if (!comment.trim()) return
    onAdd(comment.trim(), category, priority)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAdd()
  }

  return (
    <div
      ref={popoverRef}
      className="dqa-popover"
      data-snapmark-ignore
      style={{ left, top }}
    >
      <img
        className="dqa-popover-thumb"
        src={screenshot}
        alt="Selection preview"
        draggable={false}
      />

      <div className="dqa-popover-body">
        <textarea
          ref={textareaRef}
          className="dqa-popover-textarea"
          placeholder="Describe the issue… (⌘↵ to add)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        <div className="dqa-popover-row">
          <span className="dqa-popover-label">Category</span>
          <select
            className="dqa-popover-select"
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>

        <div className="dqa-popover-row">
          <span className="dqa-popover-label">Priority</span>
          <div className="dqa-priority-pills">
            {(['p1', 'p2', 'p3'] as Priority[]).map((p) => (
              <button
                key={p}
                className={`dqa-priority-pill dqa-pill-${p}${priority === p ? ' dqa-selected' : ''}`}
                onClick={() => setPriority(p)}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="dqa-popover-actions">
          <button className="dqa-btn dqa-btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="dqa-btn dqa-btn-primary" onClick={handleAdd} disabled={!comment.trim()}>
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
