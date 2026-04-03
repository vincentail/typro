import { useEffect } from 'react'
import { AppShell } from './components/layout/AppShell'
import { useUiStore } from './store/uiStore'
import { useEditorStore } from './store/editorStore'
import { useThemeStore } from './store/themeStore'
import { BUILTIN_THEMES, ALL_CURATED } from './lib/themes/registry'
import { initShiki } from './lib/markdown/shiki'
import { useT } from './locales'

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function toTyproUrl(filePath: string): string {
  return 'typro://' + filePath.replace(/\\/g, '/').replace(/[\s"'()]/g, encodeURIComponent)
}

const typro = (window as unknown as { typro: Window['typro'] }).typro

const BUILTIN_IDS = new Set(BUILTIN_THEMES.map((t) => t.id))

export default function App() {
  const { theme, setTheme, setViewMode, toggleSidebar, toggleFocusMode, toggleToolbar, language, wallpaperPath, bgOpacity, customBgColors, setOpenDirPath, autoSave, autoSaveInterval } = useUiStore()
  const { content, filePath, isDirty, openFile, newFile, setDirty } = useEditorStore()
  const { activeThemeId, customThemes, setActiveTheme } = useThemeStore()
  const t = useT()

  // Keep uiStore.theme in sync with themeStore.activeThemeId (single source of truth)
  useEffect(() => {
    setTheme(activeThemeId)
  }, [activeThemeId, setTheme])

  // Apply theme: builtin themes use global CSS; others get injected <style>
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)

    const styleId = 'typro-custom-theme'
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null

    if (BUILTIN_IDS.has(theme)) {
      // Remove any injected custom style
      styleEl?.remove()
      return
    }

    // Find theme definition (curated or custom)
    const def =
      ALL_CURATED.find((t) => t.id === theme) ||
      customThemes.find((t) => t.id === theme)

    if (!def) return

    const cssVars = Object.entries(def.variables)
      .map(([k, v]) => `  ${k}: ${v};`)
      .join('\n')

    const css = `[data-theme='${theme}'] {\n${cssVars}\n}`

    if (!styleEl) {
      styleEl = document.createElement('style')
      styleEl.id = styleId
      document.head.appendChild(styleEl)
    }
    styleEl.textContent = css
  }, [theme, customThemes])

  // Init shiki on mount — use isDark from theme definition when available
  useEffect(() => {
    const def =
      ALL_CURATED.find((t) => t.id === theme) ||
      customThemes.find((t) => t.id === theme)
    const shikiTheme = def?.isDark ? 'github-dark' : 'github-light'
    initShiki(shikiTheme)
  }, [theme, customThemes])

  // Listen to native theme changes
  useEffect(() => {
    if (!typro?.theme?.onChanged) return
    const unsubscribe = typro.theme.onChanged((nativeTheme: string) => {
      setActiveTheme(nativeTheme === 'dark' ? 'dark' : 'light')
    })
    return unsubscribe
  }, [setActiveTheme])

  // Menu event handlers
  useEffect(() => {
    if (!typro?.menu) return

    const unsubs = [
      typro.menu.onNew(() => {
        if (isDirty && !confirm(t.discardChanges)) return
        newFile()
      }),
      typro.menu.onOpen(async () => {
        if (isDirty && !confirm(t.discardChanges)) return
        const result = await typro.file.open()
        if (result) { openFile(result.path, result.content); typro.menu.updateRecent(language) }
      }),
      typro.menu.onSave(async () => {
        if (!filePath) {
          const result = await typro.file.saveAs(content)
          if (result) {
            useEditorStore.setState({ filePath: result.path, isDirty: false })
            typro.menu.updateRecent(language)
          }
        } else {
          await typro.file.save(filePath, content)
          setDirty(false)
        }
      }),
      typro.menu.onSaveAs(async () => {
        const result = await typro.file.saveAs(content)
        if (result) {
          useEditorStore.setState({ filePath: result.path, isDirty: false })
          typro.menu.updateRecent(language)
        }
      }),
      typro.menu.onOpenRecent(async (recentPath: string) => {
        if (isDirty && !confirm(t.discardChanges)) return
        const result = await typro.file.openPath(recentPath)
        if (result) { openFile(result.path, result.content); typro.menu.updateRecent(language) }
      }),
      typro.menu.onRecentCleared(() => {
        useEditorStore.getState().bumpRecentVersion()
      }),
      typro.menu.onViewMode((mode: string) => {
        setViewMode(mode as 'source' | 'split' | 'preview')
      }),
      typro.menu.onOpenDir(async () => {
        const dir = await typro.file.openDir()
        if (dir) setOpenDirPath(dir)
      }),
      typro.menu.onToggleSidebar(() => toggleSidebar()),
      typro.menu.onFocusMode(() => toggleFocusMode()),
      typro.menu.onToggleToolbar(() => toggleToolbar()),
      typro.menu.onExportHtml(async () => {
        const { renderMarkdown } = await import('./lib/markdown/parser')
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${filePath ? filePath.split('/').pop() : 'document'}</title>
<style>
  body { font-family: -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; }
</style>
</head>
<body>
${renderMarkdown(content)}
</body>
</html>`
        await typro.file.exportHtml(html, filePath || 'document.md')
      }),
      typro.menu.onExportPdf(async () => {
        const { renderMarkdown } = await import('./lib/markdown/parser')
        const { getPdfPreviewCss } = await import('./lib/themes/pdf-styles')
        const { getActiveTheme } = useThemeStore.getState()
        const activeDef = getActiveTheme()

        // Build :root CSS vars from active theme (fallback to light values)
        const themeVars = activeDef
          ? Object.entries(activeDef.variables)
              .map(([k, v]) => `  ${k}: ${v};`)
              .join('\n')
          : ''

        const docTitle = filePath ? filePath.split('/').pop()!.replace(/\.md$/, '') : 'document'

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${docTitle}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
<style>
:root {
${themeVars}
}
${getPdfPreviewCss()}
</style>
</head>
<body>
<div class="preview">
${renderMarkdown(content)}
</div>
</body>
</html>`

        await typro.file.exportPdf(html, filePath || 'document.md')
      }),

      typro.menu.onPrint(async () => {
        const { renderMarkdown } = await import('./lib/markdown/parser')
        const { getPdfPreviewCss } = await import('./lib/themes/pdf-styles')
        const { getActiveTheme } = useThemeStore.getState()
        const activeDef = getActiveTheme()

        const themeVars = activeDef
          ? Object.entries(activeDef.variables)
              .map(([k, v]) => `  ${k}: ${v};`)
              .join('\n')
          : ''

        const docTitle = filePath ? filePath.split('/').pop()!.replace(/\.md$/, '') : 'document'

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${docTitle}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
<style>
:root {
${themeVars}
}
${getPdfPreviewCss()}
</style>
</head>
<body>
<div class="preview">
${renderMarkdown(content)}
</div>
</body>
</html>`

        await typro.file.print(html)
      })
    ]

    return () => unsubs.forEach((fn) => fn && fn())
  }, [content, filePath, isDirty, openFile, newFile, setDirty, setViewMode, toggleSidebar, toggleFocusMode, setOpenDirPath])

  // Wallpaper + background opacity + custom bg colors
  useEffect(() => {
    const styleId = 'typro-wallpaper'
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null

    const themeDef =
      ALL_CURATED.find((t) => t.id === theme) ||
      customThemes.find((t) => t.id === theme)

    const hasWallpaper = !!wallpaperPath
    const hasCustomColors = Object.keys(customBgColors).length > 0

    if (!hasWallpaper && !hasCustomColors) {
      styleEl?.remove()
      return
    }

    if (!styleEl) {
      styleEl = document.createElement('style')
      styleEl.id = styleId
      document.head.appendChild(styleEl)
    }

    // Effective bg colors: custom overrides > theme definition
    const vars = themeDef?.variables
    const effective = {
      '--bg-primary':   customBgColors['--bg-primary']   || vars?.['--bg-primary']   || '#ffffff',
      '--bg-secondary': customBgColors['--bg-secondary'] || vars?.['--bg-secondary'] || '#f8f9fa',
      '--bg-sidebar':   customBgColors['--bg-sidebar']   || vars?.['--bg-sidebar']   || '#f0f0f0',
      '--bg-titlebar':  customBgColors['--bg-titlebar']  || vars?.['--bg-titlebar']  || '#f5f5f5',
    }

    const bgOverrides = hasWallpaper
      ? `  --bg-primary:   ${hexToRgba(effective['--bg-primary'],   bgOpacity)};
          --bg-secondary: ${hexToRgba(effective['--bg-secondary'], bgOpacity)};
          --bg-sidebar:   ${hexToRgba(effective['--bg-sidebar'],   bgOpacity)};
          --bg-titlebar:  ${hexToRgba(effective['--bg-titlebar'],  bgOpacity)};`
      : `  --bg-primary:   ${effective['--bg-primary']};
          --bg-secondary: ${effective['--bg-secondary']};
          --bg-sidebar:   ${effective['--bg-sidebar']};
          --bg-titlebar:  ${effective['--bg-titlebar']};`

    const wallpaperCss = hasWallpaper ? `
      html {
        background-image: url("${toTyproUrl(wallpaperPath)}");
        background-size: cover;
        background-position: center;
        background-attachment: fixed;
      }
      html, body, #root { background-color: transparent !important; }` : ''

    styleEl.textContent = `
      ${wallpaperCss}
      :root, [data-theme='${theme}'] {
        ${bgOverrides}
      }
    `
  }, [wallpaperPath, bgOpacity, theme, customThemes, customBgColors])

  // Auto-save
  useEffect(() => {
    if (!autoSave) return
    const id = setInterval(async () => {
      const { filePath, content, isDirty } = useEditorStore.getState()
      if (!filePath || !isDirty) return
      await typro.file.save(filePath, content)
      useEditorStore.setState({ isDirty: false })
    }, autoSaveInterval * 1000)
    return () => clearInterval(id)
  }, [autoSave, autoSaveInterval])

  // Sync language to Electron menu
  useEffect(() => {
    typro?.menu?.setLanguage?.(language)
  }, [language])

  // Open file from OS (right-click "Open With" / double-click / CLI argument)
  useEffect(() => {
    if (!typro?.os?.onOpenFile) return
    const unsubscribe = typro.os.onOpenFile(async (filePath: string) => {
      if (isDirty && !confirm(t.discardChanges)) return
      const result = await typro.file.openPath(filePath)
      if (result) { openFile(result.path, result.content); typro.menu.updateRecent(language) }
    })
    return unsubscribe
  }, [isDirty, openFile])

  // Window title
  useEffect(() => {
    const name = filePath ? filePath.split('/').pop() : t.untitled
    document.title = `${isDirty ? '• ' : ''}${name} — Typro`
  }, [filePath, isDirty, t.untitled])

  return <AppShell />
}
