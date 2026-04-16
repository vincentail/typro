import { useEffect, useMemo, useRef, type MutableRefObject, type RefObject } from 'react'
import DOMPurify from 'dompurify'
import mermaid from 'mermaid'
import { renderMarkdown } from '../../lib/markdown/parser'
import { useUiStore } from '../../store/uiStore'
import { usePluginStore } from '../../store/pluginStore'
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

  const rendered = useMemo(() => {
    const html = renderMarkdown(content)
    return DOMPurify.sanitize(html, {
      ADD_TAGS: ['math', 'mrow', 'mi', 'mo', 'mn', 'msup', 'msub', 'mfrac', 'mspace', 'mtext'],
      ADD_ATTR: ['xmlns', 'mathvariant', 'class', 'style', 'data-source-line', 'aria-hidden',
                 'aria-label', 'href', 'id', 'type', 'checked', 'disabled']
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, pluginRevision])

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

  // Handle external links
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const a = target.closest('a')
      if (!a) return
      const href = a.getAttribute('href')
      if (!href) return
      if (href.startsWith('#')) return // in-page anchor
      e.preventDefault()
      // Open external links in browser
      if (href.startsWith('http://') || href.startsWith('https://')) {
        window.open(href, '_blank', 'noopener')
      }
    }
    el.addEventListener('click', handler)
    return () => el.removeEventListener('click', handler)
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
      <div
        ref={ref}
        className={styles.preview}
        style={{ fontSize: `${previewFontSize}px`, zoom: previewZoom }}
        dangerouslySetInnerHTML={{ __html: rendered }}
      />
    </div>
  )
}
