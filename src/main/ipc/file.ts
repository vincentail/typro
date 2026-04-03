import { ipcMain, dialog, BrowserWindow, app } from 'electron'
import fs from 'fs/promises'
import { join, dirname } from 'path'
import Store from 'electron-store'
import log from 'electron-log'

interface StoreSchema {
  recentFiles: string[]
  windowBounds: { x?: number; y?: number; width: number; height: number }
}

const store = new Store<StoreSchema>({
  defaults: {
    recentFiles: [],
    windowBounds: { width: 1200, height: 800 }
  }
})

function getWin(): BrowserWindow {
  return BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
}

export function getRecentFiles(): string[] {
  return store.get('recentFiles', [])
}

export function clearRecentFiles(): void {
  store.set('recentFiles', [])
}

function addToRecentFiles(filePath: string): void {
  const recent: string[] = store.get('recentFiles', [])
  const filtered = recent.filter((f) => f !== filePath)
  filtered.unshift(filePath)
  store.set('recentFiles', filtered.slice(0, 10))
}

export function registerFileHandlers(): void {
  ipcMain.handle('file:open', async () => {
    const { filePaths, canceled } = await dialog.showOpenDialog(getWin(), {
      title: 'Open Markdown File',
      properties: ['openFile'],
      filters: [
        { name: 'Markdown', extensions: ['md', 'markdown', 'txt'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })
    if (canceled || !filePaths[0]) return null
    try {
      const content = await fs.readFile(filePaths[0], 'utf-8')
      addToRecentFiles(filePaths[0])
      return { path: filePaths[0], content }
    } catch {
      return null
    }
  })

  ipcMain.handle('file:openPath', async (_event, filePath: string) => {
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      addToRecentFiles(filePath)
      return { path: filePath, content }
    } catch {
      return null
    }
  })

  ipcMain.handle('file:save', async (_event, filePath: string, content: string) => {
    try {
      await fs.writeFile(filePath, content, 'utf-8')
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('file:saveAs', async (_event, content: string) => {
    const { filePath, canceled } = await dialog.showSaveDialog(getWin(), {
      title: 'Save Markdown File',
      defaultPath: 'untitled.md',
      filters: [
        { name: 'Markdown', extensions: ['md', 'markdown'] },
        { name: 'Text', extensions: ['txt'] }
      ]
    })
    if (canceled || !filePath) return null
    try {
      await fs.writeFile(filePath, content, 'utf-8')
      addToRecentFiles(filePath)
      return { path: filePath }
    } catch {
      return null
    }
  })

  ipcMain.handle('file:getRecent', () => store.get('recentFiles', []))

  ipcMain.handle('file:clearRecent', () => store.set('recentFiles', []))

  ipcMain.handle('settings:get', () => store.store)

  ipcMain.handle('settings:set', (_event, key: string, value: unknown) => {
    store.set(key as keyof StoreSchema, value as StoreSchema[keyof StoreSchema])
  })

  ipcMain.handle('file:exportHtml', async (_event, html: string, defaultName: string) => {
    const { filePath, canceled } = await dialog.showSaveDialog(getWin(), {
      title: 'Export as HTML',
      defaultPath: defaultName.replace(/\.md$/, '.html'),
      filters: [{ name: 'HTML', extensions: ['html'] }]
    })
    if (canceled || !filePath) return null
    try {
      await fs.writeFile(filePath, html, 'utf-8')
      return { path: filePath }
    } catch {
      return null
    }
  })

  ipcMain.handle('file:openDir', async () => {
    const { filePaths, canceled } = await dialog.showOpenDialog(getWin(), {
      title: 'Open Folder',
      properties: ['openDirectory']
    })
    if (canceled || !filePaths[0]) return null
    return filePaths[0]
  })

  ipcMain.handle('file:readDir', async (_event, dirPath: string) => {
    interface FileNode {
      name: string
      path: string
      type: 'file' | 'dir'
      children?: FileNode[]
    }

    async function readDir(dir: string, depth: number): Promise<FileNode[]> {
      if (depth > 8) return []
      let entries
      try {
        entries = await fs.readdir(dir, { withFileTypes: true })
      } catch {
        return []
      }
      const nodes: FileNode[] = []
      for (const entry of entries) {
        if (entry.name.startsWith('.')) continue
        const fullPath = join(dir, entry.name)
        if (entry.isDirectory()) {
          const children = await readDir(fullPath, depth + 1)
          nodes.push({ name: entry.name, path: fullPath, type: 'dir', children })
        } else {
          nodes.push({ name: entry.name, path: fullPath, type: 'file' })
        }
      }
      return nodes.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'dir' ? -1 : 1
        return a.name.localeCompare(b.name)
      })
    }

    return readDir(dirPath, 0)
  })

  ipcMain.handle('file:createFile', async (_event, dirPath: string, name: string) => {
    const fullPath = join(dirPath, name)
    try {
      await fs.writeFile(fullPath, '', { flag: 'wx' })
      return fullPath
    } catch {
      return null
    }
  })

  ipcMain.handle('file:createDir', async (_event, dirPath: string, name: string) => {
    const fullPath = join(dirPath, name)
    try {
      await fs.mkdir(fullPath)
      return fullPath
    } catch {
      return null
    }
  })

  ipcMain.handle('file:rename', async (_event, oldPath: string, newName: string) => {
    const newPath = join(dirname(oldPath), newName)
    try {
      await fs.rename(oldPath, newPath)
      return newPath
    } catch {
      return null
    }
  })

  ipcMain.handle('file:deleteItem', async (_event, itemPath: string) => {
    try {
      await fs.rm(itemPath, { recursive: true, force: true })
      return true
    } catch {
      return false
    }
  })

  ipcMain.handle('file:openImage', async () => {
    const { filePaths, canceled } = await dialog.showOpenDialog(getWin(), {
      title: 'Select Wallpaper Image',
      properties: ['openFile'],
      filters: [
        { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })
    if (canceled || !filePaths[0]) return null
    return filePaths[0]
  })

  ipcMain.handle('file:exportLog', async (_event, rendererLog: string) => {
    // Read the electron-log main-process log file
    let mainLog = ''
    try {
      const logFile = log.transports.file.getFile()
      mainLog = await fs.readFile(logFile.path, 'utf-8')
    } catch {
      mainLog = '(main process log not available)'
    }

    const combined =
      `=== MAIN PROCESS LOG ===\n${mainLog}\n\n` +
      `${rendererLog}`

    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const { filePath, canceled } = await dialog.showSaveDialog(getWin(), {
      title: 'Export Log',
      defaultPath: `typro-log-${ts}.log`,
      filters: [
        { name: 'Log Files', extensions: ['log', 'txt'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })
    if (canceled || !filePath) return null
    try {
      await fs.writeFile(filePath, combined, 'utf-8')
      return { path: filePath }
    } catch {
      return null
    }
  })

  ipcMain.handle('file:print', async (_event, html: string) => {
    const tmpPath = join(app.getPath('temp'), `typro-print-${Date.now()}.html`)
    await fs.writeFile(tmpPath, html, 'utf-8')

    const printWin = new BrowserWindow({
      width: 900,
      height: 700,
      show: false,
      title: 'Print Preview',
      webPreferences: { nodeIntegration: false, contextIsolation: true }
    })

    try {
      await printWin.loadFile(tmpPath)
      // Wait for web fonts / CDN stylesheets to load
      await new Promise((r) => setTimeout(r, 800))
      // Must show the window so macOS can attach the print sheet to it
      printWin.show()
      await new Promise<void>((resolve) => {
        printWin.webContents.print({ silent: false, printBackground: true }, () => resolve())
      })
      return true
    } catch {
      return false
    } finally {
      if (!printWin.isDestroyed()) printWin.destroy()
      fs.unlink(tmpPath).catch(() => {})
    }
  })

  ipcMain.handle('file:exportPdf', async (_event, html: string, defaultName: string) => {
    const win = getWin()
    const { filePath, canceled } = await dialog.showSaveDialog(win, {
      title: 'Export as PDF',
      defaultPath: defaultName.replace(/\.md$/, '.pdf'),
      filters: [{ name: 'PDF', extensions: ['pdf'] }]
    })
    if (canceled || !filePath) return null

    // Write HTML to a temp file so the hidden window can load it with a
    // file:// URL (avoids data-URL length limits and allows CDN resource loads)
    const tmpPath = join(app.getPath('temp'), `typro-pdf-${Date.now()}.html`)
    await fs.writeFile(tmpPath, html, 'utf-8')

    const printWin = new BrowserWindow({
      show: false,
      webPreferences: { nodeIntegration: false, contextIsolation: true }
    })

    try {
      await printWin.loadFile(tmpPath)
      // Allow a short delay for web fonts / CDN stylesheets to finish loading
      await new Promise((r) => setTimeout(r, 800))
      const pdfBuffer = await printWin.webContents.printToPDF({
        printBackground: true,
        pageSize: 'A4',
        margins: { marginType: 'default' }
      })
      await fs.writeFile(filePath, pdfBuffer)
      return { path: filePath }
    } catch {
      return null
    } finally {
      printWin.destroy()
      fs.unlink(tmpPath).catch(() => {})
    }
  })
}
