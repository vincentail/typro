import { ipcMain, BrowserWindow } from 'electron'

export function registerWindowHandlers(win: BrowserWindow): void {
  ipcMain.on('window:minimize', () => win.minimize())
  ipcMain.on('window:maximize', () => {
    if (win.isMaximized()) win.unmaximize()
    else win.maximize()
  })
  ipcMain.on('window:close', () => win.close())
  ipcMain.handle('window:isMaximized', () => win.isMaximized())
}
