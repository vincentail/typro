import { useEffect, useState } from 'react'
import { useEditorStore } from '../../store/editorStore'
import styles from './RecentFiles.module.css'

const typro = (window as unknown as { typro: Window['typro'] }).typro

export function RecentFiles() {
  const [recentFiles, setRecentFiles] = useState<string[]>([])
  const { filePath, isDirty, openFile } = useEditorStore()

  useEffect(() => {
    if (!typro?.file?.getRecent) return
    typro.file.getRecent().then(setRecentFiles)
  }, [filePath])

  const openRecent = async (path: string) => {
    if (isDirty && !confirm('Discard unsaved changes?')) return
    const result = await typro.file.openPath(path)
    if (result) {
      openFile(result.path, result.content)
    }
  }

  const formatPath = (path: string) => {
    const parts = path.split(/[\\/]/)
    return {
      name: parts[parts.length - 1],
      dir: parts.slice(0, -1).join('/') || '/'
    }
  }

  if (recentFiles.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No recent files.</p>
        <p>Open a file with Cmd+O.</p>
      </div>
    )
  }

  return (
    <div className={styles.files}>
      <div className={styles.header}>Recent Files</div>
      {recentFiles.map((path) => {
        const { name, dir } = formatPath(path)
        const isActive = path === filePath
        return (
          <button
            key={path}
            className={`${styles.file} ${isActive ? styles.active : ''}`}
            onClick={() => openRecent(path)}
            title={path}
          >
            <svg width="12" height="14" viewBox="0 0 12 14" fill="currentColor" className={styles.fileIcon}>
              <path d="M1 0h7l3 3v10a1 1 0 01-1 1H1a1 1 0 01-1-1V1a1 1 0 011-1zm0 1v12h10V4H7V0H1z" opacity=".7"/>
            </svg>
            <div className={styles.fileInfo}>
              <span className={styles.fileName}>{name}</span>
              <span className={styles.fileDir}>{dir}</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
