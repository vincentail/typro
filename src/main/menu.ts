import { Menu, BrowserWindow, app, shell } from 'electron'

export function setupMenu(win: BrowserWindow): void {
  const isMac = process.platform === 'darwin'

  const template: Electron.MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' as const },
              { type: 'separator' as const },
              { role: 'services' as const },
              { type: 'separator' as const },
              { role: 'hide' as const },
              { role: 'hideOthers' as const },
              { role: 'unhide' as const },
              { type: 'separator' as const },
              { role: 'quit' as const }
            ]
          }
        ]
      : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'New',
          accelerator: 'CmdOrCtrl+N',
          click: () => win.webContents.send('menu:new')
        },
        {
          label: 'Open...',
          accelerator: 'CmdOrCtrl+O',
          click: () => win.webContents.send('menu:open')
        },
        { type: 'separator' },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => win.webContents.send('menu:save')
        },
        {
          label: 'Save As...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => win.webContents.send('menu:saveAs')
        },
        { type: 'separator' },
        {
          label: 'Export as HTML',
          click: () => win.webContents.send('menu:exportHtml')
        },
        {
          label: 'Export as PDF',
          click: () => win.webContents.send('menu:exportPdf')
        },
        { type: 'separator' },
        isMac ? { role: 'close' as const } : { role: 'quit' as const }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' as const },
        { role: 'redo' as const },
        { type: 'separator' as const },
        { role: 'cut' as const },
        { role: 'copy' as const },
        { role: 'paste' as const },
        { role: 'selectAll' as const },
        { type: 'separator' as const },
        {
          label: 'Find',
          accelerator: 'CmdOrCtrl+F',
          click: () => win.webContents.send('menu:find')
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Source Mode',
          accelerator: 'CmdOrCtrl+Alt+S',
          click: () => win.webContents.send('menu:viewMode', 'source')
        },
        {
          label: 'Split View',
          accelerator: 'CmdOrCtrl+Alt+V',
          click: () => win.webContents.send('menu:viewMode', 'split')
        },
        {
          label: 'Preview Mode',
          accelerator: 'CmdOrCtrl+Alt+P',
          click: () => win.webContents.send('menu:viewMode', 'preview')
        },
        { type: 'separator' },
        {
          label: 'Toggle Sidebar',
          accelerator: 'CmdOrCtrl+Shift+L',
          click: () => win.webContents.send('menu:toggleSidebar')
        },
        {
          label: 'Toggle Toolbar',
          accelerator: 'CmdOrCtrl+Shift+T',
          click: () => win.webContents.send('menu:toggleToolbar')
        },
        {
          label: 'Focus Mode',
          accelerator: 'F8',
          click: () => win.webContents.send('menu:focusMode')
        },
        { type: 'separator' },
        { role: 'reload' as const },
        { role: 'toggleDevTools' as const },
        { type: 'separator' as const },
        { role: 'resetZoom' as const },
        { role: 'zoomIn' as const },
        { role: 'zoomOut' as const },
        { type: 'separator' as const },
        { role: 'togglefullscreen' as const }
      ]
    },
    {
      label: 'Format',
      submenu: [
        {
          label: 'Bold',
          accelerator: 'CmdOrCtrl+B',
          click: () => win.webContents.send('menu:format', 'bold')
        },
        {
          label: 'Italic',
          accelerator: 'CmdOrCtrl+I',
          click: () => win.webContents.send('menu:format', 'italic')
        },
        {
          label: 'Strikethrough',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => win.webContents.send('menu:format', 'strikethrough')
        },
        {
          label: 'Inline Code',
          accelerator: 'CmdOrCtrl+`',
          click: () => win.webContents.send('menu:format', 'code')
        },
        { type: 'separator' },
        {
          label: 'Insert Link',
          accelerator: 'CmdOrCtrl+K',
          click: () => win.webContents.send('menu:format', 'link')
        },
        {
          label: 'Insert Image',
          accelerator: 'CmdOrCtrl+Shift+I',
          click: () => win.webContents.send('menu:format', 'image')
        },
        { type: 'separator' },
        {
          label: 'Heading 1',
          accelerator: 'CmdOrCtrl+1',
          click: () => win.webContents.send('menu:format', 'h1')
        },
        {
          label: 'Heading 2',
          accelerator: 'CmdOrCtrl+2',
          click: () => win.webContents.send('menu:format', 'h2')
        },
        {
          label: 'Heading 3',
          accelerator: 'CmdOrCtrl+3',
          click: () => win.webContents.send('menu:format', 'h3')
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Learn More',
          click: async () => {
            await shell.openExternal('https://github.com')
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}
