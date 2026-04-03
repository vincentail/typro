import { useEffect, useMemo, useRef } from 'react'
import DOMPurify from 'dompurify'
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
