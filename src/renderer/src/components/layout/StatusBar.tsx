import { useEffect, useRef, useState } from 'react'
import { useEditorStore } from '../../store/editorStore'
import { useUiStore } from '../../store/uiStore'
import { useT } from '../../locales'
import styles from './StatusBar.module.css'

const INTERVAL_OPTIONS = [
  { value: 10,  label: '10s' },
  { value: 15,  label: '15s' },
  { value: 30,  label: '30s' },
  { value: 60,  label: '1 min' },
  { value: 120, label: '2 min' },
  { value: 300, label: '5 min' },
]

export function StatusBar() {
  const { wordCount, cursorPos, filePath } = useEditorStore()
  const { focusMode, autoSave, autoSaveInterval, setAutoSave, setAutoSaveInterval, devMode } = useUiStore()
  const t = useT()
  const [popoverOpen, setPopoverOpen] = useState(false)
  const groupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!popoverOpen) return
    const handler = (e: MouseEvent) => {
      if (!groupRef.current?.contains(e.target as Node)) setPopoverOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [popoverOpen])

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
        <span className={styles.sep} />

        {/* Auto-save control */}
        <div ref={groupRef} className={styles.autoSaveGroup}>
          <button
            className={`${styles.autoSaveBtn} ${autoSave ? styles.autoSaveActive : ''}`}
            onClick={() => setPopoverOpen((v) => !v)}
            title={t.autoSave}
          >
            <span className={`${styles.autoSaveDot} ${autoSave ? styles.dotOn : ''}`} />
            {t.autoSave}
            {autoSave && (
              <span className={styles.autoSaveIntervalBadge}>
                {INTERVAL_OPTIONS.find((o) => o.value === autoSaveInterval)?.label ?? `${autoSaveInterval}s`}
              </span>
            )}
          </button>

          {popoverOpen && (
            <div className={styles.autoSavePopover}>
              <div className={styles.popoverRow}>
                <span className={styles.popoverLabel}>{t.autoSave}</span>
                <button
                  className={`${styles.toggleBtn} ${autoSave ? styles.toggleOn : ''}`}
                  onClick={() => setAutoSave(!autoSave)}
                >
                  <span className={styles.toggleThumb} />
                </button>
              </div>
              {autoSave && (
                <div className={styles.popoverRow}>
                  <span className={styles.popoverLabel}>{t.autoSaveInterval}</span>
                  <select
                    className={styles.intervalSelect}
                    value={autoSaveInterval}
                    onChange={(e) => setAutoSaveInterval(Number(e.target.value))}
                  >
                    {INTERVAL_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className={styles.right}>
        {devMode && (
          <>
            <span className={styles.devBadge}>DEV</span>
            <span className={styles.sep} />
          </>
        )}
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
