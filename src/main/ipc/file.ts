import { ipcMain, dialog, BrowserWindow, app } from 'electron'
import fs from 'fs/promises'
import path from 'path'
import Store from 'electron-store'

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

function addToRecentFiles(filePath: string): void {
  const recent: string[] = store.get('recentFiles', [])
  const filtered = recent.filter((f) => f !== filePath)
  filtered.unshift(filePath)
  store.set('recentFiles', filtered.slice(0, 10))
}

export function registerFileHandlers(win: BrowserWindow): void {
  ipcMain.handle('file:open', async () => {
    const { filePaths, canceled } = await dialog.showOpenDialog(win, {
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
    } catch (err) {
      return null
    }
  })

  ipcMain.handle('file:openPath', async (_event, filePath: string) => {
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      addToRecentFiles(filePath)
      return { path: filePath, content }
    } catch (err) {
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
    const { filePath, canceled } = await dialog.showSaveDialog(win, {
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
    } catch (err) {
      return null
    }
  })

  ipcMain.handle('file:getRecent', () => {
    return store.get('recentFiles', [])
  })

  ipcMain.handle('file:clearRecent', () => {
    store.set('recentFiles', [])
  })

  ipcMain.handle('settings:get', () => {
    return store.store
  })

  ipcMain.handle('settings:set', (_event, key: string, value: unknown) => {
    store.set(key as keyof StoreSchema, value as StoreSchema[keyof StoreSchema])
  })

  ipcMain.handle('file:exportHtml', async (_event, html: string, defaultName: string) => {
    const { filePath, canceled } = await dialog.showSaveDialog(win, {
      title: 'Export as HTML',
      defaultPath: defaultName.replace(/\.md$/, '.html'),
      filters: [{ name: 'HTML', extensions: ['html'] }]
    })
    if (canceled || !filePath) return null
    try {
      await fs.writeFile(filePath, html, 'utf-8')
      return { path: filePath }
    } catch (err) {
      return null
    }
  })

  ipcMain.handle('file:exportPdf', async (_event, defaultName: string) => {
    const { filePath, canceled } = await dialog.showSaveDialog(win, {
      title: 'Export as PDF',
      defaultPath: defaultName.replace(/\.md$/, '.pdf'),
      filters: [{ name: 'PDF', extensions: ['pdf'] }]
    })
    if (canceled || !filePath) return null
    try {
      const pdfBuffer = await win.webContents.printToPDF({
        printBackground: true,
        pageSize: 'A4'
      })
      await fs.writeFile(filePath, pdfBuffer)
      return { path: filePath }
    } catch (err) {
      return null
    }
  })
}
