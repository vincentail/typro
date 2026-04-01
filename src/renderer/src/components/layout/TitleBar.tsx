import { useState } from 'react'
import { useEditorStore } from '../../store/editorStore'
import { useUiStore } from '../../store/uiStore'
import { useThemeStore } from '../../store/themeStore'
import { ThemeManager } from '../theme/ThemeManager'
import { WallpaperPanel } from '../wallpaper/WallpaperPanel'
import { useT } from '../../locales'
import styles from './TitleBar.module.css'

const typro = (window as unknown as { typro: Window['typro'] }).typro
const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0

export function TitleBar() {
  const { filePath, isDirty } = useEditorStore()
  const { viewMode, setViewMode, sidebarOpen, toggleSidebar, toolbarVisible, toggleToolbar, language, setLanguage } = useUiStore()
  const { activeThemeId, getAllInstalled } = useThemeStore()
  const [themeOpen, setThemeOpen] = useState(false)
  const [wallpaperOpen, setWallpaperOpen] = useState(false)
  const { wallpaperPath } = useUiStore()
  const t = useT()

  const fileName = filePath ? filePath.split(/[\\/]/).pop() : 'Untitled'
  const activeTheme = getAllInstalled().find((t) => t.id === activeThemeId)

  return (
    <>
      <div className={styles.titlebar} data-is-mac={isMac}>
        {!isMac && (
          <div className={styles.windowControls}>
            <button
              className={`${styles.winBtn} ${styles.close}`}
              onClick={() => typro?.window.close()}
              title="Close"
            />
            <button
              className={`${styles.winBtn} ${styles.minimize}`}
              onClick={() => typro?.window.minimize()}
              title="Minimize"
            />
            <button
              className={`${styles.winBtn} ${styles.maximize}`}
              onClick={() => typro?.window.maximize()}
              title="Maximize"
            />
          </div>
        )}

        <div className={styles.left}>
          <button
            className={`${styles.iconBtn} ${sidebarOpen ? styles.active : ''}`}
            onClick={toggleSidebar}
            title={t.toggleSidebar}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2 3h12v1H2V3zm0 4h8v1H2V7zm0 4h10v1H2v-1z"/>
            </svg>
          </button>
          <button
            className={`${styles.iconBtn} ${toolbarVisible ? styles.active : ''}`}
            onClick={toggleToolbar}
            title={t.toggleToolbar}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="1" y="3" width="14" height="2" rx="1"/>
              <rect x="1" y="7" width="5" height="2" rx="1"/>
              <rect x="7" y="7" width="3" height="2" rx="1"/>
              <rect x="11" y="7" width="4" height="2" rx="1"/>
              <rect x="1" y="11" width="8" height="2" rx="1"/>
            </svg>
          </button>
        </div>

        <div className={styles.center}>
          <span className={styles.fileName}>
            {isDirty && <span className={styles.dirty}>•</span>}
            {fileName}
          </span>
        </div>

        <div className={styles.right}>
          <div className={styles.viewModes}>
            <button
              className={`${styles.viewBtn} ${viewMode === 'source' ? styles.activeView : ''}`}
              onClick={() => setViewMode('source')}
              title={t.sourceMode}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <path d="M1 3h12v1H1V3zm0 4h12v1H1V7zm0 4h8v1H1v-1z"/>
              </svg>
            </button>
            <button
              className={`${styles.viewBtn} ${viewMode === 'split' ? styles.activeView : ''}`}
              onClick={() => setViewMode('split')}
              title={t.splitView}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <path d="M1 2h5v10H1V2zm7 0h6v10H8V2zM6 2h2v10H6V2z" opacity=".3"/>
                <path d="M1 2h5v10H1V2zm8 0h5v10H9V2z"/>
                <rect x="6" y="2" width="2" height="10" opacity=".5"/>
              </svg>
            </button>
            <button
              className={`${styles.viewBtn} ${viewMode === 'preview' ? styles.activeView : ''}`}
              onClick={() => setViewMode('preview')}
              title={t.previewMode}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <path d="M1 2h12v10H1V2zm1 1v8h10V3H2z"/>
                <path d="M3 5h8v1H3V5zm0 2h6v1H3V7zm0 2h4v1H3V9z"/>
              </svg>
            </button>
          </div>

          <button
            className={`${styles.iconBtn} ${wallpaperPath ? styles.active : ''}`}
            onClick={() => setWallpaperOpen((v) => !v)}
            title={t.wallpaper}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <rect x="1" y="1" width="12" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.2"/>
              <circle cx="4.5" cy="4.5" r="1.2"/>
              <path d="M1 9.5l3-3 2.5 2.5 2-2 3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <button
            className={styles.langBtn}
            onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
            title={t.language}
          >
            {language === 'zh' ? 'EN' : '中'}
          </button>

          <button
            className={styles.themeBtn}
            onClick={() => setThemeOpen(true)}
            title={t.themeManager}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.2" fill="none"/>
              <path d="M7 2a5 5 0 0 1 0 10V2z"/>
            </svg>
            <span className={styles.themeName}>{activeTheme?.name ?? 'Theme'}</span>
          </button>
        </div>
      </div>

      {themeOpen && <ThemeManager onClose={() => setThemeOpen(false)} />}
      {wallpaperOpen && <WallpaperPanel onClose={() => setWallpaperOpen(false)} />}
    </>
  )
}
