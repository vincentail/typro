export {}

declare global {
  interface Window {
    typro: {
      file: {
        open: () => Promise<{ path: string; content: string } | null>
        openPath: (filePath: string) => Promise<{ path: string; content: string } | null>
        save: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>
        saveAs: (content: string) => Promise<{ path: string } | null>
        getRecent: () => Promise<string[]>
        clearRecent: () => Promise<void>
        exportHtml: (html: string, defaultName: string) => Promise<{ path: string } | null>
        exportPdf: (html: string, defaultName: string) => Promise<{ path: string } | null>
        print: (html: string) => Promise<boolean>
        exportLog: (rendererLog: string) => Promise<{ path: string } | null>
      }
      settings: {
        get: () => Promise<Record<string, unknown>>
        set: (key: string, value: unknown) => Promise<void>
      }
      theme: {
        getNative: () => Promise<string>
        onChanged: (callback: (theme: string) => void) => () => void
      }
      window: {
        minimize: () => void
        maximize: () => void
        close: () => void
        isMaximized: () => Promise<boolean>
        openDevTools: () => void
        closeDevTools: () => void
      }
      menu: {
        onNew: (callback: () => void) => () => void
        onOpen: (callback: () => void) => () => void
        onSave: (callback: () => void) => () => void
        onSaveAs: (callback: () => void) => () => void
        onFind: (callback: () => void) => () => void
        onViewMode: (callback: (mode: string) => void) => () => void
        onToggleSidebar: (callback: () => void) => () => void
        onFocusMode: (callback: () => void) => () => void
        onFormat: (callback: (format: string) => void) => () => void
        onExportHtml: (callback: () => void) => () => void
        onExportPdf: (callback: () => void) => () => void
        onToggleToolbar: (callback: () => void) => () => void
        onPrint: (callback: () => void) => () => void
        onToggleDevMode: (callback: () => void) => () => void
        onExportLog: (callback: () => void) => () => void
        setLanguage: (lang: string) => void
        updateRecent: (lang: string) => void
        onOpenDir: (callback: () => void) => () => void
        onOpenRecent: (callback: (filePath: string) => void) => () => void
        onRecentCleared: (callback: () => void) => () => void
      }
    }
    os: {
      onOpenFile: (callback: (filePath: string) => void) => () => void
    }
  }
}
