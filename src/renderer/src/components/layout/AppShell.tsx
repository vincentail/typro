import { useEffect, useRef, useState } from 'react'
import { TitleBar } from './TitleBar'
import { StatusBar } from './StatusBar'
import { Toolbar } from '../toolbar/Toolbar'
import { Sidebar } from '../sidebar/Sidebar'
import { MarkdownEditor } from '../editor/MarkdownEditor'
import { MarkdownPreview } from '../preview/MarkdownPreview'
import { useUiStore } from '../../store/uiStore'
import { useEditorStore } from '../../store/editorStore'
import { EditorView } from '@codemirror/view'
import styles from './AppShell.module.css'

// Returns all [data-source-line] elements and their line numbers from a container
function getMarkers(container: HTMLElement): { line: number; el: HTMLElement }[] {
  const els = container.querySelectorAll<HTMLElement>('[data-source-line]')
  const result: { line: number; el: HTMLElement }[] = []
  els.forEach((el) => {
    const line = parseInt(el.getAttribute('data-source-line') ?? '', 10)
    if (!isNaN(line)) result.push({ line, el })
  })
  return result
}

function syncEditorToPreview(
  editorView: EditorView,
  previewEl: HTMLElement
): void {
  // Find the first visible line in the editor
  const dom = editorView.dom
  const editorRect = dom.getBoundingClientRect()
  const topPos = editorView.posAtCoords({ x: editorRect.left, y: editorRect.top + 4 })
  if (topPos == null) return
  const topLine = editorView.state.doc.lineAt(topPos).number
  const totalLines = editorView.state.doc.lines

  const markers = getMarkers(previewEl)
  if (markers.length === 0) return

  // Find surrounding markers
  let before = markers[0]
  let after = markers[markers.length - 1]
  for (const m of markers) {
    if (m.line <= topLine) before = m
    else { after = m; break }
  }

  // Interpolate scroll position
  let targetScrollTop: number
  if (before.line === after.line) {
    const rect = before.el.getBoundingClientRect()
    targetScrollTop = previewEl.scrollTop + rect.top - previewEl.getBoundingClientRect().top
  } else {
    const t = (topLine - before.line) / (after.line - before.line)
    const beforeRect = before.el.getBoundingClientRect()
    const afterRect = after.el.getBoundingClientRect()
    const previewRect = previewEl.getBoundingClientRect()
    const beforeTop = previewEl.scrollTop + beforeRect.top - previewRect.top
    const afterTop = previewEl.scrollTop + afterRect.top - previewRect.top
    targetScrollTop = beforeTop + t * (afterTop - beforeTop)
    // If at end of editor, scroll preview to bottom
    if (topLine >= totalLines - 2) {
      targetScrollTop = previewEl.scrollHeight
    }
  }

  previewEl.scrollTop = targetScrollTop
}

// Scroll preview to show a specific source line (cursor-based)
function syncLineToPreview(line: number, totalLines: number, previewEl: HTMLElement): void {
  const markers = getMarkers(previewEl)
  if (markers.length === 0) return

  let before = markers[0]
  let after = markers[markers.length - 1]
  for (const m of markers) {
    if (m.line <= line) before = m
    else { after = m; break }
  }

  const previewRect = previewEl.getBoundingClientRect()
  let targetScrollTop: number
  if (before.line === after.line) {
    targetScrollTop = previewEl.scrollTop + before.el.getBoundingClientRect().top - previewRect.top
  } else {
    const t = (line - before.line) / (after.line - before.line)
    const beforeTop = previewEl.scrollTop + before.el.getBoundingClientRect().top - previewRect.top
    const afterTop = previewEl.scrollTop + after.el.getBoundingClientRect().top - previewRect.top
    targetScrollTop = beforeTop + t * (afterTop - beforeTop)
    if (line >= totalLines - 2) targetScrollTop = previewEl.scrollHeight
  }

  previewEl.scrollTop = targetScrollTop
}

function syncPreviewToEditor(
  previewEl: HTMLElement,
  editorView: EditorView
): void {
  const markers = getMarkers(previewEl)
  if (markers.length === 0) return

  const previewRect = previewEl.getBoundingClientRect()
  // Find first marker at or below the visible top
  let topMarker = markers[0]
  let bottomMarker = markers[markers.length - 1]
  for (let i = 0; i < markers.length; i++) {
    const rect = markers[i].el.getBoundingClientRect()
    const relTop = rect.top - previewRect.top
    if (relTop <= 4) {
      topMarker = markers[i]
    } else {
      bottomMarker = markers[i]
      break
    }
  }

  let targetLine: number
  if (topMarker.line === bottomMarker.line) {
    targetLine = topMarker.line
  } else {
    const topRect = topMarker.el.getBoundingClientRect()
    const botRect = bottomMarker.el.getBoundingClientRect()
    const topRel = topRect.top - previewRect.top
    const botRel = botRect.top - previewRect.top
    const span = botRel - topRel
    const t = span > 0 ? Math.max(0, Math.min(1, -topRel / span)) : 0
    targetLine = Math.round(topMarker.line + t * (bottomMarker.line - topMarker.line))
  }

  const totalLines = editorView.state.doc.lines
  targetLine = Math.max(1, Math.min(totalLines, targetLine))
  const pos = editorView.state.doc.line(targetLine).from
  editorView.dispatch({
    effects: EditorView.scrollIntoView(pos, { y: 'start' })
  })
}

export function AppShell() {
  const { viewMode, sidebarOpen, focusMode, editorFontSize, lineHeight } = useUiStore()
  const content = useEditorStore((s) => s.content)
  const cursorLine = useEditorStore((s) => s.cursorPos.line)
  const [editorView, setEditorView] = useState<EditorView | null>(null)
  const [splitRatio, setSplitRatio] = useState(0.5)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const previewScrollRef = useRef<HTMLDivElement>(null)
  const syncingFrom = useRef<'editor' | 'preview' | null>(null)

  const onDividerMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true
    e.preventDefault()
  }

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const ratio = (e.clientX - rect.left) / rect.width
      setSplitRatio(Math.max(0.2, Math.min(0.8, ratio)))
    }
    const onMouseUp = () => { isDragging.current = false }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  // Editor → Preview scroll sync
  useEffect(() => {
    if (viewMode !== 'split' || !editorView || !previewScrollRef.current) return
    const editorScrollEl = editorView.scrollDOM
    const previewEl = previewScrollRef.current

    const onEditorScroll = () => {
      if (syncingFrom.current === 'preview') return
      syncingFrom.current = 'editor'
      syncEditorToPreview(editorView, previewEl)
      requestAnimationFrame(() => requestAnimationFrame(() => {
        syncingFrom.current = null
      }))
    }
    editorScrollEl.addEventListener('scroll', onEditorScroll, { passive: true })
    return () => editorScrollEl.removeEventListener('scroll', onEditorScroll)
  }, [viewMode, editorView])

  // Preview → Editor scroll sync
  useEffect(() => {
    if (viewMode !== 'split' || !editorView || !previewScrollRef.current) return
    const previewEl = previewScrollRef.current

    const onPreviewScroll = () => {
      if (syncingFrom.current === 'editor') return
      syncingFrom.current = 'preview'
      syncPreviewToEditor(previewEl, editorView)
      requestAnimationFrame(() => requestAnimationFrame(() => {
        syncingFrom.current = null
      }))
    }
    previewEl.addEventListener('scroll', onPreviewScroll, { passive: true })
    return () => previewEl.removeEventListener('scroll', onPreviewScroll)
  }, [viewMode, editorView])

  // Editor cursor → Preview scroll (cursor movement without scrolling)
  useEffect(() => {
    if (viewMode !== 'split' || !editorView || !previewScrollRef.current) return
    if (syncingFrom.current === 'preview') return
    syncingFrom.current = 'editor'
    syncLineToPreview(cursorLine, editorView.state.doc.lines, previewScrollRef.current)
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (syncingFrom.current === 'editor') syncingFrom.current = null
    }))
  }, [cursorLine, viewMode, editorView])

  // Preview click → Editor cursor
  useEffect(() => {
    if (viewMode !== 'split' || !editorView || !previewScrollRef.current) return
    const previewEl = previewScrollRef.current

    const onClick = (e: MouseEvent) => {
      // Walk up from click target to find nearest [data-source-line] block
      let el = e.target as HTMLElement | null
      while (el && el !== previewEl && !el.hasAttribute('data-source-line')) {
        el = el.parentElement
      }
      if (!el || !el.hasAttribute('data-source-line')) return
      const line = parseInt(el.getAttribute('data-source-line')!, 10)
      if (isNaN(line)) return

      const totalLines = editorView.state.doc.lines
      const safeLine = Math.max(1, Math.min(totalLines, line))
      const pos = editorView.state.doc.line(safeLine).from
      editorView.dispatch({
        selection: { anchor: pos },
        effects: EditorView.scrollIntoView(pos, { y: 'center' })
      })
      editorView.focus()
    }

    previewEl.addEventListener('click', onClick)
    return () => previewEl.removeEventListener('click', onClick)
  }, [viewMode, editorView])

  const showSidebar = sidebarOpen && !focusMode

  // CSS variables for editor font size and line height — read by MarkdownEditor
  const editorVars = {
    '--cm-font-size': `${editorFontSize}px`,
    '--cm-line-height': String(lineHeight)
  } as React.CSSProperties

  return (
    <div className={styles.shell} data-focus-mode={focusMode}>
      <TitleBar />
      <Toolbar editorView={editorView} />
      <div className={styles.body}>
        {showSidebar && (
          <div className={styles.sidebar}>
            <Sidebar editorView={editorView} />
          </div>
        )}
        <div
          className={styles.main}
          ref={containerRef}
          style={{ cursor: isDragging.current ? 'col-resize' : undefined }}
        >
          {viewMode === 'source' && (
            <div className={styles.editorFull} style={editorVars}>
              <MarkdownEditor onViewReady={setEditorView} />
            </div>
          )}
          {viewMode === 'split' && (
            <>
              <div className={styles.editorPane} style={{ width: `${splitRatio * 100}%`, ...editorVars }}>
                <MarkdownEditor onViewReady={setEditorView} />
              </div>
              <div className={styles.divider} onMouseDown={onDividerMouseDown} />
              <div className={styles.previewPane} style={{ width: `${(1 - splitRatio) * 100}%` }}>
                <MarkdownPreview content={content} containerRef={previewScrollRef} />
              </div>
            </>
          )}
          {viewMode === 'preview' && (
            <div className={styles.previewFull}>
              <MarkdownPreview content={content} />
            </div>
          )}
        </div>
      </div>
      <StatusBar />
    </div>
  )
}
