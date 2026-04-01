import { useEffect } from 'react'
import { AppShell } from './components/layout/AppShell'
import { useUiStore } from './store/uiStore'
import { useEditorStore } from './store/editorStore'
import { initShiki } from './lib/markdown/shiki'

const typro = (window as unknown as { typro: Window['typro'] }).typro

export default function App() {
  const { theme, setTheme, setViewMode, toggleSidebar, toggleFocusMode } = useUiStore()
  const { content, filePath, isDirty, openFile, newFile, setDirty } = useEditorStore()

  // Apply theme to document
  useEffect(() => {
    const themeMap: Record<string, string> = {
      light: 'light',
      dark: 'dark',
      'solarized-light': 'solarized-light',
      'solarized-dark': 'solarized-dark',
      dracula: 'dracula'
    }
    document.documentElement.setAttribute('data-theme', themeMap[theme] || 'light')
  }, [theme])

  // Init shiki on mount
  useEffect(() => {
    const shikiTheme =
      theme === 'dark' || theme === 'solarized-dark' || theme === 'dracula'
        ? 'github-dark'
        : 'github-light'
    initShiki(shikiTheme)
  }, [theme])

  // Listen to native theme changes
  useEffect(() => {
    if (!typro?.theme?.onChanged) return
    const unsubscribe = typro.theme.onChanged((nativeTheme: string) => {
      setTheme(nativeTheme === 'dark' ? 'dark' : 'light')
    })
    return unsubscribe
  }, [setTheme])

  // Menu event handlers
  useEffect(() => {
    if (!typro?.menu) return

    const unsubs = [
      typro.menu.onNew(() => {
        if (isDirty && !confirm('Discard unsaved changes?')) return
        newFile()
      }),
      typro.menu.onOpen(async () => {
        if (isDirty && !confirm('Discard unsaved changes?')) return
        const result = await typro.file.open()
        if (result) openFile(result.path, result.content)
      }),
      typro.menu.onSave(async () => {
        if (!filePath) {
          const result = await typro.file.saveAs(content)
          if (result) {
            useEditorStore.setState({ filePath: result.path, isDirty: false })
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
        }
      }),
      typro.menu.onViewMode((mode: string) => {
        setViewMode(mode as 'source' | 'split' | 'preview')
      }),
      typro.menu.onToggleSidebar(() => toggleSidebar()),
      typro.menu.onFocusMode(() => toggleFocusMode()),
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
        await typro.file.exportPdf(filePath || 'document.md')
      })
    ]

    return () => unsubs.forEach((fn) => fn && fn())
  }, [content, filePath, isDirty, openFile, newFile, setDirty, setViewMode, toggleSidebar, toggleFocusMode])

  // Window title
  useEffect(() => {
    const name = filePath ? filePath.split('/').pop() : 'Untitled'
    document.title = `${isDirty ? '• ' : ''}${name} — Typro`
  }, [filePath, isDirty])

  return <AppShell />
}
