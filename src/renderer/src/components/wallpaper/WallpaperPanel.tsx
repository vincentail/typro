import { useEffect, useRef } from 'react'
import { useUiStore } from '../../store/uiStore'
import { useThemeStore } from '../../store/themeStore'
import { ALL_CURATED } from '../../lib/themes/registry'
import { useT } from '../../locales'
import styles from './WallpaperPanel.module.css'

const typro = (window as unknown as { typro: Window['typro'] }).typro

type BgKey = '--bg-primary' | '--bg-secondary' | '--bg-sidebar' | '--bg-titlebar'

interface Props {
  onClose: () => void
}

function toTyproUrl(filePath: string): string {
  return 'typro://' + filePath.replace(/\\/g, '/').replace(/[\s"'()]/g, encodeURIComponent)
}

export function WallpaperPanel({ onClose }: Props) {
  const { wallpaperPath, bgOpacity, customBgColors, setWallpaperPath, setBgOpacity, setCustomBgColor, resetCustomBgColors } = useUiStore()
  const { activeThemeId, customThemes } = useThemeStore()
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

  // Get current theme's default bg colors as fallback for color pickers
  const themeDef =
    ALL_CURATED.find((td) => td.id === activeThemeId) ||
    customThemes.find((td) => td.id === activeThemeId)

  const bgKeys: { key: BgKey; label: string }[] = [
    { key: '--bg-primary',   label: t.bgPrimary },
    { key: '--bg-secondary', label: t.bgSecondary },
    { key: '--bg-sidebar',   label: t.bgSidebar },
    { key: '--bg-titlebar',  label: t.bgTitlebar },
  ]

  const hasCustomColors = Object.keys(customBgColors).length > 0

  return (
    <div className={styles.panel} ref={panelRef}>

      {/* ── Wallpaper ── */}
      <div className={styles.sectionTitle}>{t.wallpaper}</div>

      <div className={styles.preview}>
        {wallpaperPath ? (
          <img className={styles.thumb} src={toTyproUrl(wallpaperPath)} alt="wallpaper" />
        ) : (
          <div className={styles.empty}>{t.noWallpaper}</div>
        )}
      </div>

      <div className={styles.actions}>
        <button className={styles.btn} onClick={handleChooseImage}>{t.chooseImage}</button>
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
            type="range" min={0} max={100}
            value={Math.round(bgOpacity * 100)}
            onChange={(e) => setBgOpacity(Number(e.target.value) / 100)}
          />
          <span className={styles.value}>{Math.round(bgOpacity * 100)}%</span>
        </div>
      )}

      {/* ── Background Colors ── */}
      <div className={styles.divider} />

      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>{t.bgColors}</span>
        {hasCustomColors && (
          <button className={styles.resetBtn} onClick={resetCustomBgColors}>{t.resetBgColors}</button>
        )}
      </div>

      <div className={styles.colorList}>
        {bgKeys.map(({ key, label }) => {
          const defaultColor = themeDef?.variables[key] ?? '#ffffff'
          const currentColor = customBgColors[key] ?? defaultColor
          const isCustomized = !!customBgColors[key]
          return (
            <div key={key} className={styles.colorRow}>
              <span className={`${styles.colorLabel} ${isCustomized ? styles.colorLabelActive : ''}`}>
                {label}
              </span>
              <label className={styles.colorSwatch} style={{ background: currentColor }}>
                <input
                  type="color"
                  className={styles.colorInput}
                  value={currentColor}
                  onChange={(e) => setCustomBgColor(key, e.target.value)}
                />
              </label>
            </div>
          )
        })}
      </div>

    </div>
  )
}
