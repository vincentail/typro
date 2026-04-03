import { ipcMain, dialog, BrowserWindow, app } from 'electron'
import fs from 'fs/promises'
import { join, basename } from 'path'
import Store from 'electron-store'

export interface PluginMeta {
  id: string
  name: string
  version: string
  description: string
  enabled: boolean
  fileName: string
  installedAt: string
}

interface PluginStoreSchema {
  plugins: PluginMeta[]
}

const store = new Store<PluginStoreSchema>({
  name: 'plugins',
  defaults: { plugins: [] }
})

function pluginsDir(): string {
  return join(app.getPath('userData'), 'plugins')
}

function getWin(): BrowserWindow {
  return BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
}

function extractMeta(code: string, fileName: string): PluginMeta {
  const get = (key: string) =>
    code.match(new RegExp(`['"]${key}['"]\\s*:\\s*['"]([^'"]+)['"]`))?.[1] ?? ''
  const id = get('id') || fileName.replace(/\.js$/, '')
  return {
    id,
    name: get('name') || id,
    version: get('version') || '1.0.0',
    description: get('description') || '',
    enabled: true,
    fileName,
    installedAt: new Date().toISOString()
  }
}

export function registerPluginHandlers(): void {
  ipcMain.handle('plugin:list', () => store.get('plugins'))

  ipcMain.handle('plugin:install', async () => {
    await fs.mkdir(pluginsDir(), { recursive: true })
    const { filePaths, canceled } = await dialog.showOpenDialog(getWin(), {
      title: 'Install Plugin',
      filters: [{ name: 'JavaScript Plugin', extensions: ['js'] }],
      properties: ['openFile']
    })
    if (canceled || !filePaths[0]) return null

    const srcPath = filePaths[0]
    const fileName = basename(srcPath)
    const code = await fs.readFile(srcPath, 'utf-8')
    await fs.copyFile(srcPath, join(pluginsDir(), fileName))

    const meta = extractMeta(code, fileName)
    const plugins = store.get('plugins')
    const idx = plugins.findIndex((p) => p.id === meta.id || p.fileName === fileName)
    if (idx >= 0) plugins[idx] = meta
    else plugins.push(meta)
    store.set('plugins', plugins)
    return meta
  })

  ipcMain.handle('plugin:uninstall', async (_e, id: string) => {
    const plugins = store.get('plugins')
    const meta = plugins.find((p) => p.id === id)
    if (!meta) return false
    try { await fs.unlink(join(pluginsDir(), meta.fileName)) } catch { /* already gone */ }
    store.set('plugins', plugins.filter((p) => p.id !== id))
    return true
  })

  ipcMain.handle('plugin:setEnabled', (_e, id: string, enabled: boolean) => {
    const plugins = store.get('plugins')
    const meta = plugins.find((p) => p.id === id)
    if (meta) { meta.enabled = enabled; store.set('plugins', plugins) }
    return true
  })

  ipcMain.handle('plugin:getCode', async (_e, id: string) => {
    const plugins = store.get('plugins')
    const meta = plugins.find((p) => p.id === id)
    if (!meta) return null
    try { return await fs.readFile(join(pluginsDir(), meta.fileName), 'utf-8') }
    catch { return null }
  })
}
