import { app, BrowserWindow, shell, protocol } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { registerFileHandlers } from './ipc/file'
import { registerWindowHandlers } from './ipc/window'
import { registerThemeHandlers } from './ipc/theme'
import { setupMenu, setupMenuIpc } from './menu'
import log from 'electron-log'
import fs from 'fs'

log.initialize()
log.info('App starting...')

// --- File-open queue ---------------------------------------------------------
// macOS fires open-file before app is ready; Windows/Linux pass path via argv.
// We buffer the path here and flush it once the renderer is ready.

let pendingFilePath: string | null = null

function isMarkdownFile(filePath: string): boolean {
  return /\.(md|markdown|txt)$/i.test(filePath)
}

function openFileInWindow(win: BrowserWindow, filePath: string): void {
  if (!fs.existsSync(filePath)) return
  log.info('Opening file:', filePath)
  win.webContents.send('file:openFromOS', filePath)
}

// macOS: right-click "Open With" or double-click registered file
app.on('open-file', (event, filePath) => {
  event.preventDefault()
  if (!isMarkdownFile(filePath)) return
  const wins = BrowserWindow.getAllWindows()
  if (wins.length > 0) {
    openFileInWindow(wins[0], filePath)
  } else {
    pendingFilePath = filePath
  }
})

// Windows / Linux: single-instance lock so second launch sends path here
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, argv) => {
    // argv on Windows/Linux: [..., filePath]
    const filePath = argv.find((a) => isMarkdownFile(a))
    const wins = BrowserWindow.getAllWindows()
    if (filePath && wins.length > 0) {
      if (wins[0].isMinimized()) wins[0].restore()
      wins[0].focus()
      openFileInWindow(wins[0], filePath)
    }
  })
}

// -----------------------------------------------------------------------------

// Resolve icon path that works in both dev and packaged app
function getIconPath(): string {
  if (app.isPackaged) {
    // extraResources copies icon.png to Contents/Resources/ (outside asar)
    return join(process.resourcesPath, 'icon.png')
  }
  // Dev: __dirname = out/main/, resources/ is at project root (two levels up)
  return join(__dirname, '../../resources/icon.png')
}

function createWindow(): BrowserWindow {
  const iconPath = getIconPath()
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 600,
    minHeight: 400,
    show: false,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden',
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: '#ffffff',
    // Windows / Linux: set window & taskbar icon explicitly
    ...(process.platform !== 'darwin' ? { icon: iconPath } : {}),
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
    // Flush any file path that arrived before the window was ready
    if (pendingFilePath) {
      openFileInWindow(win, pendingFilePath)
      pendingFilePath = null
    }
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

  protocol.registerFileProtocol('typro', (request, callback) => {
    const filePath = decodeURIComponent(request.url.replace('typro://', ''))
    callback({ path: filePath })
  })

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // macOS Dock icon (works in both dev and packaged)
  if (process.platform === 'darwin') {
    try {
      app.dock.setIcon(getIconPath())
    } catch (e) {
      log.warn('dock.setIcon failed:', e)
    }
  }

  // Register IPC handlers once — they are global, not per-window
  registerFileHandlers()
  registerWindowHandlers()
  registerThemeHandlers()

  const win = createWindow()
  setupMenu(win)
  setupMenuIpc(win)

  // Windows / Linux: handle file path passed as CLI argument on first launch
  const argvFile = process.argv.find((a) => isMarkdownFile(a))
  if (argvFile) pendingFilePath = argvFile

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      const newWin = createWindow()
      setupMenu(newWin)
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
