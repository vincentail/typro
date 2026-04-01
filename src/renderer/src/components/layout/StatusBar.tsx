import { useEditorStore } from '../../store/editorStore'
import { useUiStore } from '../../store/uiStore'
import styles from './StatusBar.module.css'

export function StatusBar() {
  const { wordCount, cursorPos, filePath } = useEditorStore()
  const { focusMode, viewMode, setViewMode } = useUiStore()

  if (focusMode) return null

  const ext = filePath ? filePath.split('.').pop()?.toLowerCase() : 'md'

  return (
    <div className={styles.statusBar}>
      <div className={styles.left}>
        <span className={styles.item} title="File type">
          {ext?.toUpperCase() || 'MD'}
        </span>
        <span className={styles.sep} />
        <span className={styles.item} title="Cursor position">
          Ln {cursorPos.line}, Col {cursorPos.col}
        </span>
      </div>

      <div className={styles.right}>
        <span className={styles.item} title="Word count">
          {wordCount.words} words
        </span>
        <span className={styles.sep} />
        <span className={styles.item} title="Character count">
          {wordCount.chars} chars
        </span>
        <span className={styles.sep} />
        <span className={styles.item} title="Line count">
          {wordCount.lines} lines
        </span>
      </div>
    </div>
  )
}
