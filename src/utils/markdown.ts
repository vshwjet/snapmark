import type { Annotation, ElementInfo } from '../../types'
import { PRIORITY_LABELS, CATEGORY_LABELS } from '../../types'

export function generateMarkdown(annotations: Annotation[]): string {
  const pageUrl = annotations[0]?.pageUrl ?? window.location.href
  const date = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  const viewport = `${window.innerWidth}×${window.innerHeight}`

  const blocking = annotations.filter((a) => a.priority === 'p1').length
  const important = annotations.filter((a) => a.priority === 'p2').length
  const suggestion = annotations.filter((a) => a.priority === 'p3').length

  const summaryParts = [
    `${annotations.length} annotation${annotations.length !== 1 ? 's' : ''}`,
    blocking > 0 ? `${blocking} blocking` : null,
    important > 0 ? `${important} important` : null,
    suggestion > 0 ? `${suggestion} suggestion` : null,
  ].filter(Boolean)

  const lines: string[] = [
    `# Design QA — ${pageUrl}`,
    `${date} · **Viewport:** ${viewport}`,
    '',
    summaryParts.join(' · '),
    '',
    '---',
  ]

  for (const a of annotations) {
    const priorityLabel = PRIORITY_LABELS[a.priority]
    const categoryLabel = CATEGORY_LABELS[a.category]

    lines.push('')
    lines.push(`## #${a.index} · ${priorityLabel} · ${categoryLabel}`)
    lines.push('')
    lines.push(`![Annotation ${a.index}](${a.screenshot})`)
    lines.push('')
    lines.push(`**Issue:** ${a.comment}`)

    if (a.elementInfo) {
      lines.push('')
      lines.push(formatElementInfo(a.elementInfo))
    }

    lines.push('')
    lines.push('---')
  }

  return lines.join('\n')
}

function formatElementInfo(info: ElementInfo): string {
  const lines: string[] = []

  // Element headline: tag + text + label
  let headline = `\`${info.tag}\``
  if (info.text) headline += ` — "${info.text}"`
  else if (info.label) headline += ` — "${info.label}"`
  lines.push(`**Element:** ${headline}`)

  // Role (only if non-obvious, i.e. not the same as the tag)
  if (info.role && info.role !== info.tag) {
    lines.push(`**Role:** \`${info.role}\``)
  }

  // Meaningful attributes (type, name, id, data-testid, href, etc.)
  if (info.attrs.length > 0) {
    lines.push(`**Attrs:** ${info.attrs.map((a) => `\`${a}\``).join(' · ')}`)
  }

  // Class-based path (most useful for Tailwind codebases)
  lines.push(`**Location:** \`${info.classPath}\``)

  // Tag-based selector as fallback reference
  if (info.selector !== info.classPath) {
    lines.push(`**Selector:** \`${info.selector}\``)
  }

  return lines.join('  \n')
}
