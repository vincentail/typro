import { useState, useRef } from 'react'
import { useThemeStore } from '../../store/themeStore'
import { useT } from '../../locales'
import { BUILTIN_THEMES, CURATED_THEMES, ThemeDefinition, ThemeVars } from '../../lib/themes/registry'
import styles from './ThemeManager.module.css'

interface Props {
  onClose: () => void
}

type Tab = 'installed' | 'browse' | 'import'

// ── colour preview swatch ────────────────────────────────────────────────────
function ThemePreview({ vars }: { vars: ThemeVars }) {
  return (
    <div className={styles.preview} style={{ background: vars['--bg-primary'] }}>
      <div className={styles.previewTitlebar} style={{ background: vars['--bg-titlebar'], borderBottom: `1px solid ${vars['--border-color']}` }} />
      <div className={styles.previewBody}>
        <div className={styles.previewSidebar} style={{ background: vars['--bg-sidebar'] }} />
        <div className={styles.previewContent}>
          <div className={styles.previewLine} style={{ background: vars['--text-primary'], opacity: 0.8, width: '70%' }} />
          <div className={styles.previewLine} style={{ background: vars['--text-secondary'], opacity: 0.6, width: '50%' }} />
          <div className={styles.previewLine} style={{ background: vars['--accent-color'], opacity: 0.8, width: '40%' }} />
          <div className={styles.previewLine} style={{ background: vars['--text-muted'], opacity: 0.5, width: '60%' }} />
        </div>
      </div>
    </div>
  )
}

// ── single theme card ────────────────────────────────────────────────────────
function ThemeCard({
  theme,
  active,
  installed,
  onSelect,
  onInstall,
  onUninstall
}: {
  theme: ThemeDefinition
  active: boolean
  installed: boolean
  onSelect: () => void
  onInstall?: () => void
  onUninstall?: () => void
}) {
  const t = useT()
  return (
    <div
      className={`${styles.card} ${active ? styles.activeCard : ''}`}
      onClick={installed ? onSelect : undefined}
    >
      <ThemePreview vars={theme.variables} />
      <div className={styles.cardInfo}>
        <div className={styles.cardName}>
          {theme.name}
          <span className={`${styles.badge} ${theme.isDark ? styles.dark : styles.light}`}>
            {theme.isDark ? t.dark : t.light}
          </span>
        </div>
        <div className={styles.cardDesc}>{theme.description}</div>
        {theme.author && <div className={styles.cardAuthor}>by {theme.author}</div>}
      </div>
      <div className={styles.cardActions}>
        {active && <span className={styles.activeLabel}>{t.activeLabel}</span>}
        {installed && !active && (
          <button className={styles.applyBtn} onClick={onSelect}>{t.apply}</button>
        )}
        {installed && !theme.builtin && (
          <button className={styles.removeBtn} onClick={(e) => { e.stopPropagation(); onUninstall?.() }}>{t.remove}</button>
        )}
        {!installed && (
          <button className={styles.installBtn} onClick={(e) => { e.stopPropagation(); onInstall?.() }}>{t.install}</button>
        )}
      </div>
    </div>
  )
}

// ── import tab ───────────────────────────────────────────────────────────────
function ImportTab({ onImported }: { onImported: (theme: ThemeDefinition) => void }) {
  const [jsonText, setJsonText] = useState('')
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const t = useT()

  const REQUIRED_VARS: (keyof ThemeVars)[] = [
    '--bg-primary', '--bg-secondary', '--bg-sidebar', '--bg-titlebar',
    '--text-primary', '--text-secondary', '--text-muted', '--border-color',
    '--accent-color', '--accent-hover', '--selection-bg', '--scrollbar-thumb'
  ]

  function validate(obj: unknown): ThemeDefinition {
    if (typeof obj !== 'object' || obj === null) throw new Error('Must be a JSON object')
    const t = obj as Record<string, unknown>
    if (!t.id || typeof t.id !== 'string') throw new Error('Missing field: id (string)')
    if (!t.name || typeof t.name !== 'string') throw new Error('Missing field: name (string)')
    if (typeof t.isDark !== 'boolean') throw new Error('Missing field: isDark (boolean)')
    if (typeof t.variables !== 'object' || t.variables === null) throw new Error('Missing field: variables (object)')
    const vars = t.variables as Record<string, string>
    for (const key of REQUIRED_VARS) {
      if (!vars[key]) throw new Error(`Missing variable: ${key}`)
    }
    return {
      id: `custom-${t.id}`,
      name: t.name as string,
      description: (t.description as string) || '',
      author: t.author as string | undefined,
      isDark: t.isDark as boolean,
      variables: vars as unknown as ThemeVars
    }
  }

  function handleImport() {
    setError('')
    try {
      const parsed = JSON.parse(jsonText)
      const theme = validate(parsed)
      onImported(theme)
      setJsonText('')
    } catch (e) {
      setError((e as Error).message)
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setJsonText(ev.target?.result as string)
    reader.readAsText(file)
    e.target.value = ''
  }

  const example = JSON.stringify({
    id: 'my-theme',
    name: 'My Custom Theme',
    description: 'A theme I made',
    author: 'Me',
    isDark: true,
    variables: {
      '--bg-primary': '#1a1a2e',
      '--bg-secondary': '#16213e',
      '--bg-sidebar': '#16213e',
      '--bg-titlebar': '#0f3460',
      '--text-primary': '#e0e0e0',
      '--text-secondary': '#a0a0b0',
      '--text-muted': '#606080',
      '--border-color': '#0f3460',
      '--accent-color': '#e94560',
      '--accent-hover': '#c73652',
      '--selection-bg': '#0f3460',
      '--scrollbar-thumb': '#0f3460'
    }
  }, null, 2)

  return (
    <div className={styles.importTab}>
      <p className={styles.importHint}>{t.importHint}</p>
      <div className={styles.importActions}>
        <button className={styles.fileBtn} onClick={() => fileRef.current?.click()}>
          {t.loadFromFile}
        </button>
        <input ref={fileRef} type="file" accept=".json" hidden onChange={handleFile} />
      </div>
      <textarea
        className={styles.jsonArea}
        value={jsonText}
        onChange={(e) => setJsonText(e.target.value)}
        placeholder={example}
        spellCheck={false}
      />
      {error && <div className={styles.importError}>{error}</div>}
      <button className={styles.importBtn} onClick={handleImport} disabled={!jsonText.trim()}>
        {t.importTheme}
      </button>

      <div className={styles.schemaBox}>
        <div className={styles.schemaTitle}>{t.requiredFields}</div>
        <code className={styles.schema}>
          id, name, isDark, variables: &#123; {REQUIRED_VARS.join(', ')} &#125;
        </code>
      </div>
    </div>
  )
}

// ── main modal ───────────────────────────────────────────────────────────────
export function ThemeManager({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('installed')
  const [search, setSearch] = useState('')
  const t = useT()
  const {
    activeThemeId,
    installedCuratedIds,
    customThemes,
    setActiveTheme,
    installCurated,
    uninstallTheme,
    addCustomTheme,
    getAllInstalled
  } = useThemeStore()

  const allInstalled = getAllInstalled()

  const browseList = CURATED_THEMES.filter((theme) => {
    if (installedCuratedIds.includes(theme.id)) return false
    if (!search) return true
    return (
      theme.name.toLowerCase().includes(search.toLowerCase()) ||
      theme.description.toLowerCase().includes(search.toLowerCase()) ||
      (theme.author ?? '').toLowerCase().includes(search.toLowerCase())
    )
  })

  const installedSearch = search
    ? allInstalled.filter(
        (theme) =>
          theme.name.toLowerCase().includes(search.toLowerCase()) ||
          (theme.author ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : allInstalled

  function handleInstall(id: string) {
    installCurated(id)
    setActiveTheme(id)
    setTab('installed')
  }

  function handleImported(theme: ThemeDefinition) {
    addCustomTheme(theme)
    setActiveTheme(theme.id)
    setTab('installed')
  }

  const isCustom = (id: string) => customThemes.some((theme) => theme.id === id)
  const isInstalled = (id: string) =>
    BUILTIN_THEMES.some((theme) => theme.id === id) ||
    installedCuratedIds.includes(id) ||
    isCustom(id)

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>{t.themeManagerTitle}</h2>
          <button className={styles.closeBtn} onClick={onClose} title="Close">✕</button>
        </div>

        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab === 'installed' ? styles.activeTab : ''}`} onClick={() => setTab('installed')}>
            {t.installed} ({allInstalled.length})
          </button>
          <button className={`${styles.tab} ${tab === 'browse' ? styles.activeTab : ''}`} onClick={() => setTab('browse')}>
            {t.browse} ({CURATED_THEMES.length - installedCuratedIds.length})
          </button>
          <button className={`${styles.tab} ${tab === 'import' ? styles.activeTab : ''}`} onClick={() => setTab('import')}>
            {t.importTab}
          </button>

          {(tab === 'installed' || tab === 'browse') && (
            <input
              className={styles.search}
              type="search"
              placeholder={t.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          )}
        </div>

        <div className={styles.body}>
          {tab === 'installed' && (
            <div className={styles.grid}>
              {installedSearch.map((theme) => (
                <ThemeCard
                  key={theme.id}
                  theme={theme}
                  active={theme.id === activeThemeId}
                  installed={true}
                  onSelect={() => setActiveTheme(theme.id)}
                  onUninstall={() => uninstallTheme(theme.id)}
                />
              ))}
              {installedSearch.length === 0 && (
                <div className={styles.empty}>{t.noThemeMatch}</div>
              )}
            </div>
          )}

          {tab === 'browse' && (
            <div className={styles.grid}>
              {browseList.map((theme) => (
                <ThemeCard
                  key={theme.id}
                  theme={theme}
                  active={theme.id === activeThemeId}
                  installed={isInstalled(theme.id)}
                  onSelect={() => setActiveTheme(theme.id)}
                  onInstall={() => handleInstall(theme.id)}
                />
              ))}
              {browseList.length === 0 && (
                <div className={styles.empty}>
                  {search ? t.noThemeMatch : t.allInstalled}
                </div>
              )}
            </div>
          )}

          {tab === 'import' && <ImportTab onImported={handleImported} />}
        </div>
      </div>
    </div>
  )
}
