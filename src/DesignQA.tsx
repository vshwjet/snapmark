import { useCallback, useEffect, useState } from 'react'
import type { Annotation, AnnotationMode, BoundingBox, Category, ElementInfo, Priority } from '../types'
import { Overlay } from './components/Overlay'
import { Popover } from './components/Popover'
import { Pin } from './components/Pin'
import { FloatingToolbar } from './components/FloatingToolbar'
import { captureRegion } from './utils/screenshot'
import { generateMarkdown } from './utils/markdown'
import { uploadToImgbb } from './utils/imgbb'
import './styles/snapmark.css'

type PendingCapture = {
  box: BoundingBox
  screenshot: string
  elementInfo?: ElementInfo
}

interface DesignQAProps {
  /** imgBB API key for image hosting. Get one free at https://imgbb.com → API → Add API key
   *  Without this, screenshots are embedded as base64 (works in local markdown editors only). */
  imgbbApiKey?: string
}

export function DesignQA({ imgbbApiKey }: DesignQAProps = {}) {
  const [isActive, setIsActive] = useState(false)
  const [mode, setMode] = useState<AnnotationMode>('inspect')
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [pending, setPending] = useState<PendingCapture | null>(null)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadingBox, setUploadingBox] = useState<BoundingBox | null>(null)

  // Keyboard shortcut: Cmd+Shift+A / Ctrl+Shift+A
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault()
        setIsActive((prev) => !prev)
        setPending(null)
      }
      if (e.key === 'Escape' && pending) setPending(null)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [pending])

  // Hold Shift → switch to area mode while active
  useEffect(() => {
    if (!isActive) return
    const down = (e: KeyboardEvent) => { if (e.key === 'Shift' && !pending) setMode('area') }
    const up   = (e: KeyboardEvent) => { if (e.key === 'Shift') setMode('inspect') }
    document.addEventListener('keydown', down)
    document.addEventListener('keyup', up)
    return () => {
      document.removeEventListener('keydown', down)
      document.removeEventListener('keyup', up)
    }
  }, [isActive, pending])

  const handleCapture = useCallback(
    async (box: BoundingBox, elementInfo?: ElementInfo) => {
      if (isCapturing || isUploading) return
      setIsCapturing(true)
      try {
        const base64 = await captureRegion(box)
        setIsCapturing(false)

        let screenshot = base64
        if (imgbbApiKey) {
          setIsUploading(true)
          setUploadingBox(box)
          setUploadError(null)
          try {
            screenshot = await uploadToImgbb(base64, imgbbApiKey)
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Upload failed'
            setUploadError(msg)
            screenshot = base64
          } finally {
            setIsUploading(false)
            setUploadingBox(null)
          }
        }

        setPending({ box, screenshot, elementInfo })
      } catch (err) {
        console.error('[DesignQA] Screenshot capture failed:', err)
        setIsCapturing(false)
      }
    },
    [isCapturing, isUploading, imgbbApiKey]
  )

  const handleAdd = useCallback(
    (comment: string, category: Category, priority: Priority) => {
      if (!pending) return
      const annotation: Annotation = {
        id: crypto.randomUUID(),
        index: annotations.length + 1,
        screenshot: pending.screenshot,
        comment,
        category,
        priority,
        boundingBox: pending.box,
        elementInfo: pending.elementInfo,
        pageUrl: window.location.href,
        timestamp: Date.now(),
      }
      setAnnotations((prev) => [...prev, annotation])
      setPending(null)
    },
    [pending, annotations.length]
  )

  const handleDelete = useCallback((id: string) => {
    setAnnotations((prev) => {
      const next = prev.filter((a) => a.id !== id)
      return next.map((a, i) => ({ ...a, index: i + 1 }))
    })
  }, [])

  const handleClearAll = useCallback(() => {
    setAnnotations([])
    setPending(null)
  }, [])

  const handleCopyMarkdown = useCallback(async () => {
    const md = generateMarkdown(annotations)
    try {
      await navigator.clipboard.writeText(md)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = md
      ta.style.cssText = 'position:fixed;opacity:0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
  }, [annotations])

  const showOverlay = isActive && !pending && !isCapturing && !isUploading

  return (
    <div className="dqa-root">
      {/* Floating pill — always visible so user can activate */}
      <FloatingToolbar
        isActive={isActive}
        mode={mode}
        annotations={annotations}
        isUploading={isUploading}
        uploadError={uploadError}
        onActivate={() => setIsActive(true)}
        onDeactivate={() => { setIsActive(false); setPending(null) }}
        onModeChange={setMode}
        onDelete={handleDelete}
        onClearAll={handleClearAll}
        onCopyMarkdown={handleCopyMarkdown}
      />

      {/* Capture overlay */}
      {showOverlay && (
        <Overlay
          mode={mode}
          onInspectCapture={(box, info) => handleCapture(box, info)}
          onAreaCapture={(box) => handleCapture(box)}
        />
      )}

      {/* Pins on page (absolute positioned to document coords) */}
      {isActive && annotations.map((a) => (
        <Pin
          key={a.id}
          annotation={a}
          isHighlighted={highlightedId === a.id}
          onClick={() => setHighlightedId((prev) => (prev === a.id ? null : a.id))}
          onHover={setHighlightedId}
        />
      ))}

      {/* Upload indicator near the captured region */}
      {uploadingBox && isUploading && (
        <UploadIndicator box={uploadingBox} />
      )}

      {/* Popover after selection */}
      {pending && (
        <Popover
          box={pending.box}
          screenshot={pending.screenshot}
          onAdd={handleAdd}
          onCancel={() => setPending(null)}
        />
      )}
    </div>
  )
}

function UploadIndicator({ box }: { box: BoundingBox }) {
  const cx = box.x + box.width / 2
  const cy = box.y - window.scrollY + box.height / 2
  return (
    <>
      <div
        className="dqa-uploading-region"
        data-snapmark-ignore
        style={{ left: box.x, top: box.y - window.scrollY, width: box.width, height: box.height }}
      />
      <div
        className="dqa-upload-indicator"
        data-snapmark-ignore
        style={{ left: cx, top: cy }}
      >
        <span className="dqa-upload-spinner" />
        Uploading…
      </div>
    </>
  )
}
