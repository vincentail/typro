import type MarkdownIt from 'markdown-it'
import { registerMarkdownPlugin } from './markdown/parser'
import { usePluginStore } from '../store/pluginStore'

export interface PluginAPI {
  /** Register a markdown-it plugin function applied to the shared md instance */
  registerMarkdownPlugin: (fn: (md: MarkdownIt) => void) => void
  /** Inject a <style> block scoped to this plugin (idempotent) */
  injectCSS: (css: string) => void
}

export interface TyproPlugin {
  id: string
  name: string
  version?: string
  description?: string
  setup: (api: PluginAPI) => void | Promise<void>
}

const injectedStyles = new Map<string, HTMLStyleElement>()

function injectCSS(pluginId: string, css: string): void {
  const key = `typro-plugin-${pluginId}`
  let el = injectedStyles.get(key)
  if (!el) {
    el = document.createElement('style')
    el.id = key
    document.head.appendChild(el)
    injectedStyles.set(key, el)
  }
  el.textContent = css
}

function makeAPI(pluginId: string): PluginAPI {
  return {
    registerMarkdownPlugin: (fn) => registerMarkdownPlugin(fn),
    injectCSS: (css) => injectCSS(pluginId, css)
  }
}

function evalPlugin(code: string): TyproPlugin | null {
  try {
    // Support module.exports = { ... } style
    const fn = new Function('module', 'exports', code)
    const mod: { exports: Partial<TyproPlugin> } = { exports: {} }
    fn(mod, mod.exports)
    const p = mod.exports as TyproPlugin
    if (typeof p?.setup !== 'function') {
      console.warn('[PluginLoader] Plugin missing setup() function')
      return null
    }
    return p
  } catch (e) {
    console.error('[PluginLoader] Syntax/eval error:', e)
    return null
  }
}

const typro = (window as unknown as { typro: Window['typro'] }).typro

export async function initPlugins(): Promise<void> {
  const metas = await typro.plugin.list()
  let loaded = 0

  for (const meta of metas) {
    if (!meta.enabled) continue
    const code = await typro.plugin.getCode(meta.id)
    if (!code) { console.warn(`[PluginLoader] No code for "${meta.id}"`); continue }

    const plugin = evalPlugin(code)
    if (!plugin) { console.warn(`[PluginLoader] Failed to eval "${meta.id}"`); continue }

    try {
      await plugin.setup(makeAPI(meta.id))
      loaded++
      console.info(`[PluginLoader] Loaded: ${meta.name} v${meta.version}`)
    } catch (e) {
      console.error(`[PluginLoader] setup() error in "${meta.name}":`, e)
    }
  }

  if (loaded > 0) {
    // Bump revision so MarkdownPreview useMemo re-runs with the new md instance
    usePluginStore.getState().bump()
  }
}
