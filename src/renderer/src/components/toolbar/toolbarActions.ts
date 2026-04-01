import { EditorView } from '@codemirror/view'
import { EditorSelection } from '@codemirror/state'
import { undo, redo } from '@codemirror/commands'

// ── Wrap / unwrap selected text ───────────────────────────────────────────────
export function wrapSelection(view: EditorView, open: string, close: string): void {
  const { state } = view
  const changes = state.changeByRange((range) => {
    const text = state.sliceDoc(range.from, range.to)
    const isWrapped = text.startsWith(open) && text.endsWith(close) && text.length > open.length + close.length
    if (isWrapped) {
      const inner = text.slice(open.length, text.length - close.length)
      return {
        changes: { from: range.from, to: range.to, insert: inner },
        range: EditorSelection.range(range.from, range.from + inner.length)
      }
    }
    const placeholder = text || 'text'
    return {
      changes: { from: range.from, to: range.to, insert: open + placeholder + close },
      range: EditorSelection.range(range.from + open.length, range.from + open.length + placeholder.length)
    }
  })
  view.dispatch(changes)
  view.focus()
}

// ── Set / clear heading level on the current line ─────────────────────────────
export function setHeading(view: EditorView, level: number): void {
  const { state } = view
  const sel = state.selection.main
  const line = state.doc.lineAt(sel.head)
  const existing = line.text.match(/^(#{1,6})\s/)
  const prefix = level > 0 ? '#'.repeat(level) + ' ' : ''
  const clearLen = existing ? existing[0].length : 0
  view.dispatch({
    changes: { from: line.from, to: line.from + clearLen, insert: prefix }
  })
  view.focus()
}

// ── Get heading level at cursor (0 = paragraph) ───────────────────────────────
export function getHeadingLevel(view: EditorView): number {
  const line = view.state.doc.lineAt(view.state.selection.main.head)
  const m = line.text.match(/^(#{1,6})\s/)
  return m ? m[1].length : 0
}

// ── Toggle block prefix (>, -, 1., - [ ]) ─────────────────────────────────────
export function toggleLinePrefix(view: EditorView, prefix: string): void {
  const { state } = view
  const sel = state.selection.main

  // Gather all affected lines (handle multi-line selection)
  const startLine = state.doc.lineAt(sel.from)
  const endLine = state.doc.lineAt(sel.to)
  const changes: { from: number; to: number; insert: string }[] = []

  for (let ln = startLine.number; ln <= endLine.number; ln++) {
    const line = state.doc.line(ln)
    if (line.text.startsWith(prefix)) {
      changes.push({ from: line.from, to: line.from + prefix.length, insert: '' })
    } else {
      // Remove any other list prefix first, then add ours
      const existing = line.text.match(/^(\s*(?:[-*+]|\d+\.|-\s*\[[ x]\])\s)/)
      if (existing) {
        changes.push({ from: line.from, to: line.from + existing[0].length, insert: prefix })
      } else {
        changes.push({ from: line.from, insert: prefix })
      }
    }
  }
  view.dispatch({ changes })
  view.focus()
}

// ── Insert a block at cursor ──────────────────────────────────────────────────
export function insertBlock(view: EditorView, text: string, cursorOffset?: number): void {
  const { state } = view
  const pos = state.selection.main.head
  view.dispatch({
    changes: { from: pos, insert: text },
    selection: cursorOffset !== undefined
      ? { anchor: pos + cursorOffset }
      : undefined
  })
  view.focus()
}

// ── Insert/wrap a link ────────────────────────────────────────────────────────
export function insertLink(view: EditorView): void {
  const { state } = view
  const sel = state.selection.main
  const text = state.sliceDoc(sel.from, sel.to) || 'link text'
  const insert = `[${text}](https://)`
  view.dispatch({
    changes: { from: sel.from, to: sel.to, insert },
    selection: { anchor: sel.from + text.length + 3, head: sel.from + insert.length - 1 }
  })
  view.focus()
}

// ── Insert image ──────────────────────────────────────────────────────────────
export function insertImage(view: EditorView): void {
  const { state } = view
  const sel = state.selection.main
  const alt = state.sliceDoc(sel.from, sel.to) || 'alt text'
  const insert = `![${alt}](url)`
  view.dispatch({
    changes: { from: sel.from, to: sel.to, insert },
    selection: { anchor: sel.from + alt.length + 4, head: sel.from + insert.length - 1 }
  })
  view.focus()
}

// ── Insert table ──────────────────────────────────────────────────────────────
export function insertTable(view: EditorView, rows = 3, cols = 3): void {
  const header = '| ' + Array(cols).fill('Header').map((h, i) => `${h} ${i + 1}`).join(' | ') + ' |'
  const divider = '| ' + Array(cols).fill('---').join(' | ') + ' |'
  const row = '| ' + Array(cols).fill('Cell').join(' | ') + ' |'
  const rows_ = Array(rows - 1).fill(row)
  const table = '\n' + [header, divider, ...rows_].join('\n') + '\n'
  const { state } = view
  const pos = state.selection.main.head
  view.dispatch({ changes: { from: pos, insert: table } })
  view.focus()
}

// ── Apply text color via HTML span ────────────────────────────────────────────
export function applyColor(view: EditorView, color: string): void {
  const { state } = view
  const sel = state.selection.main
  const text = state.sliceDoc(sel.from, sel.to) || 'text'
  const insert = `<span style="color:${color}">${text}</span>`
  view.dispatch({
    changes: { from: sel.from, to: sel.to, insert }
  })
  view.focus()
}

// ── Apply text highlight via HTML mark ───────────────────────────────────────
export function applyHighlight(view: EditorView, color: string): void {
  const { state } = view
  const sel = state.selection.main
  const text = state.sliceDoc(sel.from, sel.to) || 'text'
  const insert = `<mark style="background:${color}">${text}</mark>`
  view.dispatch({
    changes: { from: sel.from, to: sel.to, insert }
  })
  view.focus()
}

// ── Re-export CM6 history commands ───────────────────────────────────────────
export { undo, redo }
