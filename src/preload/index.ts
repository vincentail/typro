import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const typro = {
  file: {
    open: () => ipcRenderer.invoke('file:open'),
    openPath: (filePath: string) => ipcRenderer.invoke('file:openPath', filePath),
    save: (filePath: string, content: string) =>
      ipcRenderer.invoke('file:save', filePath, content),
    saveAs: (content: string) => ipcRenderer.invoke('file:saveAs', content),
    getRecent: () => ipcRenderer.invoke('file:getRecent'),
    clearRecent: () => ipcRenderer.invoke('file:clearRecent'),
    exportHtml: (html: string, defaultName: string) =>
      ipcRenderer.invoke('file:exportHtml', html, defaultName),
    exportPdf: (html: string, defaultName: string) => ipcRenderer.invoke('file:exportPdf', html, defaultName),
    openImage: () => ipcRenderer.invoke('file:openImage')
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    set: (key: string, value: unknown) => ipcRenderer.invoke('settings:set', key, value)
  },
  theme: {
    getNative: () => ipcRenderer.invoke('theme:getNative'),
    onChanged: (callback: (theme: string) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, theme: string) => callback(theme)
      ipcRenderer.on('theme:changed', handler)
      return () => ipcRenderer.removeListener('theme:changed', handler)
    }
  },
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized')
  },
  menu: {
    onNew: (callback: () => void) => {
      ipcRenderer.on('menu:new', callback)
      return () => ipcRenderer.removeListener('menu:new', callback)
    },
    onOpen: (callback: () => void) => {
      ipcRenderer.on('menu:open', callback)
      return () => ipcRenderer.removeListener('menu:open', callback)
    },
    onSave: (callback: () => void) => {
      ipcRenderer.on('menu:save', callback)
      return () => ipcRenderer.removeListener('menu:save', callback)
    },
    onSaveAs: (callback: () => void) => {
      ipcRenderer.on('menu:saveAs', callback)
      return () => ipcRenderer.removeListener('menu:saveAs', callback)
    },
    onFind: (callback: () => void) => {
      ipcRenderer.on('menu:find', callback)
      return () => ipcRenderer.removeListener('menu:find', callback)
    },
    onViewMode: (callback: (mode: string) => void) => {
      const handler = (_e: Electron.IpcRendererEvent, mode: string) => callback(mode)
      ipcRenderer.on('menu:viewMode', handler)
      return () => ipcRenderer.removeListener('menu:viewMode', handler)
    },
    onToggleSidebar: (callback: () => void) => {
      ipcRenderer.on('menu:toggleSidebar', callback)
      return () => ipcRenderer.removeListener('menu:toggleSidebar', callback)
    },
    onFocusMode: (callback: () => void) => {
      ipcRenderer.on('menu:focusMode', callback)
      return () => ipcRenderer.removeListener('menu:focusMode', callback)
    },
    onFormat: (callback: (format: string) => void) => {
      const handler = (_e: Electron.IpcRendererEvent, format: string) => callback(format)
      ipcRenderer.on('menu:format', handler)
      return () => ipcRenderer.removeListener('menu:format', handler)
    },
    onExportHtml: (callback: () => void) => {
      ipcRenderer.on('menu:exportHtml', callback)
      return () => ipcRenderer.removeListener('menu:exportHtml', callback)
    },
    onExportPdf: (callback: () => void) => {
      ipcRenderer.on('menu:exportPdf', callback)
      return () => ipcRenderer.removeListener('menu:exportPdf', callback)
    },
    onToggleToolbar: (callback: () => void) => {
      ipcRenderer.on('menu:toggleToolbar', callback)
      return () => ipcRenderer.removeListener('menu:toggleToolbar', callback)
    },
    setLanguage: (lang: string) => ipcRenderer.send('menu:setLanguage', lang)
  },
  os: {
    onOpenFile: (callback: (filePath: string) => void) => {
      const handler = (_e: Electron.IpcRendererEvent, filePath: string) => callback(filePath)
      ipcRenderer.on('file:openFromOS', handler)
      return () => ipcRenderer.removeListener('file:openFromOS', handler)
    }
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('typro', typro)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.typro = typro
}
