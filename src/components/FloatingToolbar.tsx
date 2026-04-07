import { useCallback, useEffect, useRef, useState } from 'react'
import type { Annotation, AnnotationMode } from '../../types'
import { PRIORITY_LABELS, CATEGORY_LABELS } from '../../types'

const STORAGE_KEY = 'dqa-toolbar-position-v2'
const DRAG_THRESHOLD = 10

interface FloatingToolbarProps {
  isActive: boolean
  mode: AnnotationMode
  annotations: Annotation[]
  isUploading: boolean
  uploadError: string | null
  onActivate: () => void
  onDeactivate: () => void
  onModeChange: (mode: AnnotationMode) => void
  onDelete: (id: string) => void
  onClearAll: () => void
  onCopyMarkdown: () => void
}

function getInitialPosition() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved) as { x: number; y: number }
  } catch { /* ignore */ }
  return { x: 20, y: window.innerHeight - 44 - 20 }
}

function savePosition(pos: { x: number; y: number }) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(pos)) } catch { /* ignore */ }
}

// pos.x is CSS `right` value — distance from right edge of viewport
function clampPos(pos: { x: number; y: number }) {
  if (typeof window === 'undefined') return pos
  const pad = 8
  return {
    x: Math.max(pad, Math.min(window.innerWidth - 44 - pad, pos.x)),
    y: Math.max(pad, Math.min(window.innerHeight - 44 - pad, pos.y)),
  }
}

export function FloatingToolbar({
  isActive,
  mode,
  annotations,
  isUploading,
  uploadError,
  onActivate,
  onDeactivate,
  onModeChange,
  onDelete,
  onClearAll,
  onCopyMarkdown,
}: FloatingToolbarProps) {
  const [showPanel, setShowPanel] = useState(false)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef<{ mx: number; my: number; tx: number; ty: number } | null>(null)
  const justDragged = useRef(false)

  // Set position on client only (avoids SSR/hydration mismatch)
  useEffect(() => { setPos(getInitialPosition()) }, [])

  // Close panel on deactivate
  useEffect(() => { if (!isActive) setShowPanel(false) }, [isActive])

  // Clamp on resize
  useEffect(() => {
    const handler = () => setPos((p) => p ? clampPos(p) : p)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!pos) return
    if ((e.target as HTMLElement).closest('button,select,input')) return
    e.preventDefault()
    dragRef.current = { mx: e.clientX, my: e.clientY, tx: pos.x, ty: pos.y }
  }, [pos])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current) return
      const dx = e.clientX - dragRef.current.mx
      const dy = e.clientY - dragRef.current.my
      if (!isDragging && Math.hypot(dx, dy) < DRAG_THRESHOLD) return
      if (!isDragging) setIsDragging(true)
      // x is CSS `right`: moving mouse right (-dx) decreases right value
      setPos(clampPos({ x: dragRef.current.tx - dx, y: dragRef.current.ty + dy }))
    }
    const onUp = (e: MouseEvent) => {
      if (!dragRef.current) return
      if (isDragging) {
        const finalPos = clampPos({
          x: dragRef.current.tx - (e.clientX - dragRef.current.mx),
          y: dragRef.current.ty + (e.clientY - dragRef.current.my),
        })
        savePosition(finalPos)
        justDragged.current = true
        setTimeout(() => { justDragged.current = false }, 50)
      }
      dragRef.current = null
      setIsDragging(false)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, [isDragging])

  const handleActivate = () => {
    if (justDragged.current) return
    onActivate()
  }

  if (!pos) return null

  return (
    <div
      className="dqa-floating"
      data-design-qa-ignore
      style={{ right: pos.x, top: pos.y }}
    >
      {/* Annotations panel — floats above toolbar */}
      {showPanel && isActive && (
        <AnnotationsPanel
          annotations={annotations}
          onDelete={onDelete}
          onClearAll={onClearAll}
          onCopyMarkdown={() => { onCopyMarkdown(); setShowPanel(false) }}
        />
      )}

      <div
        className={`dqa-pill${isActive ? ' dqa-pill-expanded' : ' dqa-pill-collapsed'}`}
        onMouseDown={handleMouseDown}
        style={{ cursor: isDragging ? 'grabbing' : isActive ? 'grab' : 'pointer' }}
      >
        {!isActive ? (
          /* ── Collapsed: icon circle ── */
          <button
            className="dqa-pill-icon-btn"
            onClick={handleActivate}
            title="Activate Design QA (⌘⇧A)"
          >
            <AnnotateIcon />
            {annotations.length > 0 && (
              <span className="dqa-pill-badge">{annotations.length}</span>
            )}
          </button>
        ) : (
          /* ── Expanded: full pill controls ── */
          <>
            {/* Active dot + label */}
            <div className="dqa-pill-status" style={{ pointerEvents: 'none' }}>
              <span className={uploadError ? 'dqa-pill-dot dqa-pill-dot-error' : isUploading ? 'dqa-pill-dot dqa-pill-dot-uploading' : 'dqa-pill-dot'} />
              <span className="dqa-pill-label" title={uploadError ?? undefined}>
                {uploadError ? 'Upload failed' : isUploading ? 'Uploading…' : 'QA'}
              </span>
            </div>

            <span className="dqa-pill-sep" />

            {/* Mode toggle — hidden while uploading */}
            {!isUploading && (
              <div className="dqa-mode-group">
                <button
                  className={`dqa-mode-btn${mode === 'inspect' ? ' dqa-active' : ''}`}
                  onClick={() => onModeChange('inspect')}
                  title="Click elements to annotate"
                >
                  Inspect
                </button>
                <button
                  className={`dqa-mode-btn${mode === 'area' ? ' dqa-active' : ''}`}
                  onClick={() => onModeChange('area')}
                  title="Drag to select area"
                >
                  Area
                </button>
              </div>
            )}

            {/* Annotation count — click to toggle list */}
            <button
              className={`dqa-pill-btn${showPanel ? ' dqa-active' : ''}`}
              onClick={() => setShowPanel((v) => !v)}
              title="View annotations"
            >
              <ListIcon />
              {annotations.length > 0 && (
                <span className="dqa-btn-badge">{annotations.length}</span>
              )}
            </button>

            {/* Copy markdown — only when there are annotations */}
            {annotations.length > 0 && (
              <button
                className="dqa-pill-btn"
                onClick={onCopyMarkdown}
                title="Copy as Markdown"
              >
                <CopyIcon />
              </button>
            )}

            <span className="dqa-pill-sep" />

            {/* Close */}
            <button
              className="dqa-pill-btn"
              onClick={onDeactivate}
              title="Exit QA mode (⌘⇧A)"
            >
              <CloseIcon />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── Annotations panel ────────────────────────────────────────────────────────

interface AnnotationsPanelProps {
  annotations: Annotation[]
  onDelete: (id: string) => void
  onClearAll: () => void
  onCopyMarkdown: () => void
}

function AnnotationsPanel({ annotations, onDelete, onClearAll, onCopyMarkdown }: AnnotationsPanelProps) {
  return (
    <div className="dqa-panel">
      <div className="dqa-panel-header">
        <span className="dqa-panel-title">
          {annotations.length} Annotation{annotations.length !== 1 ? 's' : ''}
        </span>
        {annotations.length > 0 && (
          <button className="dqa-panel-clear-btn" onClick={onClearAll}>
            Clear all
          </button>
        )}
      </div>

      <div className="dqa-panel-list">
        {annotations.length === 0 ? (
          <div className="dqa-panel-empty">
            No annotations yet.
            <br />Click an element or drag an area to start.
          </div>
        ) : (
          annotations.map((a) => (
            <div key={a.id} className="dqa-panel-item">
              <span className="dqa-panel-num">#{a.index}</span>
              <span className={`dqa-panel-badge dqa-panel-badge-${a.priority}`}>
                {PRIORITY_LABELS[a.priority]}
              </span>
              <div className="dqa-panel-text">
                <div className="dqa-panel-comment">{a.comment}</div>
                <div className="dqa-panel-cat">{CATEGORY_LABELS[a.category]}</div>
              </div>
              <button
                className="dqa-panel-delete"
                onClick={() => onDelete(a.id)}
                title="Delete"
              >
                <CloseIcon />
              </button>
            </div>
          ))
        )}
      </div>

      {annotations.length > 0 && (
        <div className="dqa-panel-footer">
          <button className="dqa-panel-copy-btn" onClick={onCopyMarkdown}>
            Copy Markdown
          </button>
        </div>
      )}
    </div>
  )
}

// ── Icons ────────────────────────────────────────────────────────────────────

function AnnotateIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="14" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 16l2.5-3.5h1L12 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="5" y1="5.5" x2="13" y2="5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="5" y1="8.5" x2="10" y2="8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function ListIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="4" y1="4" x2="12" y2="4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="4" y1="7.5" x2="12" y2="7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="4" y1="11" x2="9" y2="11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="2" cy="4" r="0.8" fill="currentColor" />
      <circle cx="2" cy="7.5" r="0.8" fill="currentColor" />
      <circle cx="2" cy="11" r="0.8" fill="currentColor" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="1.5" width="8.5" height="9.5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3 5H2a1.5 1.5 0 00-1.5 1.5v7A1.5 1.5 0 002 15h7a1.5 1.5 0 001.5-1.5V12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}
