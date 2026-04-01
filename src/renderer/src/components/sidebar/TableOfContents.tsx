import { useMemo } from 'react'
import { EditorView } from '@codemirror/view'
import { useEditorStore } from '../../store/editorStore'
import { extractToc, TocItem } from '../../lib/markdown/parser'
import styles from './TableOfContents.module.css'

interface Props {
  editorView: EditorView | null
}

export function TableOfContents({ editorView }: Props) {
  const content = useEditorStore((s) => s.content)
  const cursorPos = useEditorStore((s) => s.cursorPos)

  const toc = useMemo(() => extractToc(content), [content])

  const scrollToHeading = (item: TocItem) => {
    if (!editorView) return
    const line = editorView.state.doc.line(Math.min(item.line, editorView.state.doc.lines))
    editorView.dispatch({
      selection: { anchor: line.from },
      effects: EditorView.scrollIntoView(line.from, { y: 'start', yMargin: 50 })
    })
    editorView.focus()
  }

  if (toc.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No headings found.</p>
        <p>Use # to create headings.</p>
      </div>
    )
  }

  const minLevel = Math.min(...toc.map((t) => t.level))

  return (
    <div className={styles.toc}>
      {toc.map((item, idx) => {
        const isActive = cursorPos.line >= item.line &&
          (idx === toc.length - 1 || cursorPos.line < toc[idx + 1].line)
        return (
          <button
            key={idx}
            className={`${styles.item} ${isActive ? styles.active : ''}`}
            style={{ paddingLeft: `${8 + (item.level - minLevel) * 14}px` }}
            onClick={() => scrollToHeading(item)}
            title={item.text}
          >
            <span className={styles.level}>H{item.level}</span>
            <span className={styles.text}>{item.text}</span>
          </button>
        )
      })}
    </div>
  )
}
