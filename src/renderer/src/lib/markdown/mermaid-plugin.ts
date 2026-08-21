import type MarkdownIt from 'markdown-it'
import { encodeRaw } from './base64'

/**
 * markdown-it plugin: converts ```mermaid fenced blocks into
 * <pre class="mermaid-diagram">…</pre> placeholders (MarkdownPreview picks
 * these up after render and calls mermaid.render()), and marks every fenced
 * code block — mermaid included — as an opaque, non-editable WYSIWYG widget
 * carrying its raw source in data-raw so it round-trips through the preview
 * editor and can be edited via the click-to-reveal-source overlay.
 */
export function mermaidPlugin(md: MarkdownIt): void {
  const originalFence = md.renderer.rules.fence?.bind(md.renderer.rules)

  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    const lang = token.info.trim().toLowerCase()
    const line = token.map ? token.map[0] + 1 : 0
    const raw = encodeRaw(token.content)

    if (lang === 'mermaid') {
      // Encode so the content survives DOMPurify untouched
      const escaped = token.content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
      return `<pre class="mermaid-diagram" contenteditable="false" data-raw="${raw}" data-lang="mermaid" data-source-line="${line}">${escaped}</pre>\n`
    }

    const rendered = originalFence
      ? originalFence(tokens, idx, options, env, self)
      : self.renderToken(tokens, idx, options)

    // The highlighter (shiki) returns a full "<pre ...>" string; inject our
    // attributes into its opening tag. Fall back to wrapping if it didn't.
    if (rendered.indexOf('<pre') === 0) {
      return rendered.replace(
        /^<pre([^>]*)>/,
        `<pre$1 contenteditable="false" data-raw="${raw}" data-lang="${lang || 'text'}" data-source-line="${line}">`
      )
    }
    return `<pre contenteditable="false" data-raw="${raw}" data-lang="${lang || 'text'}" data-source-line="${line}">${rendered}</pre>\n`
  }
}
