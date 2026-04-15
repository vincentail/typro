import type MarkdownIt from 'markdown-it'

/**
 * markdown-it plugin: converts ```mermaid fenced blocks into
 * <pre class="mermaid-diagram">…</pre> placeholders.
 * MarkdownPreview picks these up after render and calls mermaid.render().
 */
export function mermaidPlugin(md: MarkdownIt): void {
  const originalFence = md.renderer.rules.fence?.bind(md.renderer.rules)

  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    const lang = token.info.trim().toLowerCase()

    if (lang === 'mermaid') {
      // Encode so the content survives DOMPurify untouched
      const escaped = token.content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
      const line = token.map ? token.map[0] + 1 : 0
      return `<pre class="mermaid-diagram" data-source-line="${line}">${escaped}</pre>\n`
    }

    return originalFence
      ? originalFence(tokens, idx, options, env, self)
      : self.renderToken(tokens, idx, options)
  }
}
