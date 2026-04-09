import type { AnnotationMode } from '../../types'

interface ToolbarProps {
  mode: AnnotationMode
  onModeChange: (mode: AnnotationMode) => void
  annotationCount: number
  onClose: () => void
}

export function Toolbar({ mode, onModeChange, annotationCount, onClose }: ToolbarProps) {
  return (
    <div className="dqa-toolbar" data-snapmark-ignore>
      <div className="dqa-toolbar-badge">
        <div className="dqa-toolbar-dot" />
        QA Mode Active
        <span className="dqa-toolbar-count">
          {annotationCount > 0 ? `· ${annotationCount} annotation${annotationCount !== 1 ? 's' : ''}` : ''}
        </span>
      </div>

      <div className="dqa-toolbar-sep" />

      <div className="dqa-toolbar-mode">
        <button
          className={`dqa-toolbar-mode-btn${mode === 'inspect' ? ' dqa-active' : ''}`}
          onClick={() => onModeChange('inspect')}
          title="Click to inspect elements"
        >
          Inspect
        </button>
        <button
          className={`dqa-toolbar-mode-btn${mode === 'area' ? ' dqa-active' : ''}`}
          onClick={() => onModeChange('area')}
          title="Drag to select area (or hold Shift)"
        >
          Area
        </button>
      </div>

      <span className="dqa-toolbar-hint">
        {mode === 'inspect' ? 'Click an element' : 'Drag to select'} · Esc to cancel · ⌘⇧A to exit
      </span>

      <button className="dqa-toolbar-close" onClick={onClose} title="Exit QA mode (⌘⇧A)">
        ×
      </button>
    </div>
  )
}
