import { KeyBinding } from '@codemirror/view'
import { EditorView } from '@codemirror/view'

function wrapSelection(view: EditorView, open: string, close: string): boolean {
  const { state } = view
  const changes = state.changeByRange((range) => {
    const text = state.sliceDoc(range.from, range.to)
    if (text.startsWith(open) && text.endsWith(close)) {
      // Unwrap
      return {
        changes: {
          from: range.from,
          to: range.to,
          insert: text.slice(open.length, text.length - close.length)
        },
        range: { anchor: range.from, head: range.to - open.length - close.length }
      }
    }
    return {
      changes: { from: range.from, to: range.to, insert: `${open}${text || 'text'}${close}` },
      range: {
        anchor: range.from + open.length,
        head: range.from + open.length + (text || 'text').length
      }
    }
  })
  view.dispatch(changes)
  return true
}

function insertHeading(level: number): (view: EditorView) => boolean {
  return (view) => {
    const { state } = view
    const sel = state.selection.main
    const line = state.doc.lineAt(sel.from)
    const prefix = '#'.repeat(level) + ' '
    const existing = line.text.match(/^(#{1,6})\s/)
    let changes
    if (existing) {
      changes = { from: line.from, to: line.from + existing[0].length, insert: prefix }
    } else {
      changes = { from: line.from, insert: prefix }
    }
    view.dispatch({ changes })
    return true
  }
}

export function buildMarkdownKeymap(): KeyBinding[] {
  return [
    { key: 'Mod-b', run: (v) => wrapSelection(v, '**', '**') },
    { key: 'Mod-i', run: (v) => wrapSelection(v, '*', '*') },
    { key: 'Mod-Shift-s', run: (v) => wrapSelection(v, '~~', '~~') },
    { key: 'Mod-`', run: (v) => wrapSelection(v, '`', '`') },
    { key: 'Mod-k', run: (v) => {
      const { state } = v
      const sel = state.selection.main
      const text = state.sliceDoc(sel.from, sel.to) || 'link text'
      v.dispatch({
        changes: { from: sel.from, to: sel.to, insert: `[${text}](https://)` },
        selection: { anchor: sel.from + 1, head: sel.from + 1 + text.length }
      })
      return true
    }},
    { key: 'Mod-1', run: insertHeading(1) },
    { key: 'Mod-2', run: insertHeading(2) },
    { key: 'Mod-3', run: insertHeading(3) },
    { key: 'Mod-4', run: insertHeading(4) },
    { key: 'Mod-5', run: insertHeading(5) },
    { key: 'Mod-6', run: insertHeading(6) },
    // Insert table
    { key: 'Mod-Alt-t', run: (v) => {
      const table = '\n| Column 1 | Column 2 | Column 3 |\n| --- | --- | --- |\n| Cell | Cell | Cell |\n'
      const { state } = v
      const pos = state.selection.main.head
      v.dispatch({ changes: { from: pos, insert: table } })
      return true
    }},
    // Insert horizontal rule
    { key: 'Mod-Alt-h', run: (v) => {
      const { state } = v
      const pos = state.selection.main.head
      v.dispatch({ changes: { from: pos, insert: '\n---\n' } })
      return true
    }}
  ]
}
