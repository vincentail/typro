import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, type MutableRefObject, type RefObject } from 'react'
import DOMPurify from 'dompurify'
import mermaid from 'mermaid'
import { renderMarkdown } from '../../lib/markdown/parser'
import { htmlToMarkdown } from '../../lib/markdown/htmlToMarkdown'
import { encodeRaw } from '../../lib/markdown/base64'
import { useUiStore } from '../../store/uiStore'
import { usePluginStore } from '../../store/pluginStore'
import { useEditorStore } from '../../store/editorStore'
import { openRawEditor } from './rawEditor'
import styles from './MarkdownPreview.module.css'

// Initialize once at module level
mermaid.initialize({ startOnLoad: false, securityLevel: 'antiscript' })

interface Props {
  content: string
  containerRef?: RefObject<HTMLDivElement>
}

export function MarkdownPreview({ content, containerRef }: Props) {
  const { theme, previewFontSize, previewZoom, setPreviewZoom } = useUiStore()
  const pluginRevision = usePluginStore((s) => s.revision)
  const ref = useRef<HTMLDivElement>(null)
  const outerRef = useRef<HTMLDivElement>(null)

  // While the preview itself is focused and being typed into, freeze the
  // markdown → HTML render so React never touches (and resets) the live
  // contentEditable DOM mid-edit. See the WYSIWYG editing block below.
  const isEditingRef = useRef(false)
  const frozenContentRef = useRef(content)
  if (!isEditingRef.current) frozenContentRef.current = content
  const effectiveContent = isEditingRef.current ? frozenContentRef.current : content

  const rendered = useMemo(() => {
    const html = renderMarkdown(effectiveContent)
    return DOMPurify.sanitize(html, {
      ADD_TAGS: ['math', 'mrow', 'mi', 'mo', 'mn', 'msup', 'msub', 'mfrac', 'mspace', 'mtext'],
      ADD_ATTR: ['xmlns', 'mathvariant', 'class', 'style', 'data-source-line', 'aria-hidden',
                 'aria-label', 'href', 'id', 'type', 'checked', 'disabled',
                 'contenteditable', 'data-raw', 'data-lang', 'data-opaque']
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveContent, pluginRevision])

  // Apply the rendered HTML imperatively rather than via React's
  // dangerouslySetInnerHTML: React re-diffs (and can re-touch) that prop on
  // every re-render of this component — which happens constantly while
  // editing, since content changes flow back through the shared store — and
  // resetting the live contentEditable DOM mid-keystroke would wipe the
  // user's cursor and in-progress edit. Owning the write ourselves, gated on
  // isEditingRef, guarantees the DOM is only ever touched when we intend it.
  useLayoutEffect(() => {
    if (!ref.current || isEditingRef.current) return
    ref.current.innerHTML = rendered
  }, [rendered])

  // Zoom via Ctrl/Cmd+wheel (trackpad pinch) and Cmd+=/−/0
  useEffect(() => {
    const el = outerRef.current
    if (!el) return

    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      // trackpad pinch: deltaY is small; mouse wheel: larger steps
      const delta = e.deltaY * (e.deltaMode === 0 ? 0.002 : 0.05)
      setPreviewZoom(useUiStore.getState().previewZoom * (1 - delta))
    }

    const onKey = (e: KeyboardEvent) => {
      if (!e.metaKey && !e.ctrlKey) return
      if (e.key === '=' || e.key === '+') {
        e.preventDefault()
        setPreviewZoom(useUiStore.getState().previewZoom + 0.1)
      } else if (e.key === '-') {
        e.preventDefault()
        setPreviewZoom(useUiStore.getState().previewZoom - 0.1)
      } else if (e.key === '0') {
        e.preventDefault()
        setPreviewZoom(1.0)
      }
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('keydown', onKey)
    return () => {
      el.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKey)
    }
  }, [setPreviewZoom])

  const isDark = theme === 'dark' || theme === 'solarized-dark' || theme === 'dracula'

  // Re-initialize mermaid when theme changes
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: isDark ? 'dark' : 'default',
      securityLevel: 'antiscript'
    })
  }, [isDark])

  // Render mermaid diagrams after HTML update (debounced so rapid typing doesn't cancel mid-render)
  useEffect(() => {
    const el = ref.current
    if (!el) return

    let cancelled = false
    // Debounce: wait 300ms after the last content change before rendering
    const timer = setTimeout(async () => {
      const nodes = Array.from(el.querySelectorAll<HTMLElement>('pre.mermaid-diagram'))
      if (nodes.length === 0) return

      for (let i = 0; i < nodes.length; i++) {
        if (cancelled) break
        const pre = nodes[i]
        const code = pre.textContent ?? ''
        // Unique ID with timestamp + random suffix avoids ID conflicts
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2)}-${i}`
        // Off-screen sandbox so mermaid doesn't interfere with (or get clipped by) the live DOM
        const sandbox = document.createElement('div')
        sandbox.style.cssText = 'position:fixed;top:-9999px;left:-9999px;visibility:hidden'
        document.body.appendChild(sandbox)
        try {
          const { svg } = await mermaid.render(id, code, sandbox)
          if (cancelled) break
          const wrapper = document.createElement('div')
          wrapper.className = styles.mermaidWrapper
          wrapper.innerHTML = svg
          // Carry the raw source + opaque-widget markers over from <pre> so
          // clicks still open the source editor and serialization still works.
          wrapper.setAttribute('contenteditable', 'false')
          wrapper.dataset.raw = pre.dataset.raw
          wrapper.dataset.lang = 'mermaid'
          pre.replaceWith(wrapper)
        } catch (err) {
          if (!cancelled) {
            pre.classList.add(styles.mermaidError)
            pre.textContent = String(err)
          }
        } finally {
          if (document.body.contains(sandbox)) document.body.removeChild(sandbox)
        }
      }
    }, 300)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [rendered])

  // Handle external links. The preview is contentEditable, so a plain click
  // on a link places the caret (native behavior) — only Cmd/Ctrl+click opens it,
  // matching the convention used by other WYSIWYG editors (Notion, Typora).
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const a = target.closest('a')
      if (!a || a.classList.contains('header-anchor')) return
      if (!e.metaKey && !e.ctrlKey) return
      const href = a.getAttribute('href')
      if (!href) return
      if (href.startsWith('#')) return // in-page anchor
      e.preventDefault()
      if (href.startsWith('http://') || href.startsWith('https://')) {
        window.open(href, '_blank', 'noopener')
      }
    }
    el.addEventListener('click', handler)
    return () => el.removeEventListener('click', handler)
  }, [rendered])

  // ── WYSIWYG editing ────────────────────────────────────────────────────
  // Typing in the preview edits the live contentEditable DOM directly (native
  // browser behavior); a debounced pass serializes it back to Markdown and
  // pushes it into the shared store, which is what keeps the source editor,
  // word count, and save/dirty state in sync.
  const inputTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flushEdit = useCallback((unfreeze: boolean) => {
    if (!ref.current) return
    const store = useEditorStore.getState()
    const md = htmlToMarkdown(ref.current, store.content)
    if (unfreeze) isEditingRef.current = false
    if (md !== store.content) {
      store.setContent(md)
      const trimmed = md.trim()
      store.setWordCount({
        words: trimmed ? trimmed.split(/\s+/).length : 0,
        chars: md.length,
        lines: md.split('\n').length
      })
    }
  }, [])

  useEffect(() => () => {
    if (inputTimerRef.current) clearTimeout(inputTimerRef.current)
  }, [])

  const handleFocus = useCallback(() => {
    isEditingRef.current = true
    document.execCommand('defaultParagraphSeparator', false, 'p')
  }, [])

  const handleBlur = useCallback(() => {
    if (inputTimerRef.current) clearTimeout(inputTimerRef.current)
    flushEdit(true)
  }, [flushEdit])

  const handleInput = useCallback(() => {
    if (inputTimerRef.current) clearTimeout(inputTimerRef.current)
    inputTimerRef.current = setTimeout(() => flushEdit(false), 400)
  }, [flushEdit])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text)
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const mod = e.metaKey || e.ctrlKey
    if (!mod) return
    const key = e.key.toLowerCase()
    if (key === 'b') {
      e.preventDefault()
      document.execCommand('bold')
    } else if (key === 'i') {
      e.preventDefault()
      document.execCommand('italic')
    } else if (key === 's' && e.shiftKey) {
      e.preventDefault()
      document.execCommand('strikeThrough')
    } else if (key === '`') {
      e.preventDefault()
      toggleInlineCode()
    } else if (key === '1' || key === '2' || key === '3') {
      e.preventDefault()
      document.execCommand('formatBlock', false, `h${key}`)
    } else if (key === 'k') {
      e.preventDefault()
      insertLink()
    }
  }, [])

  // Click-to-edit-source for opaque widgets (code fences, math, mermaid)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const opaque = target.closest<HTMLElement>('[data-raw]')
      // Footnote refs/section carry data-raw for round-tripping but aren't
      // click-to-edit widgets (no source-editable UI for them yet).
      if (!opaque || !el.contains(opaque) || opaque.tagName === 'SUP' || opaque.dataset.opaque === 'footnotes') return
      e.preventDefault()
      e.stopPropagation()
      openRawEditor(opaque, (newRaw) => {
        opaque.dataset.raw = encodeRaw(newRaw)
        flushEdit(true)
      })
    }
    el.addEventListener('click', handler)
    return () => el.removeEventListener('click', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rendered])

  // Merge outerRef with containerRef (scroll sync ref passed from AppShell)
  const setOuterRef = (el: HTMLDivElement | null) => {
    ;(outerRef as MutableRefObject<HTMLDivElement | null>).current = el
    if (containerRef) (containerRef as MutableRefObject<HTMLDivElement | null>).current = el
  }

  return (
    <div
      ref={setOuterRef}
      className={`${styles.previewContainer} ${styles[`theme-${theme}`] || ''}`}
      data-theme={theme}
    >
      {/* zoom wrapper is separate from the dangerouslySetInnerHTML div so that
          changing previewZoom never causes React to touch (and reset) innerHTML */}
      <div style={{ zoom: previewZoom, minHeight: '100%' }}>
        <div
          ref={ref}
          className={styles.preview}
          style={{ fontSize: `${previewFontSize}px` }}
          contentEditable
          suppressContentEditableWarning
          onFocus={handleFocus}
          onBlur={handleBlur}
          onInput={handleInput}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
        />
      </div>
    </div>
  )
}

// Wraps the current selection in <code>, or unwraps it if already inside one.
function toggleInlineCode(): void {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return
  const range = sel.getRangeAt(0)

  const container =
    range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
      ? (range.commonAncestorContainer as HTMLElement)
      : range.commonAncestorContainer.parentElement
  const existingCode = container?.closest('code') ?? null
  if (existingCode) {
    const text = document.createTextNode(existingCode.textContent || '')
    existingCode.replaceWith(text)
    return
  }

  const code = document.createElement('code')
  try {
    range.surroundContents(code)
  } catch {
    const text = range.toString()
    range.deleteContents()
    code.textContent = text
    range.insertNode(code)
  }
  sel.removeAllRanges()
  const newRange = document.createRange()
  newRange.selectNodeContents(code)
  sel.addRange(newRange)
}

// Wraps the current selection in a link, prompting for the URL.
function insertLink(): void {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return
  const range = sel.getRangeAt(0)
  const text = range.toString()
  const url = window.prompt('Link URL', 'https://')
  if (!url) return

  const a = document.createElement('a')
  a.href = url
  if (text) {
    range.deleteContents()
    a.textContent = text
  } else {
    a.textContent = url
  }
  range.insertNode(a)
}
