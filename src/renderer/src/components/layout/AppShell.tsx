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

export function AppShell() {
  const { viewMode, sidebarOpen, focusMode, editorFontSize, lineHeight } = useUiStore()
  const content = useEditorStore((s) => s.content)
  const [editorView, setEditorView] = useState<EditorView | null>(null)
  const [splitRatio, setSplitRatio] = useState(0.5)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)

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
                <MarkdownPreview content={content} />
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
