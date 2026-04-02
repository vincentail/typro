import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useEditorStore } from '../../store/editorStore'
import { useUiStore } from '../../store/uiStore'
import { useT } from '../../locales'
import styles from './FileTree.module.css'

const typro = (window as unknown as { typro: Window['typro'] }).typro

const OPENABLE_EXTS = new Set(['md', 'markdown', 'txt'])

interface FileNode {
  name: string
  path: string
  type: 'file' | 'dir'
  children?: FileNode[]
}

type MenuEntry =
  | { label: string; icon: React.ReactNode; onClick: () => void; danger?: boolean }
  | 'sep'

function ext(name: string) {
  return name.split('.').pop()?.toLowerCase() ?? ''
}

function isOpenable(node: FileNode) {
  return node.type === 'file' && OPENABLE_EXTS.has(ext(node.name))
}

// ── Context menu (portal) ─────────────────────────────────────────────────────
function ContextMenu({
  x,
  y,
  items,
  onClose,
}: {
  x: number
  y: number
  items: MenuEntry[]
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const sepCount = items.filter((i) => i === 'sep').length
  const itemCount = items.length - sepCount
  const estHeight = itemCount * 30 + sepCount * 9 + 10
  const adjX = Math.min(x, window.innerWidth - 172)
  const adjY = Math.min(y, window.innerHeight - estHeight - 8)

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose()
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return createPortal(
    <div
      ref={ref}
      className={styles.contextMenu}
      style={{ left: adjX, top: adjY }}
      onMouseDown={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((item, i) =>
        item === 'sep' ? (
          <div key={i} className={styles.menuSep} />
        ) : (
          <button
            key={i}
            className={`${styles.menuItem} ${item.danger ? styles.menuItemDanger : ''}`}
            onClick={() => { item.onClick(); onClose() }}
          >
            <span className={styles.menuItemIcon}>{item.icon}</span>
            {item.label}
          </button>
        )
      )}
    </div>,
    document.body
  )
}

// ── Inline name input ─────────────────────────────────────────────────────────
function InlineInput({
  icon,
  placeholder,
  onConfirm,
  onCancel,
  depth,
}: {
  icon: React.ReactNode
  placeholder: string
  onConfirm: (name: string) => void
  onCancel: () => void
  depth: number
}) {
  const [val, setVal] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 0)
  }, [])

  return (
    <div className={styles.inlineCreateRow} style={{ paddingLeft: `${6 + depth * 16}px` }}>
      {icon}
      <input
        ref={inputRef}
        className={styles.inlineInput}
        placeholder={placeholder}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); onConfirm(val.trim()) }
          if (e.key === 'Escape') onCancel()
        }}
        onBlur={onCancel}
      />
    </div>
  )
}

// ── Single tree node ──────────────────────────────────────────────────────────
function TreeNode({
  node,
  depth,
  activeFilePath,
  onOpen,
  onRefresh,
}: {
  node: FileNode
  depth: number
  activeFilePath: string | null
  onOpen: (path: string) => void
  onRefresh: () => void
}) {
  const [expanded, setExpanded] = useState(depth < 1)
  const [creating, setCreating] = useState<'file' | 'dir' | null>(null)
  const [renaming, setRenaming] = useState(false)
  const [renameVal, setRenameVal] = useState('')
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null)
  const renameRef = useRef<HTMLInputElement>(null)
  const t = useT()
  const isActive = node.path === activeFilePath
  const openable = isOpenable(node)

  useEffect(() => {
    if (renaming) setTimeout(() => { renameRef.current?.focus(); renameRef.current?.select() }, 0)
  }, [renaming])

  const beginCreate = (type: 'file' | 'dir') => {
    setExpanded(true)
    setCreating(type)
  }

  const confirmCreate = async (name: string, type: 'file' | 'dir') => {
    setCreating(null)
    if (!name) return
    const finalName = type === 'file' && !name.includes('.') ? name + '.md' : name
    if (type === 'file') {
      const newPath = await typro.file.createFile(node.path, finalName)
      onRefresh()
      if (newPath && OPENABLE_EXTS.has(ext(finalName))) onOpen(newPath)
    } else {
      await typro.file.createDir(node.path, finalName)
      onRefresh()
    }
  }

  const beginRename = () => {
    setRenameVal(node.name)
    setRenaming(true)
  }

  const confirmRename = async () => {
    const name = renameVal.trim()
    setRenaming(false)
    if (!name || name === node.name) return
    const newPath = await typro.file.rename(node.path, name)
    if (newPath && node.path === activeFilePath) {
      useEditorStore.setState({ filePath: newPath })
    }
    onRefresh()
  }

  const handleDelete = async () => {
    if (!confirm(t.confirmDelete)) return
    await typro.file.deleteItem(node.path)
    onRefresh()
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCtxMenu({ x: e.clientX, y: e.clientY })
  }

  const dirMenuItems: MenuEntry[] = [
    { label: t.newFile,    icon: <NewFileIcon />,    onClick: () => beginCreate('file') },
    { label: t.newFolder,  icon: <NewFolderIcon />,  onClick: () => beginCreate('dir') },
    'sep',
    { label: t.rename,     icon: <RenameIcon />,     onClick: beginRename },
    { label: t.deleteItem, icon: <DeleteIcon />,     onClick: handleDelete, danger: true },
  ]

  const fileMenuItems: MenuEntry[] = [
    ...(openable ? [{ label: t.openFile, icon: <OpenIcon />, onClick: () => onOpen(node.path) } as MenuEntry] : []),
    ...(openable ? ['sep' as const] : []),
    { label: t.rename,     icon: <RenameIcon />,  onClick: beginRename },
    { label: t.deleteItem, icon: <DeleteIcon />,  onClick: handleDelete, danger: true },
  ]

  const rowActions = (forDir: boolean) => (
    <div className={styles.rowActions} onClick={(e) => e.stopPropagation()}>
      {forDir && (
        <>
          <button className={styles.actionBtn} title={t.newFile}   onClick={() => beginCreate('file')}><NewFileIcon /></button>
          <button className={styles.actionBtn} title={t.newFolder} onClick={() => beginCreate('dir')}><NewFolderIcon /></button>
        </>
      )}
      <button className={styles.actionBtn} title={t.rename}     onClick={(e) => { e.stopPropagation(); beginRename() }}><RenameIcon /></button>
      <button className={styles.actionBtn} title={t.deleteItem} onClick={(e) => { e.stopPropagation(); handleDelete() }}><DeleteIcon /></button>
    </div>
  )

  if (node.type === 'dir') {
    return (
      <div>
        <div
          className={styles.dirRow}
          style={{ paddingLeft: `${6 + depth * 16}px` }}
          onClick={() => !renaming && setExpanded((v) => !v)}
          onContextMenu={handleContextMenu}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' && !renaming) setExpanded((v) => !v) }}
        >
          <ChevronIcon expanded={expanded} />
          <FolderIcon />
          {renaming ? (
            <input
              ref={renameRef}
              className={styles.inlineInput}
              value={renameVal}
              onChange={(e) => setRenameVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); confirmRename() }
                if (e.key === 'Escape') setRenaming(false)
              }}
              onBlur={confirmRename}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className={styles.name}>{node.name}</span>
          )}
          {!renaming && rowActions(true)}
        </div>

        {expanded && (
          <div
            className={styles.children}
            style={{ '--guide-x': `${11 + depth * 16}px` } as React.CSSProperties}
          >
            {creating && (
              <InlineInput
                icon={creating === 'file'
                  ? <><span className={styles.fileIndent} /><FileIcon /></>
                  : <><span className={styles.chevronPlaceholder} /><FolderIcon /></>
                }
                placeholder={creating === 'file' ? t.filenamePlaceholder : t.foldernamePlaceholder}
                depth={depth + 1}
                onConfirm={(name) => confirmCreate(name, creating)}
                onCancel={() => setCreating(null)}
              />
            )}
            {node.children?.map((child) => (
              <TreeNode
                key={child.path}
                node={child}
                depth={depth + 1}
                activeFilePath={activeFilePath}
                onOpen={onOpen}
                onRefresh={onRefresh}
              />
            ))}
          </div>
        )}

        {ctxMenu && (
          <ContextMenu
            x={ctxMenu.x} y={ctxMenu.y}
            items={dirMenuItems}
            onClose={() => setCtxMenu(null)}
          />
        )}
      </div>
    )
  }

  // File row
  return (
    <>
      <div
        className={`${styles.fileRow} ${isActive ? styles.active : ''} ${!openable ? styles.dimmed : ''}`}
        style={{ paddingLeft: `${6 + depth * 16}px` }}
        onClick={() => !renaming && openable && onOpen(node.path)}
        onContextMenu={handleContextMenu}
        role="button"
        tabIndex={openable ? 0 : -1}
      >
        <span className={styles.fileIndent} />
        <FileIcon />
        {renaming ? (
          <input
            ref={renameRef}
            className={styles.inlineInput}
            value={renameVal}
            onChange={(e) => setRenameVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); confirmRename() }
              if (e.key === 'Escape') setRenaming(false)
            }}
            onBlur={confirmRename}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className={styles.name}>{node.name}</span>
        )}
        {!renaming && rowActions(false)}
      </div>

      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x} y={ctxMenu.y}
          items={fileMenuItems}
          onClose={() => setCtxMenu(null)}
        />
      )}
    </>
  )
}

// ── Main FileTree component ───────────────────────────────────────────────────
export function FileTree() {
  const { openDirPath, setOpenDirPath } = useUiStore()
  const { filePath, isDirty, openFile } = useEditorStore()
  const t = useT()

  const [tree, setTree] = useState<FileNode[]>([])
  const [loading, setLoading] = useState(false)
  const [rootCreating, setRootCreating] = useState<'file' | 'dir' | null>(null)
  const [rootCtxMenu, setRootCtxMenu] = useState<{ x: number; y: number } | null>(null)

  const loadTree = useCallback(async (dir: string) => {
    setLoading(true)
    try {
      const nodes = await typro.file.readDir(dir)
      setTree(nodes ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (openDirPath) loadTree(openDirPath)
    else setTree([])
  }, [openDirPath, loadTree])

  const handleOpenDir = async () => {
    const dir = await typro.file.openDir()
    if (dir) setOpenDirPath(dir)
  }

  const handleOpenFile = async (path: string) => {
    if (isDirty && !confirm(t.discardChanges)) return
    const result = await typro.file.openPath(path)
    if (result) openFile(result.path, result.content)
  }

  const handleRootCreate = async (name: string, type: 'file' | 'dir') => {
    setRootCreating(null)
    if (!name || !openDirPath) return
    const finalName = type === 'file' && !name.includes('.') ? name + '.md' : name
    if (type === 'file') {
      const newPath = await typro.file.createFile(openDirPath, finalName)
      loadTree(openDirPath)
      if (newPath && OPENABLE_EXTS.has(ext(finalName))) handleOpenFile(newPath)
    } else {
      await typro.file.createDir(openDirPath, finalName)
      loadTree(openDirPath)
    }
  }

  const handleNodesContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only show root menu when right-clicking on empty space (not on a child node)
    if (e.target !== e.currentTarget) return
    e.preventDefault()
    setRootCtxMenu({ x: e.clientX, y: e.clientY })
  }

  const rootMenuItems: MenuEntry[] = [
    { label: t.newFile,       icon: <NewFileIcon />,   onClick: () => setRootCreating('file') },
    { label: t.newFolder,     icon: <NewFolderIcon />, onClick: () => setRootCreating('dir') },
    'sep',
    { label: t.refreshFolder, icon: <RefreshIcon />,   onClick: () => openDirPath && loadTree(openDirPath) },
  ]

  const dirName = openDirPath ? openDirPath.split(/[\\/]/).pop() : ''

  if (!openDirPath) {
    return (
      <div className={styles.empty}>
        <p>{t.noFolderOpen}</p>
        <p>{t.openFolderHint}</p>
        <button className={styles.openBtn} onClick={handleOpenDir}>
          <FolderIcon />
          {t.openFolder}
        </button>
      </div>
    )
  }

  return (
    <div className={styles.tree}>
      {/* Header */}
      <div className={styles.header}>
        <span className={styles.dirName} title={openDirPath}>{dirName}</span>
        <div className={styles.headerActions}>
          <button className={styles.iconBtn} title={t.newFile}   onClick={() => setRootCreating('file')}><NewFileIcon /></button>
          <button className={styles.iconBtn} title={t.newFolder} onClick={() => setRootCreating('dir')}><NewFolderIcon /></button>
          <div className={styles.headerSep} />
          <button className={styles.iconBtn} onClick={handleOpenDir} title={t.openFolder}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor">
              <path d="M1 2h4l1.5 1.5H12v8H1V2zm0 1.5V11h11V4.5H6L4.5 3H1V3.5z"/>
            </svg>
          </button>
          <button className={styles.iconBtn} onClick={() => setOpenDirPath('')} title={t.closeFolder}>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="currentColor">
              <path d="M1 1l9 9M10 1L1 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Tree */}
      <div className={styles.nodes} onContextMenu={handleNodesContextMenu}>
        {loading ? (
          <div className={styles.loading}>…</div>
        ) : (
          <>
            {rootCreating && (
              <InlineInput
                icon={rootCreating === 'file'
                  ? <><span className={styles.fileIndent} /><FileIcon /></>
                  : <><span className={styles.chevronPlaceholder} /><FolderIcon /></>
                }
                placeholder={rootCreating === 'file' ? t.filenamePlaceholder : t.foldernamePlaceholder}
                depth={0}
                onConfirm={(name) => handleRootCreate(name, rootCreating)}
                onCancel={() => setRootCreating(null)}
              />
            )}
            {tree.map((node) => (
              <TreeNode
                key={node.path}
                node={node}
                depth={0}
                activeFilePath={filePath}
                onOpen={handleOpenFile}
                onRefresh={() => loadTree(openDirPath)}
              />
            ))}
          </>
        )}
      </div>

      {rootCtxMenu && (
        <ContextMenu
          x={rootCtxMenu.x} y={rootCtxMenu.y}
          items={rootMenuItems}
          onClose={() => setRootCtxMenu(null)}
        />
      )}
    </div>
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, transition: 'transform 0.15s', transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', opacity: 0.55 }}
    >
      <polyline points="3,2 7,5 3,8" />
    </svg>
  )
}

function FolderIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style={{ flexShrink: 0, opacity: 0.7 }}>
      <path d="M1.5 3a1 1 0 011-1H6l1.5 2H13.5a1 1 0 011 1v7a1 1 0 01-1 1h-11a1 1 0 01-1-1V3z"/>
    </svg>
  )
}

function FileIcon() {
  return (
    <svg width="13" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.5 }}
    >
      <path d="M4 2h6l4 4v9a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z"/>
      <polyline points="10,2 10,6 14,6"/>
    </svg>
  )
}

function NewFileIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M4 2h6l4 4v9a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z"/>
      <polyline points="10,2 10,6 14,6"/>
      <line x1="7" y1="11" x2="11" y2="11"/>
      <line x1="9" y1="9"  x2="9"  y2="13"/>
    </svg>
  )
}

function NewFolderIcon() {
  return (
    <svg width="14" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M1.5 4a1 1 0 011-1H6l1.5 2H13.5a1 1 0 011 1v5"/>
      <line x1="11" y1="11" x2="15" y2="11"/>
      <line x1="13" y1="9"  x2="13" y2="13"/>
    </svg>
  )
}

function OpenIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M6 3H3a1 1 0 00-1 1v9a1 1 0 001 1h10a1 1 0 001-1V9"/>
      <path d="M10 2h4v4"/>
      <line x1="14" y1="2" x2="7" y2="9"/>
    </svg>
  )
}

function RenameIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M11 2l3 3-8 8H3v-3l8-8z"/>
    </svg>
  )
}

function DeleteIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round"
    >
      <polyline points="3,4 13,4"/>
      <path d="M6 4V3a1 1 0 011-1h2a1 1 0 011 1v1"/>
      <path d="M5 4l1 9h4l1-9"/>
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M13.5 8A5.5 5.5 0 112.5 5"/>
      <polyline points="2,2 2,5.5 5.5,5.5"/>
    </svg>
  )
}
