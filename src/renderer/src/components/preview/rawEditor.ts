import { decodeRaw } from '../../lib/markdown/base64'
import styles from './MarkdownPreview.module.css'

/**
 * Click-to-reveal-source editing for opaque WYSIWYG widgets (fenced code,
 * math, mermaid diagrams): swaps the rendered element for a plain textarea
 * containing its raw Markdown source, and hands the edited text back via
 * `onCommit` on blur / Cmd+Enter. Escape discards the edit.
 */
export function openRawEditor(el: HTMLElement, onCommit: (raw: string) => void): void {
  if (el.dataset.editing === '1') return
  el.dataset.editing = '1'

  const raw = decodeRaw(el.dataset.raw || '')
  const textarea = document.createElement('textarea')
  textarea.value = raw
  textarea.className = styles.rawEditor
  textarea.rows = Math.max(1, raw.split('\n').length)
  textarea.spellcheck = false

  const placeholder = document.createComment('raw-edit')
  const parent = el.parentNode
  if (!parent) {
    delete el.dataset.editing
    return
  }
  parent.replaceChild(placeholder, el)
  parent.insertBefore(textarea, placeholder)
  textarea.focus()
  textarea.select()

  let done = false
  const finish = (commit: boolean): void => {
    if (done) return
    done = true
    textarea.removeEventListener('blur', onBlur)
    textarea.removeEventListener('keydown', onKeyDown)
    textarea.remove()
    delete el.dataset.editing
    parent.insertBefore(el, placeholder)
    placeholder.remove()
    if (commit && textarea.value !== raw) onCommit(textarea.value)
  }

  const onBlur = (): void => finish(true)
  const onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      e.preventDefault()
      finish(false)
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      finish(true)
    }
  }

  textarea.addEventListener('blur', onBlur)
  textarea.addEventListener('keydown', onKeyDown)
}
