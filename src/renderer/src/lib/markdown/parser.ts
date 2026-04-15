import MarkdownIt from 'markdown-it'
// @ts-ignore
import taskLists from 'markdown-it-task-lists'
import markdownItAnchor from 'markdown-it-anchor'
// @ts-ignore
import markdownItFootnote from 'markdown-it-footnote'
import katex from 'katex'
import { mermaidPlugin } from './mermaid-plugin'

// Create the markdown-it instance
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: false
})

// Task lists (GFM checkboxes)
md.use(taskLists, { enabled: true, label: true })

// Anchors for headings
md.use(markdownItAnchor, {
  permalink: markdownItAnchor.permalink.ariaHidden({
    symbol: '#',
    placement: 'before'
  }),
  slugify: (s: string) =>
    s
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
})

// Footnotes
md.use(markdownItFootnote)

// Mermaid diagram placeholders
md.use(mermaidPlugin)

// Add source line tracking to tokens
md.core.ruler.push('source_lines', (state) => {
  state.tokens.forEach((token) => {
    if (token.map) {
      token.attrSet('data-source-line', String(token.map[0] + 1))
    }
  })
})

// KaTeX math support
// Inline math: $...$
md.inline.ruler.before('escape', 'math_inline', (state, silent) => {
  if (state.src[state.pos] !== '$') return false
  const start = state.pos + 1
  const end = state.src.indexOf('$', start)
  if (end === -1 || end === start) return false

  if (!silent) {
    const token = state.push('math_inline', 'math', 0)
    token.content = state.src.slice(start, end)
    token.markup = '$'
  }
  state.pos = end + 1
  return true
})

// Block math: $$...$$
md.block.ruler.before('fence', 'math_block', (state, start, end, silent) => {
  const startPos = state.bMarks[start] + state.tShift[start]
  const maxPos = state.eMarks[start]
  const line = state.src.slice(startPos, maxPos)

  if (!line.startsWith('$$')) return false
  if (silent) return true

  let nextLine = start + 1
  let found = false
  while (nextLine < end) {
    const lineStart = state.bMarks[nextLine] + state.tShift[nextLine]
    const lineEnd = state.eMarks[nextLine]
    const nextLineContent = state.src.slice(lineStart, lineEnd)
    if (nextLineContent.startsWith('$$')) {
      found = true
      break
    }
    nextLine++
  }

  const token = state.push('math_block', 'math', 0)
  token.block = true
  token.markup = '$$'
  token.map = [start, nextLine + 1]

  const contentStart = state.bMarks[start] + state.tShift[start] + 2
  const contentLines: string[] = []
  for (let i = start + 1; i < nextLine; i++) {
    contentLines.push(state.src.slice(state.bMarks[i] + state.tShift[i], state.eMarks[i]))
  }
  token.content = contentLines.join('\n')

  state.line = found ? nextLine + 1 : nextLine
  return true
})

// KaTeX renderers
md.renderer.rules['math_inline'] = (tokens, idx) => {
  try {
    return katex.renderToString(tokens[idx].content, { throwOnError: false, displayMode: false })
  } catch {
    return `<code>${tokens[idx].content}</code>`
  }
}

md.renderer.rules['math_block'] = (tokens, idx) => {
  try {
    return `<div class="math-block">${katex.renderToString(tokens[idx].content, { throwOnError: false, displayMode: true })}</div>`
  } catch {
    return `<pre><code>${tokens[idx].content}</code></pre>`
  }
}

// Syntax highlighting with highlight.js as sync fallback
// Shiki async highlighting is applied post-render
let highlighter: ((code: string, lang: string) => string) | null = null

export function setHighlighter(fn: (code: string, lang: string) => string): void {
  highlighter = fn
}

md.options.highlight = (code, lang) => {
  if (highlighter) {
    try {
      return highlighter(code, lang || 'text')
    } catch {
      // fall through
    }
  }
  // Simple fallback: escape and wrap
  const escaped = md.utils.escapeHtml(code)
  return `<pre class="shiki"><code class="language-${lang}">${escaped}</code></pre>`
}

export interface TocItem {
  level: number
  text: string
  id: string
  line: number
}

export function extractToc(content: string): TocItem[] {
  const toc: TocItem[] = []
  const tokens = md.parse(content, {})
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    if (token.type === 'heading_open') {
      const level = parseInt(token.tag.slice(1))
      const inline = tokens[i + 1]
      const text = inline ? inline.content : ''
      const id = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
      const line = token.map ? token.map[0] + 1 : 0
      toc.push({ level, text, id, line })
    }
  }
  return toc
}

export { md }

/** Register an external markdown-it plugin at runtime (e.g. from the plugin system) */
export function registerMarkdownPlugin(fn: (instance: MarkdownIt) => void): void {
  fn(md)
}

export function renderMarkdown(content: string): string {
  return md.render(content)
}
