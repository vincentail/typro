import { ipcMain, nativeTheme, BrowserWindow } from 'electron'

export function registerThemeHandlers(win: BrowserWindow): void {
  ipcMain.handle('theme:getNative', () => {
    return nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
  })

  nativeTheme.on('updated', () => {
    const theme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
    win.webContents.send('theme:changed', theme)
  })
}
