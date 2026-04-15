import { useEffect, useMemo, useRef } from 'react'
import DOMPurify from 'dompurify'
import mermaid from 'mermaid'
import { renderMarkdown } from '../../lib/markdown/parser'
import { useUiStore } from '../../store/uiStore'
import { usePluginStore } from '../../store/pluginStore'
import styles from './MarkdownPreview.module.css'

interface Props {
  content: string
  containerRef?: React.RefObject<HTMLDivElement>
}

export function MarkdownPreview({ content, containerRef }: Props) {
  const { theme, previewFontSize } = useUiStore()
  const pluginRevision = usePluginStore((s) => s.revision)
  const ref = useRef<HTMLDivElement>(null)

  const rendered = useMemo(() => {
    const html = renderMarkdown(content)
    return DOMPurify.sanitize(html, {
      ADD_TAGS: ['math', 'mrow', 'mi', 'mo', 'mn', 'msup', 'msub', 'mfrac', 'mspace', 'mtext'],
      ADD_ATTR: ['xmlns', 'mathvariant', 'class', 'style', 'data-source-line', 'aria-hidden',
                 'aria-label', 'href', 'id', 'type', 'checked', 'disabled']
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, pluginRevision])

  // Render mermaid diagrams after HTML update
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const placeholders = el.querySelectorAll<HTMLElement>('pre.mermaid-diagram')
    if (placeholders.length === 0) return

    const isDark = theme === 'dark' || theme === 'solarized-dark' || theme === 'dracula'
    mermaid.initialize({
      startOnLoad: false,
      theme: isDark ? 'dark' : 'default',
      securityLevel: 'antiscript'
    })

    placeholders.forEach(async (pre, i) => {
      const code = pre.textContent ?? ''
      const id = `mermaid-${Date.now()}-${i}`
      try {
        const { svg } = await mermaid.render(id, code)
        const wrapper = document.createElement('div')
        wrapper.className = styles.mermaidWrapper
        wrapper.innerHTML = svg
        pre.replaceWith(wrapper)
      } catch (err) {
        pre.classList.add(styles.mermaidError)
        pre.textContent = String(err)
      }
    })
  }, [rendered, theme])

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

  return (
    <div
      ref={containerRef}
      className={`${styles.previewContainer} ${styles[`theme-${theme}`] || ''}`}
      data-theme={theme}
    >
      <div
        ref={ref}
        className={styles.preview}
        style={{ fontSize: `${previewFontSize}px` }}
        dangerouslySetInnerHTML={{ __html: rendered }}
      />
    </div>
  )
}
