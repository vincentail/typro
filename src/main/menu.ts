import { Menu, BrowserWindow, app, shell, ipcMain } from 'electron'
import { basename } from 'path'
import { getRecentFiles, clearRecentFiles } from './ipc/file'

type Lang = 'zh' | 'en'

const menuStrings = {
  en: {
    file: 'File', new: 'New', open: 'Open...', openFolder: 'Open Folder...', save: 'Save', saveAs: 'Save As...',
    openRecent: 'Open Recent', noRecentFiles: 'No Recent Files', clearRecent: 'Clear Recent Files',
    exportHtml: 'Export as HTML', exportPdf: 'Export as PDF', print: 'Print...',
    edit: 'Edit', find: 'Find',
    view: 'View', sourceMode: 'Source Mode', splitView: 'Split View', previewMode: 'Preview Mode',
    toggleSidebar: 'Toggle Sidebar', toggleToolbar: 'Toggle Toolbar', focusMode: 'Focus Mode',
    format: 'Format', bold: 'Bold', italic: 'Italic', strikethrough: 'Strikethrough',
    inlineCode: 'Inline Code', insertLink: 'Insert Link', insertImage: 'Insert Image',
    heading1: 'Heading 1', heading2: 'Heading 2', heading3: 'Heading 3',
    help: 'Help', learnMore: 'Learn More',
  },
  zh: {
    file: '文件', new: '新建', open: '打开...', openFolder: '打开目录...', save: '保存', saveAs: '另存为...',
    openRecent: '最近文件', noRecentFiles: '无最近文件', clearRecent: '清除最近文件',
    exportHtml: '导出为 HTML', exportPdf: '导出为 PDF', print: '打印...',
    edit: '编辑', find: '查找',
    view: '视图', sourceMode: '源码模式', splitView: '分栏视图', previewMode: '预览模式',
    toggleSidebar: '切换侧边栏', toggleToolbar: '切换工具栏', focusMode: '专注模式',
    format: '格式', bold: '粗体', italic: '斜体', strikethrough: '删除线',
    inlineCode: '行内代码', insertLink: '插入链接', insertImage: '插入图片',
    heading1: '标题 1', heading2: '标题 2', heading3: '标题 3',
    help: '帮助', learnMore: '了解更多',
  },
}

// Resolve the target window at call time so stale BrowserWindow references
// captured in menu-item closures never cause "Object has been destroyed" crashes.
function send(channel: string, ...args: unknown[]): void {
  const w = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
  if (w && !w.isDestroyed()) w.webContents.send(channel, ...args)
}

function buildRecentSubmenu(
  win: BrowserWindow,
  s: typeof menuStrings['en'],
  lang: Lang
): Electron.MenuItemConstructorOptions[] {
  const recent = getRecentFiles()
  if (recent.length === 0) {
    return [{ label: s.noRecentFiles, enabled: false }]
  }
  return [
    ...recent.map((filePath) => ({
      label: basename(filePath),
      sublabel: filePath,
      click: () => send('menu:openRecent', filePath)
    })),
    { type: 'separator' as const },
    {
      label: s.clearRecent,
      click: () => {
        clearRecentFiles()
        setupMenu(win, lang)
        send('menu:recentCleared')
      }
    }
  ]
}

export function setupMenu(win: BrowserWindow, lang: Lang = 'zh'): void {
  const isMac = process.platform === 'darwin'
  const s = menuStrings[lang]

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
      label: s.file,
      submenu: [
        {
          label: s.new,
          accelerator: 'CmdOrCtrl+N',
          click: () => send('menu:new')
        },
        {
          label: s.open,
          accelerator: 'CmdOrCtrl+O',
          click: () => send('menu:open')
        },
        {
          label: s.openFolder,
          accelerator: 'CmdOrCtrl+Shift+O',
          click: () => send('menu:openDir')
        },
        {
          label: s.openRecent,
          submenu: buildRecentSubmenu(win, s, lang)
        },
        { type: 'separator' },
        {
          label: s.save,
          accelerator: 'CmdOrCtrl+S',
          click: () => send('menu:save')
        },
        {
          label: s.saveAs,
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => send('menu:saveAs')
        },
        { type: 'separator' },
        {
          label: s.exportHtml,
          click: () => send('menu:exportHtml')
        },
        {
          label: s.exportPdf,
          click: () => send('menu:exportPdf')
        },
        {
          label: s.print,
          accelerator: 'CmdOrCtrl+P',
          click: () => send('menu:print')
        },
        { type: 'separator' },
        isMac ? { role: 'close' as const } : { role: 'quit' as const }
      ]
    },
    {
      label: s.edit,
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
          label: s.find,
          accelerator: 'CmdOrCtrl+F',
          click: () => send('menu:find')
        }
      ]
    },
    {
      label: s.view,
      submenu: [
        {
          label: s.sourceMode,
          accelerator: 'CmdOrCtrl+Alt+S',
          click: () => send('menu:viewMode', 'source')
        },
        {
          label: s.splitView,
          accelerator: 'CmdOrCtrl+Alt+V',
          click: () => send('menu:viewMode', 'split')
        },
        {
          label: s.previewMode,
          accelerator: 'CmdOrCtrl+Alt+P',
          click: () => send('menu:viewMode', 'preview')
        },
        { type: 'separator' },
        {
          label: s.toggleSidebar,
          accelerator: 'CmdOrCtrl+Shift+L',
          click: () => send('menu:toggleSidebar')
        },
        {
          label: s.toggleToolbar,
          accelerator: 'CmdOrCtrl+Shift+T',
          click: () => send('menu:toggleToolbar')
        },
        {
          label: s.focusMode,
          accelerator: 'F8',
          click: () => send('menu:focusMode')
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
      label: s.format,
      submenu: [
        {
          label: s.bold,
          accelerator: 'CmdOrCtrl+B',
          click: () => send('menu:format', 'bold')
        },
        {
          label: s.italic,
          accelerator: 'CmdOrCtrl+I',
          click: () => send('menu:format', 'italic')
        },
        {
          label: s.strikethrough,
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => send('menu:format', 'strikethrough')
        },
        {
          label: s.inlineCode,
          accelerator: 'CmdOrCtrl+`',
          click: () => send('menu:format', 'code')
        },
        { type: 'separator' },
        {
          label: s.insertLink,
          accelerator: 'CmdOrCtrl+K',
          click: () => send('menu:format', 'link')
        },
        {
          label: s.insertImage,
          accelerator: 'CmdOrCtrl+Shift+I',
          click: () => send('menu:format', 'image')
        },
        { type: 'separator' },
        {
          label: s.heading1,
          accelerator: 'CmdOrCtrl+1',
          click: () => send('menu:format', 'h1')
        },
        {
          label: s.heading2,
          accelerator: 'CmdOrCtrl+2',
          click: () => send('menu:format', 'h2')
        },
        {
          label: s.heading3,
          accelerator: 'CmdOrCtrl+3',
          click: () => send('menu:format', 'h3')
        }
      ]
    },
    {
      label: s.help,
      submenu: [
        {
          label: s.learnMore,
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

export function setupMenuIpc(win: BrowserWindow): void {
  ipcMain.on('menu:setLanguage', (_event, lang: Lang) => {
    setupMenu(win, lang)
  })
  ipcMain.on('menu:updateRecent', (_event, lang: Lang) => {
    setupMenu(win, lang)
  })
}
