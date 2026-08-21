import { decodeRaw } from './base64'

/**
 * Serializes the live WYSIWYG preview DOM back into Markdown source.
 *
 * The preview is rendered by markdown-it (see parser.ts) with a few nodes
 * marked as opaque widgets (contenteditable="false" + data-raw): fenced code
 * blocks, mermaid diagrams, inline/block math, and footnote refs/section.
 * Those round-trip verbatim from their embedded raw source instead of being
 * re-derived from rendered markup, since going the other way (Shiki spans,
 * KaTeX MathML, mermaid SVG) is lossy.
 *
 * `originalContent` is only consulted for the footnote definitions block,
 * which is passed through unedited (see extractFootnoteDefs).
 */
export function htmlToMarkdown(root: HTMLElement, originalContent: string): string {
  const blocks: string[] = []
  let footnotesHandled = false

  for (const node of Array.from(root.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent || '').trim()
      if (text) blocks.push(escapeText(text))
      continue
    }
    if (node.nodeType !== Node.ELEMENT_NODE) continue
    const el = node as HTMLElement

    if (el.tagName === 'HR' && el.classList.contains('footnotes-sep')) continue

    if (el.dataset.opaque === 'footnotes') {
      if (!footnotesHandled) {
        footnotesHandled = true
        const defs = extractFootnoteDefs(originalContent)
        if (defs) blocks.push(defs)
      }
      continue
    }

    const block = serializeBlock(el)
    if (block !== null && block !== '') blocks.push(block)
  }

  return blocks.join('\n\n') + '\n'
}

function isOpaque(el: HTMLElement): boolean {
  return el.getAttribute('contenteditable') === 'false' && el.dataset.raw !== undefined
}

function serializeBlock(el: HTMLElement): string | null {
  if (isOpaque(el)) return serializeOpaqueBlock(el)

  switch (el.tagName) {
    case 'H1':
    case 'H2':
    case 'H3':
    case 'H4':
    case 'H5':
    case 'H6': {
      const level = Number(el.tagName[1])
      const text = serializeInline(Array.from(el.childNodes)).trim()
      return text ? `${'#'.repeat(level)} ${text}` : null
    }
    case 'P':
    case 'DIV': {
      const text = serializeInline(Array.from(el.childNodes)).trim()
      return text ? escapeLeading(text) : ''
    }
    case 'UL':
      return serializeList(el, false)
    case 'OL':
      return serializeList(el, true)
    case 'BLOCKQUOTE':
      return serializeBlockquote(el)
    case 'HR':
      return '---'
    case 'TABLE':
      return serializeTable(el)
    case 'PRE':
      // Fallback: an unmarked <pre> (shouldn't normally happen — fences are opaque)
      return '```\n' + (el.textContent || '') + '\n```'
    default: {
      const text = serializeInline(Array.from(el.childNodes)).trim()
      return text || null
    }
  }
}

function serializeOpaqueBlock(el: HTMLElement): string {
  const raw = decodeRaw(el.dataset.raw || '')
  if (el.classList.contains('math-block')) {
    return `$$\n${raw}\n$$`
  }
  if (el.dataset.lang === 'mermaid') {
    return '```mermaid\n' + raw + '\n```'
  }
  const lang = el.dataset.lang ?? ''
  return '```' + lang + '\n' + raw + '\n```'
}

function serializeBlockquote(el: HTMLElement): string {
  const innerBlocks: string[] = []
  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const b = serializeBlock(node as HTMLElement)
      if (b !== null && b !== '') innerBlocks.push(b)
    } else if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent || '').trim()
      if (text) innerBlocks.push(escapeText(text))
    }
  }
  const combined = innerBlocks.join('\n\n')
  return combined
    .split('\n')
    .map((line) => (line ? `> ${line}` : '>'))
    .join('\n')
}

function serializeList(listEl: HTMLElement, ordered: boolean): string {
  const items = Array.from(listEl.children).filter((c) => c.tagName === 'LI') as HTMLElement[]
  let n = ordered ? parseInt(listEl.getAttribute('start') || '1', 10) : 0
  return items
    .map((li) => {
      const bullet = ordered ? `${n++}. ` : '- '
      return serializeListItem(li, bullet)
    })
    .join('\n')
}

function serializeListItem(li: HTMLElement, bullet: string): string {
  const pad = ' '.repeat(bullet.length)
  const isTask = li.classList.contains('task-list-item')
  const checkbox = isTask ? li.querySelector<HTMLInputElement>('input[type="checkbox"]') : null
  const checkboxPrefix = checkbox ? (checkbox.checked ? '[x] ' : '[ ] ') : ''

  const inlineNodes: ChildNode[] = []
  const nestedBlocks: string[] = []

  for (const node of Array.from(li.childNodes)) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement
      if (el.tagName === 'UL' || el.tagName === 'OL') {
        nestedBlocks.push(indentBlock(serializeList(el, el.tagName === 'OL'), pad))
        continue
      }
      if (el.tagName === 'INPUT') continue
      if (el.tagName === 'P') {
        if (inlineNodes.length === 0 && nestedBlocks.length === 0) {
          inlineNodes.push(...Array.from(el.childNodes))
        } else {
          nestedBlocks.push(indentBlock(serializeInline(Array.from(el.childNodes)).trim(), pad))
        }
        continue
      }
    }
    inlineNodes.push(node)
  }

  const firstLine = bullet + checkboxPrefix + serializeInline(inlineNodes).trim()
  const rest = nestedBlocks.filter(Boolean).join('\n\n')
  return rest ? `${firstLine}\n${rest}` : firstLine
}

function indentBlock(text: string, pad: string): string {
  return text
    .split('\n')
    .map((line) => (line ? pad + line : line))
    .join('\n')
}

function serializeTable(table: HTMLElement): string {
  const headerCells = Array.from(table.querySelectorAll('thead tr th')) as HTMLElement[]
  const bodyRows = Array.from(table.querySelectorAll('tbody tr')) as HTMLElement[]

  const cellText = (cell: HTMLElement): string =>
    serializeInline(Array.from(cell.childNodes)).replace(/\|/g, '\\|').replace(/\n+/g, ' ').trim()

  const alignOf = (cell: HTMLElement): string => {
    const style = cell.getAttribute('style') || ''
    if (/text-align:\s*center/.test(style)) return ':---:'
    if (/text-align:\s*right/.test(style)) return '---:'
    if (/text-align:\s*left/.test(style)) return ':---'
    return '---'
  }

  const headerLine = `| ${headerCells.map(cellText).join(' | ')} |`
  const alignLine = `| ${headerCells.map(alignOf).join(' | ')} |`
  const bodyLines = bodyRows.map(
    (row) => `| ${(Array.from(row.children) as HTMLElement[]).map(cellText).join(' | ')} |`
  )

  return [headerLine, alignLine, ...bodyLines].join('\n')
}

function serializeInline(nodes: ChildNode[]): string {
  return nodes.map(serializeInlineNode).join('')
}

function serializeInlineNode(node: ChildNode): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return escapeText(node.textContent || '')
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return ''
  const el = node as HTMLElement
  const tag = el.tagName

  if (isOpaque(el)) {
    const raw = decodeRaw(el.dataset.raw || '')
    if (tag === 'SUP') return raw // footnote ref: raw is already "[^label]"
    return `$${raw}$` // inline math
  }

  switch (tag) {
    case 'STRONG':
    case 'B':
      return `**${serializeInline(Array.from(el.childNodes))}**`
    case 'EM':
    case 'I':
      return `*${serializeInline(Array.from(el.childNodes))}*`
    case 'S':
    case 'DEL':
    case 'STRIKE':
      return `~~${serializeInline(Array.from(el.childNodes))}~~`
    case 'CODE': {
      const text = el.textContent || ''
      const fence = pickBacktickFence(text)
      const pad = text.startsWith('`') || text.endsWith('`') ? ' ' : ''
      return `${fence}${pad}${text}${pad}${fence}`
    }
    case 'A': {
      if (el.classList.contains('header-anchor')) return ''
      const href = el.getAttribute('href') || ''
      const title = el.getAttribute('title')
      const text = serializeInline(Array.from(el.childNodes))
      return `[${text}](${href}${title ? ` "${title}"` : ''})`
    }
    case 'IMG': {
      const alt = el.getAttribute('alt') || ''
      const src = el.getAttribute('src') || ''
      const title = el.getAttribute('title')
      return `![${alt}](${src}${title ? ` "${title}"` : ''})`
    }
    case 'BR':
      return '  \n'
    case 'INPUT':
      return ''
    default:
      return serializeInline(Array.from(el.childNodes))
  }
}

function pickBacktickFence(text: string): string {
  let n = 1
  while (text.includes('`'.repeat(n))) n++
  return '`'.repeat(n)
}

function escapeText(text: string): string {
  return text.replace(/([\\`*_[\]])/g, '\\$1')
}

function escapeLeading(text: string): string {
  return text.replace(/^(\d+)\.(\s)/, '$1\\.$2').replace(/^([#>+-])(\s|$)/, '\\$1$2')
}

/**
 * Footnote definitions round-trip verbatim from the original source rather
 * than being reconstructed from the rendered footnotes section, since
 * mapping rendered <li>/<a> structure back to `[^label]: ...` reliably would
 * require reparsing state the renderer doesn't expose. This means footnote
 * definitions aren't WYSIWYG-editable yet — a known limitation.
 */
function extractFootnoteDefs(originalContent: string): string {
  const re = /^\[\^[^\]\n]+\]:[^\n]*(?:\n(?![ \t]*\[\^)[^\n]*)*/gm
  const matches = originalContent.match(re) || []
  return matches.join('\n\n')
}
