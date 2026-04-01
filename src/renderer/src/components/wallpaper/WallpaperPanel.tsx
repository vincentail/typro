import { useEffect, useRef } from 'react'
import { useUiStore } from '../../store/uiStore'
import { useT } from '../../locales'
import styles from './WallpaperPanel.module.css'

const typro = (window as unknown as { typro: Window['typro'] }).typro

interface Props {
  onClose: () => void
}

function toTyproUrl(filePath: string): string {
  return 'typro://' + filePath.replace(/\\/g, '/').replace(/[\s"'()]/g, encodeURIComponent)
}

export function WallpaperPanel({ onClose }: Props) {
  const { wallpaperPath, bgOpacity, setWallpaperPath, setBgOpacity } = useUiStore()
  const t = useT()
  const panelRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!panelRef.current?.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const handleChooseImage = async () => {
    const result = await typro?.file?.openImage()
    if (result) setWallpaperPath(result)
  }

  return (
    <div className={styles.panel} ref={panelRef}>
      <div className={styles.preview}>
        {wallpaperPath ? (
          <img
            className={styles.thumb}
            src={toTyproUrl(wallpaperPath)}
            alt="wallpaper"
          />
        ) : (
          <div className={styles.empty}>{t.noWallpaper}</div>
        )}
      </div>

      <div className={styles.actions}>
        <button className={styles.btn} onClick={handleChooseImage}>
          {t.chooseImage}
        </button>
        {wallpaperPath && (
          <button className={`${styles.btn} ${styles.btnRemove}`} onClick={() => setWallpaperPath('')}>
            {t.removeWallpaper}
          </button>
        )}
      </div>

      {wallpaperPath && (
        <div className={styles.opacityRow}>
          <span className={styles.label}>{t.bgOpacity}</span>
          <input
            className={styles.slider}
            type="range"
            min={0}
            max={100}
            value={Math.round(bgOpacity * 100)}
            onChange={(e) => setBgOpacity(Number(e.target.value) / 100)}
          />
          <span className={styles.value}>{Math.round(bgOpacity * 100)}%</span>
        </div>
      )}
    </div>
  )
}
