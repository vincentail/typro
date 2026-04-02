import { useCallback, useEffect, useMemo, useRef } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorView, keymap, ViewUpdate } from '@codemirror/view'
import {
  defaultKeymap,
  historyKeymap,
  indentWithTab
} from '@codemirror/commands'
import { searchKeymap } from '@codemirror/search'
import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  completionKeymap
} from '@codemirror/autocomplete'
import { bracketMatching, foldKeymap } from '@codemirror/language'
import { useEditorStore } from '../../store/editorStore'
import { useUiStore } from '../../store/uiStore'
import { buildMarkdownKeymap } from './keymaps'
import styles from './MarkdownEditor.module.css'

interface Props {
  onViewReady: (view: EditorView) => void
}

const typro = (window as unknown as { typro: Window['typro'] }).typro

const lightTheme = EditorView.theme({
  '&': {
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    height: '100%',
    fontSize: 'var(--cm-font-size, 14px)'
  },
  '.cm-content': {
    fontFamily: 'var(--editor-font)',
    padding: '16px 24px',
    lineHeight: 'var(--cm-line-height, 1.7)',
    caretColor: 'var(--accent-color)'
  },
  '.cm-cursor': { borderLeftColor: 'var(--accent-color)' },
  '.cm-gutters': {
    backgroundColor: 'var(--bg-primary)',
    borderRight: '1px solid var(--border-color)',
    color: 'var(--text-muted)'
  },
  '.cm-activeLineGutter': { backgroundColor: 'var(--bg-secondary)' },
  '.cm-activeLine': { backgroundColor: 'var(--bg-secondary)' },
  '.cm-selectionBackground': { backgroundColor: 'var(--selection-bg) !important' },
  '.cm-focused .cm-selectionBackground': { backgroundColor: 'var(--selection-bg)' },
  '.cm-searchMatch': { backgroundColor: '#ffa50055', outline: '1px solid #ffa500' },
  '.cm-searchMatch.cm-searchMatch-selected': { backgroundColor: '#ffa50099' },
  '.cm-scroller': { overflow: 'auto' },
  '.cm-lineNumbers': { minWidth: '40px' }
}, { dark: false })

export function MarkdownEditor({ onViewReady }: Props) {
  const { content, setContent, setCursorPos, setWordCount, filePath, isDirty } = useEditorStore()
  const { theme } = useUiStore()
  const editorViewRef = useRef<EditorView | null>(null)
  const isDark = theme === 'dark' || theme === 'solarized-dark' || theme === 'dracula'

  // Word count debounce
  const wcTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Track cursor on every selection change (click, arrow keys, etc.)
  const cursorExtension = useMemo(
    () => EditorView.updateListener.of((update) => {
      if (!update.selectionSet) return
      const sel = update.state.selection.main
      const line = update.state.doc.lineAt(sel.head)
      setCursorPos({ line: line.number, col: sel.head - line.from + 1 })
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // setCursorPos is a stable zustand action
  )

  const handleChange = useCallback(
    (value: string, _viewUpdate: ViewUpdate) => {
      setContent(value)

      // Debounced word count
      if (wcTimerRef.current) clearTimeout(wcTimerRef.current)
      wcTimerRef.current = setTimeout(() => {
        const words = value.trim() ? value.trim().split(/\s+/).length : 0
        const chars = value.length
        const lines = value.split('\n').length
        setWordCount({ words, chars, lines })
      }, 300)
    },
    [setContent, setWordCount]
  )

  const handleCreateEditor = useCallback(
    (view: EditorView) => {
      editorViewRef.current = view
      onViewReady(view)
    },
    [onViewReady]
  )

  // Handle file drop for images
  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith('image/')
      )
      if (!files.length || !editorViewRef.current) return

      for (const file of files) {
        const reader = new FileReader()
        reader.onload = (ev) => {
          const dataUrl = ev.target?.result as string
          const alt = file.name.replace(/\.[^.]+$/, '')
          const markdownImg = `![${alt}](${dataUrl})\n`
          const view = editorViewRef.current!
          const pos = view.posAtCoords({ x: e.clientX, y: e.clientY }) ?? view.state.doc.length
          view.dispatch({
            changes: { from: pos, insert: markdownImg }
          })
        }
        reader.readAsDataURL(file)
      }
    },
    []
  )

  // Menu format commands
  useEffect(() => {
    if (!typro?.menu?.onFormat) return
    const unsubscribe = typro.menu.onFormat((format: string) => {
      const view = editorViewRef.current
      if (!view) return
      applyFormat(view, format)
    })
    return unsubscribe
  }, [])

  // Keyboard shortcut for find (Cmd+F)
  useEffect(() => {
    if (!typro?.menu?.onFind) return
    const unsubscribe = typro.menu.onFind(() => {
      const view = editorViewRef.current
      if (!view) return
      // Open CM6 search panel
      import('@codemirror/search').then(({ openSearchPanel }) => {
        openSearchPanel(view)
      })
    })
    return unsubscribe
  }, [])

  const extensions = [
    cursorExtension,
    markdown({ base: markdownLanguage, codeLanguages: languages }),
    EditorView.lineWrapping,
    bracketMatching(),
    closeBrackets(),
    autocompletion(),
    keymap.of([
      ...closeBracketsKeymap,
      ...defaultKeymap,
      ...searchKeymap,
      ...historyKeymap,
      ...foldKeymap,
      ...completionKeymap,
      indentWithTab,
      ...buildMarkdownKeymap()
    ])
  ]

  return (
    <div
      className={styles.editorContainer}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <CodeMirror
        value={content}
        height="100%"
        theme={isDark ? oneDark : lightTheme}
        extensions={extensions}
        onChange={handleChange}
        onCreateEditor={handleCreateEditor}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: true,
          highlightSpecialChars: true,
          history: true,
          foldGutter: false,
          drawSelection: true,
          dropCursor: true,
          allowMultipleSelections: true,
          indentOnInput: true,
          syntaxHighlighting: true,
          bracketMatching: false,
          closeBrackets: false,
          autocompletion: false,
          rectangularSelection: true,
          crosshairCursor: false,
          highlightActiveLine: true,
          highlightSelectionMatches: true,
          closeBracketsKeymap: false,
          defaultKeymap: false,
          searchKeymap: false,
          historyKeymap: false,
          foldKeymap: false,
          completionKeymap: false,
          lintKeymap: true
        }}
        style={{ height: '100%' }}
      />
    </div>
  )
}

function applyFormat(view: EditorView, format: string): void {
  const { state } = view
  const sel = state.selection.main
  const selectedText = state.sliceDoc(sel.from, sel.to)

  const wrapMap: Record<string, [string, string]> = {
    bold: ['**', '**'],
    italic: ['*', '*'],
    strikethrough: ['~~', '~~'],
    code: ['`', '`']
  }

  if (wrapMap[format]) {
    const [open, close] = wrapMap[format]
    const insertion = `${open}${selectedText || 'text'}${close}`
    view.dispatch({
      changes: { from: sel.from, to: sel.to, insert: insertion },
      selection: { anchor: sel.from + open.length, head: sel.from + open.length + (selectedText || 'text').length }
    })
    return
  }

  if (format === 'link') {
    const url = 'https://'
    const text = selectedText || 'link text'
    view.dispatch({
      changes: { from: sel.from, to: sel.to, insert: `[${text}](${url})` },
      selection: { anchor: sel.from + 1, head: sel.from + 1 + text.length }
    })
    return
  }

  if (format === 'image') {
    view.dispatch({
      changes: { from: sel.from, to: sel.to, insert: `![${selectedText || 'alt text'}](url)` }
    })
    return
  }

  const headingMap: Record<string, string> = { h1: '# ', h2: '## ', h3: '### ' }
  if (headingMap[format]) {
    const line = state.doc.lineAt(sel.from)
    const lineText = line.text
    const hasHeading = /^#{1,6}\s/.test(lineText)
    if (hasHeading) {
      view.dispatch({
        changes: { from: line.from, to: line.from + lineText.match(/^#{1,6}\s/)![0].length, insert: headingMap[format] }
      })
    } else {
      view.dispatch({
        changes: { from: line.from, insert: headingMap[format] }
      })
    }
  }
}
