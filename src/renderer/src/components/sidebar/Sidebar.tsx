import { useState } from 'react'
import { EditorView } from '@codemirror/view'
import { TableOfContents } from './TableOfContents'
import { RecentFiles } from './RecentFiles'
import { FileTree } from './FileTree'
import { PluginManager } from '../plugins/PluginManager'
import { useUiStore } from '../../store/uiStore'
import { useT } from '../../locales'
import styles from './Sidebar.module.css'

interface Props {
  editorView: EditorView | null
}

type Tab = 'toc' | 'files' | 'plugins'

export function Sidebar({ editorView }: Props) {
  const [tab, setTab] = useState<Tab>('files')
  const t = useT()
  const { openDirPath } = useUiStore()

  return (
    <div className={styles.sidebar}>
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'files' ? styles.active : ''}`}
          onClick={() => setTab('files')}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <path d="M2 1h6l3 3v9H2V1zm5 0v4h4"/>
          </svg>
          {t.files}
        </button>
        <button
          className={`${styles.tab} ${tab === 'toc' ? styles.active : ''}`}
          onClick={() => setTab('toc')}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <path d="M1 2h12v1H1V2zm2 3h10v1H3V5zm0 3h10v1H3V8zm0 3h6v1H3v-1z"/>
          </svg>
          {t.contents}
        </button>
        <button
          className={`${styles.tab} ${tab === 'plugins' ? styles.active : ''}`}
          onClick={() => setTab('plugins')}
          title={t.plugins}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M6.5 1a1 1 0 0 0-1 1v.5H4a1.5 1.5 0 0 0-1.5 1.5v1H2a1 1 0 0 0 0 2h.5V8H2a1 1 0 0 0 0 2h.5v1A1.5 1.5 0 0 0 4 12.5h1v.5a1 1 0 0 0 2 0v-.5h1v.5a1 1 0 0 0 2 0v-.5h1A1.5 1.5 0 0 0 12.5 11v-1h.5a1 1 0 0 0 0-2h-.5V7h.5a1 1 0 0 0 0-2h-.5v-1A1.5 1.5 0 0 0 11 2.5h-1V2a1 1 0 0 0-1-1h-1a1 1 0 0 0-1 1v.5H7V2a1 1 0 0 0-1-1h-.5z"/>
          </svg>
          {t.plugins}
        </button>
      </div>
      <div className={styles.content}>
        {tab === 'toc' && <TableOfContents editorView={editorView} />}
        {tab === 'files' && (openDirPath ? <FileTree /> : <RecentFiles />)}
        {tab === 'plugins' && <PluginManager />}
      </div>
    </div>
  )
}
