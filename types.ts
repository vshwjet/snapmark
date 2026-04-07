export type Priority = 'p1' | 'p2' | 'p3'

export type Category =
  | 'spacing'
  | 'typography'
  | 'color'
  | 'interaction'
  | 'copy'
  | 'missing'
  | 'other'

export type BoundingBox = {
  x: number       // px from left of viewport
  y: number       // px from top of document (includes scroll)
  width: number
  height: number
}

export type ElementInfo = {
  tag: string         // 'button', 'input', 'a', etc.
  text?: string       // visible text content (trimmed, ≤80 chars)
  label?: string      // aria-label, title, or placeholder
  role?: string       // explicit or implicit ARIA role
  attrs: string[]     // ['type=submit', 'name=email', 'href=/home']
  classPath: string   // '.flex > button.btn-primary' (class-based path)
  selector: string    // 'main > section > div > button' (tag-based fallback)
}

export type Annotation = {
  id: string
  index: number            // 1, 2, 3... display number
  screenshot: string       // base64 PNG cropped to boundingBox
  comment: string
  category: Category
  priority: Priority
  boundingBox: BoundingBox
  elementInfo?: ElementInfo  // rich element context, inspect mode only
  pageUrl: string
  timestamp: number
}

export type AnnotationMode = 'inspect' | 'area'

export type OverlayState =
  | { phase: 'idle' }
  | { phase: 'selecting'; mode: AnnotationMode }
  | { phase: 'popover'; pendingBox: BoundingBox; screenshot: string }

export type PriorityLabel = {
  [K in Priority]: string
}

export const PRIORITY_LABELS: PriorityLabel = {
  p1: '🔴 P1',
  p2: '🟡 P2',
  p3: '🟢 P3',
}

export const CATEGORY_LABELS: Record<Category, string> = {
  spacing: 'Spacing',
  typography: 'Typography',
  color: 'Color',
  interaction: 'Interaction',
  copy: 'Copy',
  missing: 'Missing',
  other: 'Other',
}
