import { useEffect, useState } from 'react'
import { useT } from '../../locales'
import styles from './PluginManager.module.css'

const typro = (window as unknown as { typro: Window['typro'] }).typro

const SAMPLE_PLUGIN = `module.exports = {
  id: 'my-plugin',
  name: 'My Plugin',
  version: '1.0.0',
  description: 'Example plugin',
  setup(api) {
    // Extend the markdown renderer
    api.registerMarkdownPlugin(function(md) {
      // Example: wrap ==text== in <mark>
      md.inline.ruler.before('escape', 'mark', function(state, silent) {
        if (state.src.slice(state.pos, state.pos + 2) !== '==') return false
        const end = state.src.indexOf('==', state.pos + 2)
        if (end === -1) return false
        if (!silent) {
          const token = state.push('html_inline', '', 0)
          token.content = '<mark>' + state.src.slice(state.pos + 2, end) + '</mark>'
        }
        state.pos = end + 2
        return true
      })
    })
    // Inject custom styles
    api.injectCSS('mark { background: #ffe066; padding: 0 2px; border-radius: 2px; }')
  }
}`

export function PluginManager() {
  const t = useT()
  const [plugins, setPlugins] = useState<PluginMeta[]>([])
  const [needsReload, setNeedsReload] = useState(false)
  const [installing, setInstalling] = useState(false)
  const [showSample, setShowSample] = useState(false)

  useEffect(() => {
    typro.plugin.list().then(setPlugins)
  }, [])

  async function handleInstall() {
    setInstalling(true)
    try {
      const meta = await typro.plugin.install()
      if (meta) {
        setPlugins((prev) => {
          const idx = prev.findIndex((p) => p.id === meta.id)
          if (idx >= 0) { const next = [...prev]; next[idx] = meta; return next }
          return [...prev, meta]
        })
        setNeedsReload(true)
      }
    } finally {
      setInstalling(false)
    }
  }

  async function handleToggle(id: string, enabled: boolean) {
    await typro.plugin.setEnabled(id, enabled)
    setPlugins((prev) => prev.map((p) => (p.id === id ? { ...p, enabled } : p)))
    setNeedsReload(true)
  }

  async function handleUninstall(id: string) {
    const plugin = plugins.find((p) => p.id === id)
    if (!plugin) return
    if (!confirm(t.pluginConfirmUninstall.replace('{name}', plugin.name))) return
    await typro.plugin.uninstall(id)
    setPlugins((prev) => prev.filter((p) => p.id !== id))
    setNeedsReload(true)
  }

  return (
    <div className={styles.manager}>
      <div className={styles.header}>
        <button className={styles.installBtn} onClick={handleInstall} disabled={installing}>
          {installing ? t.pluginInstalling : t.pluginInstall}
        </button>
        <button
          className={styles.helpBtn}
          onClick={() => setShowSample((v) => !v)}
          title={t.pluginSampleTooltip}
        >
          ?
        </button>
      </div>

      {showSample && (
        <div className={styles.sampleBox}>
          <div className={styles.sampleLabel}>{t.pluginSampleLabel}</div>
          <pre className={styles.sampleCode}>{SAMPLE_PLUGIN}</pre>
        </div>
      )}

      {needsReload && (
        <div className={styles.reloadBanner}>
          <span>{t.pluginReloadHint}</span>
          <button className={styles.reloadBtn} onClick={() => window.location.reload()}>
            {t.pluginReload}
          </button>
        </div>
      )}

      {plugins.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyTitle}>{t.pluginNoPlugins}</div>
          <div className={styles.emptyHint}>{t.pluginInstallHint}</div>
        </div>
      ) : (
        <ul className={styles.list}>
          {plugins.map((p) => (
            <li key={p.id} className={`${styles.item} ${p.enabled ? '' : styles.itemDisabled}`}>
              <div className={styles.itemHeader}>
                <span className={styles.itemName}>{p.name}</span>
                <span className={styles.itemVersion}>v{p.version}</span>
              </div>
              {p.description && <div className={styles.itemDesc}>{p.description}</div>}
              <div className={styles.itemActions}>
                <label className={styles.toggle} title={p.enabled ? t.pluginDisable : t.pluginEnable}>
                  <input
                    type="checkbox"
                    checked={p.enabled}
                    onChange={(e) => handleToggle(p.id, e.target.checked)}
                  />
                  <span className={styles.toggleTrack}>
                    <span className={styles.toggleThumb} />
                  </span>
                  <span className={styles.toggleLabel}>
                    {p.enabled ? t.pluginEnabled : t.pluginDisabled}
                  </span>
                </label>
                <button
                  className={styles.uninstallBtn}
                  onClick={() => handleUninstall(p.id)}
                  title={t.pluginUninstall}
                >
                  {t.pluginUninstall}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
