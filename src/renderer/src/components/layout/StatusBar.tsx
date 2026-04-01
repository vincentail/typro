import { useEditorStore } from '../../store/editorStore'
import { useUiStore } from '../../store/uiStore'
import { useT } from '../../locales'
import styles from './StatusBar.module.css'

export function StatusBar() {
  const { wordCount, cursorPos, filePath } = useEditorStore()
  const { focusMode, viewMode, setViewMode } = useUiStore()
  const t = useT()

  if (focusMode) return null

  const ext = filePath ? filePath.split('.').pop()?.toLowerCase() : 'md'

  return (
    <div className={styles.statusBar}>
      <div className={styles.left}>
        <span className={styles.item} title={t.fileType}>
          {ext?.toUpperCase() || 'MD'}
        </span>
        <span className={styles.sep} />
        <span className={styles.item} title={t.cursorPosition}>
          Ln {cursorPos.line}, Col {cursorPos.col}
        </span>
      </div>

      <div className={styles.right}>
        <span className={styles.item} title={t.wordCountLabel}>
          {wordCount.words} {t.words}
        </span>
        <span className={styles.sep} />
        <span className={styles.item} title={t.charCountLabel}>
          {wordCount.chars} {t.chars}
        </span>
        <span className={styles.sep} />
        <span className={styles.item} title={t.lineCountLabel}>
          {wordCount.lines} {t.lines}
        </span>
      </div>
    </div>
  )
}
