import { ipcMain, nativeTheme, BrowserWindow } from 'electron'

export function registerThemeHandlers(): void {
  ipcMain.handle('theme:getNative', () => {
    return nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
  })

  nativeTheme.on('updated', () => {
    const theme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send('theme:changed', theme)
    })
  })
}
