import { app, BrowserWindow, shell, nativeTheme, protocol } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { registerFileHandlers } from './ipc/file'
import { registerWindowHandlers } from './ipc/window'
import { registerThemeHandlers } from './ipc/theme'
import { setupMenu } from './menu'
import log from 'electron-log'
import path from 'path'
import fs from 'fs'

log.initialize()
log.info('App starting...')

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 600,
    minHeight: 400,
    show: false,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden',
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: '#ffffff',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true
    }
  })

  win.on('ready-to-show', () => {
    win.show()
  })

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return win
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.typro.app')

  // Register typro:// protocol for local images
  protocol.registerFileProtocol('typro', (request, callback) => {
    const url = request.url.replace('typro://', '')
    const filePath = decodeURIComponent(url)
    callback({ path: filePath })
  })

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  const win = createWindow()
  setupMenu(win)
  registerFileHandlers(win)
  registerWindowHandlers(win)
  registerThemeHandlers(win)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      const newWin = createWindow()
      setupMenu(newWin)
      registerFileHandlers(newWin)
      registerWindowHandlers(newWin)
      registerThemeHandlers(newWin)
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
