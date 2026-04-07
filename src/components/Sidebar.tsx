import type { Annotation } from '../../types'
import { PRIORITY_LABELS, CATEGORY_LABELS } from '../../types'

interface SidebarProps {
  annotations: Annotation[]
  highlightedId: string | null
  onHover: (id: string | null) => void
  onDelete: (id: string) => void
  onClearAll: () => void
  onCopyMarkdown: () => void
}

export function Sidebar({
  annotations,
  highlightedId,
  onHover,
  onDelete,
  onClearAll,
  onCopyMarkdown,
}: SidebarProps) {
  return (
    <div className="dqa-sidebar" data-design-qa-ignore>
      <div className="dqa-sidebar-header">Annotations</div>

      <div className="dqa-sidebar-list">
        {annotations.length === 0 ? (
          <div className="dqa-sidebar-empty">
            No annotations yet.
            <br />
            Click an element or drag an area to start.
          </div>
        ) : (
          annotations.map((a) => (
            <SidebarItem
              key={a.id}
              annotation={a}
              isHighlighted={highlightedId === a.id}
              onHover={onHover}
              onDelete={onDelete}
            />
          ))
        )}
      </div>

      {annotations.length > 0 && (
        <div className="dqa-sidebar-footer">
          <button className="dqa-btn dqa-btn-primary" onClick={onCopyMarkdown} title="Copy as Markdown">
            Copy Markdown
          </button>
          <button
            className="dqa-btn dqa-btn-secondary"
            onClick={onClearAll}
            title="Delete all annotations"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  )
}

interface SidebarItemProps {
  annotation: Annotation
  isHighlighted: boolean
  onHover: (id: string | null) => void
  onDelete: (id: string) => void
}

function SidebarItem({ annotation, isHighlighted, onHover, onDelete }: SidebarItemProps) {
  const { id, index, priority, category, comment, screenshot } = annotation

  return (
    <div
      className={`dqa-sidebar-item${isHighlighted ? ' dqa-item-highlighted' : ''}`}
      onMouseEnter={() => onHover(id)}
      onMouseLeave={() => onHover(null)}
    >
      <img className="dqa-sidebar-thumb" src={screenshot} alt={`Annotation ${index}`} draggable={false} />

      <div className="dqa-sidebar-content">
        <div className="dqa-sidebar-meta">
          <span className="dqa-sidebar-index">#{index}</span>
          <span className={`dqa-priority-badge dqa-badge-${priority}`}>{PRIORITY_LABELS[priority]}</span>
          <span className="dqa-category-tag">{CATEGORY_LABELS[category]}</span>
        </div>
        <div className="dqa-sidebar-comment">{comment}</div>
      </div>

      <button
        className="dqa-sidebar-delete"
        onClick={(e) => {
          e.stopPropagation()
          onDelete(id)
        }}
        title="Delete annotation"
      >
        ×
      </button>
    </div>
  )
}
